import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeAssessment,
  remainingAssessments,
  type EntitlementState,
} from "@/lib/assessmentBilling";
import {
  readEntitlementCookie,
  writeEntitlementCookie,
} from "@/lib/entitlementCookie";
import type { FoundingBalance } from "@/lib/foundingAthleteAccess";
import { isFounderUnlimited } from "@/lib/founderAccess";
import {
  canRunWithFounding,
  consumeProfileAssessment,
  readProfileEntitlementBundle,
  remainingWithFounding,
} from "@/lib/profileEntitlements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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

    // Founder override: never 402; balances are not consumed below.
    // Founding athletes use monthly complimentary allowance before paid credits.
    if (!founderUnlimited && !canRunWithFounding(entitlement, founding)) {
      const foundingExhausted =
        Boolean(founding?.active) && founding!.monthRemaining <= 0;
      return NextResponse.json(
        {
          success: false,
          error: "free_assessment_used",
          message: foundingExhausted
            ? "You've used this month's complimentary Founding Athlete assessments. They renew next month."
            : "You've used your free assessment. Unlock a pack to analyze another clip.",
          remaining: 0,
          foundingAthlete: Boolean(founding?.active),
          foundingMonthRemaining: founding?.active
            ? founding.monthRemaining
            : 0,
        },
        { status: 402 },
      );
    }

    const body = await request.json();
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

Evaluate:
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
            ],
          },
        },
      },
    });

    const analysis = JSON.parse(response.output_text);

    // Consume only after successful analysis (not on retries/errors above).
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

    const json = NextResponse.json({
      success: true,
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