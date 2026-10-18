import { NextRequest, NextResponse } from "next/server";
import {
  EMPTY_ACCOUNT_CONSENT,
  PRIVACY_VERSION,
  TERMS_VERSION,
  evaluateAccountConsent,
  isEligibleAgeBand,
  mapProfileConsentRow,
  type EligibleAgeBand,
} from "@/lib/accountConsent";
import { ensureProfileRow } from "@/lib/profileEntitlements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const CONSENT_SELECT =
  "age_band, age_confirmed_at, terms_version, terms_accepted_at, privacy_version, privacy_accepted_at, analysis_consent_at, marketing_consent, marketing_consent_at, marketing_consent_withdrawn_at";

async function getAuthed() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { supabase, user } : null;
  } catch (error) {
    console.error("POWR account consent auth lookup failed", error);
    return null;
  }
}

async function readConsentStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email?: string | null,
) {
  await ensureProfileRow(supabase, userId, email);
  const { data, error } = await supabase
    .from("profiles")
    .select(CONSENT_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Migration may not be applied yet — fail soft with empty consent.
    console.error("POWR account consent read failed", error);
    return evaluateAccountConsent(EMPTY_ACCOUNT_CONSENT);
  }

  return evaluateAccountConsent(mapProfileConsentRow(data));
}

export async function GET() {
  const authed = await getAuthed();
  if (!authed) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const status = await readConsentStatus(
      authed.supabase,
      authed.user.id,
      authed.user.email,
    );
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("POWR account consent GET failed", error);
    return NextResponse.json(
      { error: "Could not load consent status." },
      { status: 500 },
    );
  }
}

type ConsentPostBody = {
  ageBand?: unknown;
  acceptLegal?: unknown;
  acceptAnalysis?: unknown;
  marketingConsent?: unknown;
  /** Privacy settings: only update marketing preference. */
  marketingOnly?: unknown;
};

export async function POST(request: NextRequest) {
  const authed = await getAuthed();
  if (!authed) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ConsentPostBody;
  const now = new Date().toISOString();

  try {
    await ensureProfileRow(
      authed.supabase,
      authed.user.id,
      authed.user.email,
    );

    const current = await readConsentStatus(
      authed.supabase,
      authed.user.id,
      authed.user.email,
    );

    if (body.marketingOnly === true) {
      const wantsMarketing = body.marketingConsent === true;
      if (wantsMarketing && current.ageBand !== "adult") {
        return NextResponse.json(
          {
            error:
              "Optional advertising measurement is only available for accounts confirmed as 18 or older.",
          },
          { status: 400 },
        );
      }

      const patch = wantsMarketing
        ? {
            marketing_consent: true,
            marketing_consent_at: now,
            marketing_consent_withdrawn_at: null,
          }
        : {
            marketing_consent: false,
            marketing_consent_withdrawn_at: now,
          };

      const { error } = await authed.supabase
        .from("profiles")
        .update(patch)
        .eq("id", authed.user.id);

      if (error) {
        console.error("POWR marketing consent update failed", error);
        return NextResponse.json(
          { error: "Could not update advertising preference." },
          { status: 500 },
        );
      }

      const status = await readConsentStatus(
        authed.supabase,
        authed.user.id,
        authed.user.email,
      );
      return NextResponse.json(status, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // Full onboarding / legal re-prompt acceptance.
    const ageBandRaw = body.ageBand;
    let ageBand: EligibleAgeBand | null = current.ageBand;

    if (ageBandRaw === "under13") {
      return NextResponse.json(
        {
          error:
            "POWR assessments are not available for self-service use by children under 13.",
        },
        { status: 400 },
      );
    }

    if (isEligibleAgeBand(ageBandRaw)) {
      ageBand = ageBandRaw;
    } else if (!current.ageBand) {
      return NextResponse.json(
        { error: "Confirm your age eligibility to continue." },
        { status: 400 },
      );
    }

    if (body.acceptLegal !== true) {
      return NextResponse.json(
        { error: "Accept the Terms of Service and Privacy Policy to continue." },
        { status: 400 },
      );
    }

    if (body.acceptAnalysis !== true && !current.analysisConsentAt) {
      return NextResponse.json(
        { error: "Confirm analysis consent to continue." },
        { status: 400 },
      );
    }

    const wantsMarketing =
      ageBand === "adult" && body.marketingConsent === true;

    const patch: Record<string, unknown> = {
      age_band: ageBand,
      age_confirmed_at: current.ageConfirmedAt ?? now,
      terms_version: TERMS_VERSION,
      terms_accepted_at: now,
      privacy_version: PRIVACY_VERSION,
      privacy_accepted_at: now,
      analysis_consent_at: current.analysisConsentAt ?? now,
    };

    if (body.acceptAnalysis === true) {
      patch.analysis_consent_at = now;
    }

    // Age change to teen clears any prior marketing consent.
    if (ageBand !== "adult") {
      patch.marketing_consent = false;
      if (current.marketingConsent || current.marketingConsentAt) {
        patch.marketing_consent_withdrawn_at = now;
      }
    } else if (body.marketingConsent !== undefined) {
      if (wantsMarketing) {
        patch.marketing_consent = true;
        patch.marketing_consent_at = now;
        patch.marketing_consent_withdrawn_at = null;
      } else {
        patch.marketing_consent = false;
        if (current.marketingConsent) {
          patch.marketing_consent_withdrawn_at = now;
        }
      }
    }

    // First-time age confirmation should stamp confirmed_at even if age was set.
    if (!current.ageConfirmedAt || current.ageBand !== ageBand) {
      patch.age_confirmed_at = now;
    }

    const { error } = await authed.supabase
      .from("profiles")
      .update(patch)
      .eq("id", authed.user.id);

    if (error) {
      console.error("POWR account consent save failed", error);
      return NextResponse.json(
        { error: "Could not save consent." },
        { status: 500 },
      );
    }

    const status = await readConsentStatus(
      authed.supabase,
      authed.user.id,
      authed.user.email,
    );
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("POWR account consent POST failed", error);
    return NextResponse.json(
      { error: "Could not save consent." },
      { status: 500 },
    );
  }
}
