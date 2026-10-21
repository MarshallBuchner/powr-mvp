import OpenAI from "openai";
import {
  evaluateAccountConsent,
  mapProfileConsentRow,
} from "@/lib/accountConsent";
import { issueMeasurementReceipt, MEASUREMENT_COOKIE, MEASUREMENT_TTL_SECONDS } from "@/lib/metaMeasurement";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeAssessment,
  remainingAssessments,
  type EntitlementState,
} from "@/lib/assessmentBilling";
import {
  shouldRejectAnalysisForQuality,
  stripUsabilityFields,
} from "@/lib/analysisUsability";
import {
  readEntitlementCookie,
  writeEntitlementCookie,
} from "@/lib/entitlementCookie";
import {
  foundingAllowanceExhaustedMessage,
  type FoundingBalance,
} from "@/lib/foundingAthleteAccess";
import {
  inspectFrameDataUrl,
  insufficientVideoQualityMessage,
  summarizeFrameBatch,
} from "@/lib/frameQuality";
import { isFounderUnlimited } from "@/lib/founderAccess";
import {
  canRunWithFounding,
  consumeProfileAssessment,
  readProfileEntitlementBundle,
  remainingWithFounding,
} from "@/lib/profileEntitlements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  claimAnalysisAttempt,
  decideReplay,
  findAnalysisResult,
  hashDeviceKey,
  isValidAttemptId,
  persistCompletedAnalysis,
} from "@/lib/analysisResults";
import { createClient } from "@/lib/supabase/server";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

async function getAuthedUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { supabase, user } : null;
  } catch (error) {
    console.error("POWR analyze auth lookup failed", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        {
          success: false,
          error: "Analysis is not configured in this environment.",
        },
        { status: 503 },
      );
    }

    let body: Record<string, unknown> & { frames?: unknown; goal?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const cookieEntitlement = readEntitlementCookie(request);
    const authed = await getAuthedUser();
    const founderUnlimited = Boolean(
      authed && isFounderUnlimited(authed.user.email),
    );

    let entitlement: EntitlementState = cookieEntitlement;
    let founding: FoundingBalance | null = null;
    if (authed) {
      try {
        const bundle = await readProfileEntitlementBundle(
          authed.supabase,
          authed.user,
        );
        entitlement = bundle.state;
        founding = bundle.founding;
      } catch (error) {
        console.error("POWR profile entitlement gate failed", error);
        return NextResponse.json(
          {
            success: false,
            error: "Could not verify assessment balance.",
          },
          { status: 500 },
        );
      }
    }

    // Idempotent replay: a retried attempt (same client attempt id) returns the
    // stored report — no OpenAI call and no credit consumption. Checked before
    // the balance gate so a user who just spent their last credit can recover.
    const headerAttempt = request.headers.get("idempotency-key");
    const attemptId = isValidAttemptId(headerAttempt)
      ? headerAttempt
      : isValidAttemptId(body?.attemptId)
        ? (body.attemptId as string)
        : null;
    const deviceKeyHash = hashDeviceKey(body?.deviceKey);
    const ownerUserId = authed?.user.id ?? null;
    if (attemptId) {
      const decision = decideReplay(await findAnalysisResult(attemptId), {
        userId: ownerUserId,
        deviceKeyHash,
      });
      if (decision.kind === "replay") {
        const report = decision.row.report as { analysis?: unknown };
        console.info("[POWR:analyze] idempotent_replay", { authed: Boolean(authed) });
        return NextResponse.json({
          success: true,
          replayed: true,
          analysis: report.analysis,
          remaining: remainingWithFounding(entitlement, founding),
          entitlements: {
            ...entitlement,
            unlockedSessionIds: cookieEntitlement.unlockedSessionIds,
          },
          source: authed ? "profile" : "device",
          unlimited: founderUnlimited,
          foundingAthlete: Boolean(founding?.active),
          foundingMonthRemaining: founding?.active ? founding.monthRemaining : 0,
          foundingExpiresAt: founding?.active ? founding.expiresAt : null,
          ...(decision.row.share_token
            ? {
                shareToken: decision.row.share_token,
                sharePath: `/r/s/${decision.row.share_token}`,
              }
            : {}),
        });
      }
      if (decision.kind === "in_progress") {
        return NextResponse.json(
          { success: false, error: "analysis_in_progress", retryAfterMs: 4000 },
          { status: 409 },
        );
      }
      if (decision.kind === "forbidden") {
        return NextResponse.json(
          { success: false, error: "attempt_conflict" },
          { status: 409 },
        );
      }
    }
    if (body?.replayOnly === true) {
      // Recovery lookup only — never analyzes or bills.
      return NextResponse.json(
        { success: false, error: "not_found" },
        { status: 404 },
      );
    }

    // Founder override: never 402; balances are not consumed below.
    // Founding athletes use monthly complimentary allowance before paid credits.
    if (!founderUnlimited && !canRunWithFounding(entitlement, founding)) {
      const foundingExhausted =
        Boolean(founding?.active) && founding!.monthRemaining <= 0;
      // Reaching here means free + paid are also empty.
      return NextResponse.json(
        {
          success: false,
          error: "free_assessment_used",
          message: foundingExhausted
            ? foundingAllowanceExhaustedMessage({ hasOtherBalance: false })
            : "You've used your free assessment. Unlock a pack to analyze another clip.",
          remaining: 0,
          foundingAthlete: Boolean(founding?.active),
          foundingMonthRemaining: founding?.active
            ? founding.monthRemaining
            : 0,
          canPurchase: true,
        },
        { status: 402 },
      );
    }

    const { frames, goal } = body;

    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No video frames were provided.",
        },
        { status: 400 },
      );
    }

    // Structural frame gate (blank / tiny payloads) — never bill these.
    const frameInspections = frames.map((frame: unknown) =>
      inspectFrameDataUrl(typeof frame === "string" ? frame : null),
    );
    const frameBatch = summarizeFrameBatch(frameInspections);
    if (!frameBatch.usable) {
      return NextResponse.json(
        {
          success: false,
          error: "insufficient_video_quality",
          message: insufficientVideoQualityMessage(frameBatch.issues),
          issues: frameBatch.issues,
        },
        { status: 422 },
      );
    }

    const payloadChars = frames.reduce(
      (n: number, f: unknown) => n + (typeof f === "string" ? f.length : 0),
      0,
    );
    console.info("[POWR:analyze] start", {
      frameCount: frames.length,
      payloadChars,
      hasAttemptId: Boolean(attemptId),
      authed: Boolean(authed),
    });
    const startedAt = Date.now();
    if (attemptId) {
      await claimAnalysisAttempt({ attemptId, ownerUserId, deviceKeyHash });
    }

    const imageInputs = frames.map((frame: string) => ({
      type: "input_image" as const,
      image_url: frame,
      detail: "high" as const,
    }));

    const response = await openai.responses.create({
      model: "gpt-5.6",
      // Prefer not to store responses for provider training/retention when supported.
      store: false,

      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are POWR, an AI hockey development coach.

You are reviewing still frames sampled chronologically from a hockey player's skating video.

The player's selected development goal is: ${goal}.

Only evaluate things that can reasonably be observed from these frames.

Important rules:
- Do not invent skating speed.
- Do not invent exact joint angles.
- Do not claim to observe complete stride cycles if the frames do not show them.
- Do not claim biomechanical certainty from limited evidence.
- If evidence is limited, lower confidence rather than making something up.
- Scores should reflect the visible evidence and should not automatically be high.
- Keep feedback encouraging, specific, and coach-like.
- Prioritize useful development advice over technical jargon.
- First decide whether the frames are usable for a skating assessment.
- Set assessmentUsable to false when the skater's legs/feet are cut off, the body is mostly out of frame, frames are blank/black/corrupted, the subject is not clearly a skater in motion, or there is not enough visible skating evidence to score mechanics.
- When assessmentUsable is false: explain why in usabilityReason, set confidence.label to "Low", and do not invent detailed skating scores as if the clip were clear.
- When assessmentUsable is true: the full body (or enough of the lower body for skating mechanics) should be visible enough to coach from.

Evaluate (only when assessmentUsable is true):
- skating stance and knee bend
- stride extension
- stride recovery
- balance and stability
- upper-body posture
- overall mechanics relevant to the selected goal

Return a development assessment suitable for POWR.
              `.trim(),
            },
            ...imageInputs,
          ],
        },
      ],

      text: {
        format: {
          type: "json_schema",
          name: "powr_skating_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              overallScore: {
                type: "integer",
                minimum: 0,
                maximum: 100,
              },

              summary: {
                type: "string",
              },

              strengths: {
                type: "array",
                items: {
                  type: "string",
                },
              },

              priorityImprovement: {
                type: "string",
              },

              whyItMatters: {
                type: "string",
              },

              movementMetrics: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: "string",
                    },

                    score: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100,
                    },

                    explanation: {
                      type: "string",
                    },

                    observations: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          type: {
                            type: "string",
                            enum: ["good", "improve"],
                          },

                          text: {
                            type: "string",
                          },
                        },
                        required: ["type", "text"],
                      },
                    },

                    whyItMatters: {
                      type: "string",
                    },
                  },
                  required: [
                    "title",
                    "score",
                    "explanation",
                    "observations",
                    "whyItMatters",
                  ],
                },
              },

              drills: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: "string",
                    },

                    description: {
                      type: "string",
                    },

                    duration: {
                      type: "string",
                    },
                  },
                  required: ["title", "description", "duration"],
                },
              },

              confidence: {
                type: "object",
                additionalProperties: false,
                properties: {
                  score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                  },

                  label: {
                    type: "string",
                    enum: ["Low", "Moderate", "High"],
                  },

                  reason: {
                    type: "string",
                  },
                },
                required: ["score", "label", "reason"],
              },

              assessmentUsable: {
                type: "boolean",
              },

              usabilityReason: {
                type: "string",
              },
            },

            required: [
              "overallScore",
              "summary",
              "strengths",
              "priorityImprovement",
              "whyItMatters",
              "movementMetrics",
              "drills",
              "confidence",
              "assessmentUsable",
              "usabilityReason",
            ],
          },
        },
      },
    });

    const rawAnalysis = JSON.parse(response.output_text) as Record<
      string,
      unknown
    >;

    // Unusable footage must never produce a billed skating score.
    const qualityGate = shouldRejectAnalysisForQuality(rawAnalysis);
    if (qualityGate.reject) {
      // Diagnostic only: no frames, reason text, user ids, or secrets.
      const confidence = rawAnalysis.confidence as
        | { score?: unknown; label?: unknown }
        | undefined;
      console.warn("[POWR:analyze] quality_gate_422", {
        assessmentUsable: rawAnalysis.assessmentUsable === true,
        confidenceLabel:
          typeof confidence?.label === "string" ? confidence.label : null,
        confidenceScore:
          typeof confidence?.score === "number" ? confidence.score : null,
        metricCount: Array.isArray(rawAnalysis.movementMetrics)
          ? rawAnalysis.movementMetrics.length
          : 0,
        frameCount: frames.length,
        authed: Boolean(authed),
      });
      return NextResponse.json(
        {
          success: false,
          error: "insufficient_video_quality",
          message: qualityGate.reason,
        },
        { status: 422 },
      );
    }

    const analysis = stripUsabilityFields(rawAnalysis);

    // Consume only after successful *usable* analysis (not on retries/errors above).
    // Founder unlimited: skip consume entirely — balances stay untouched.
    let nextEntitlement: EntitlementState;
    let nextFounding: FoundingBalance | null = founding;
    let remaining = remainingWithFounding(entitlement, founding);
    if (founderUnlimited && authed) {
      nextEntitlement = {
        ...entitlement,
        unlockedSessionIds: cookieEntitlement.unlockedSessionIds,
      };
      remaining = remainingWithFounding(nextEntitlement, nextFounding);
    } else if (authed) {
      const consumed = await consumeProfileAssessment(authed.supabase);
      if (!consumed.ok) {
        // Extremely rare race after a successful model response — still return
        // the analysis; balance already reflects empty/competitor win.
        console.error("POWR consume race after successful analysis", {
          remaining: consumed.remaining,
        });
      }
      nextEntitlement = {
        ...consumed.state,
        unlockedSessionIds: cookieEntitlement.unlockedSessionIds,
      };
      nextFounding = consumed.founding;
      remaining = consumed.remaining;
    } else {
      nextEntitlement = consumeAssessment(cookieEntitlement);
      remaining = remainingAssessments(nextEntitlement);
    }

    // Meta CAPI: never trust client marketing flags for signed-in users.
    // Authed adults need persisted marketing consent; teens/minors never measure.
    // Guests may arm only with explicit adult + opt-in flags (fail closed).
    // Tracking failures must not affect analysis results (receipt issue is sync/local).
    let measureAdult = false;
    let measureConsent = false;
    if (authed) {
      try {
        const { data: consentRow } = await authed.supabase
          .from("profiles")
          .select(
            "age_band, age_confirmed_at, terms_version, terms_accepted_at, privacy_version, privacy_accepted_at, analysis_consent_at, marketing_consent, marketing_consent_at, marketing_consent_withdrawn_at",
          )
          .eq("id", authed.user.id)
          .maybeSingle();
        const account = evaluateAccountConsent(
          mapProfileConsentRow(consentRow),
        );
        measureAdult = account.ageBand === "adult";
        measureConsent = account.canMeasureAds;
      } catch (error) {
        console.error("POWR analyze consent lookup failed", error);
        measureAdult = false;
        measureConsent = false;
      }
    } else {
      measureAdult = body.marketingAdult === true;
      measureConsent = body.marketingConsent === true;
    }

    const measurement = issueMeasurementReceipt({
      adult: measureAdult,
      consent: measureConsent,
      fbclid: measureConsent ? body.marketingClickId : undefined,
    });
    // Persist the report + share link BEFORE responding so an iOS tab kill
    // after this point never loses a billed assessment. Best effort.
    const persisted = await persistCompletedAnalysis({
      attemptId,
      ownerUserId,
      deviceKeyHash,
      goal: typeof goal === "string" ? goal : "",
      fileName:
        typeof body.fileName === "string" && body.fileName.trim()
          ? body.fileName.trim().slice(0, 200)
          : "Skating assessment",
      duration: typeof body.duration === "number" ? body.duration : null,
      analysis: analysis as Record<string, unknown>,
    });
    console.info("[POWR:analyze] success", {
      ms: Date.now() - startedAt,
      persisted: Boolean(persisted),
      authed: Boolean(authed),
    });

    const json = NextResponse.json({
      success: true,
      ...(persisted
        ? { shareToken: persisted.shareToken, sharePath: persisted.sharePath }
        : {}),
      ...(measurement ? { marketingEventId: measurement.id } : {}),
      analysis,
      remaining,
      entitlements: nextEntitlement,
      source: authed ? "profile" : "device",
      unlimited: founderUnlimited,
      foundingAthlete: Boolean(nextFounding?.active),
      foundingMonthRemaining: nextFounding?.active
        ? nextFounding.monthRemaining
        : 0,
      foundingExpiresAt: nextFounding?.active ? nextFounding.expiresAt : null,
    });

    // A new analysis clears any stale completion proof, including when consent is declined.
    json.cookies.set(MEASUREMENT_COOKIE, measurement?.value ?? "", {
      path: "/api/marketing/complete", httpOnly: true, secure: true,
      sameSite: "strict", maxAge: measurement ? MEASUREMENT_TTL_SECONDS : 0,
    });
    return writeEntitlementCookie(json, nextEntitlement);
  } catch (error) {
    console.error("POWR analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Analysis request failed.",
      },
      { status: 500 },
    );
  }
}