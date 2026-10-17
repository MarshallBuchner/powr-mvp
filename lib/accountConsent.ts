/**
 * Account-level eligibility + legal acceptance helpers.
 * Age/terms/privacy are collected at signup/onboarding for authenticated users.
 * Marketing (Meta CAPI) is optional, default off, and never applies to minors.
 */

import type { AgeBand } from "@/lib/consent";

/** Bump when Terms change materially and re-acceptance is required. */
export const TERMS_VERSION = "2026-09-27";

/** Bump when Privacy Policy changes materially (incl. Meta measurement copy). */
export const PRIVACY_VERSION = "2026-10-17";

export type EligibleAgeBand = Exclude<AgeBand, "under13">;

export type AccountConsentRecord = {
  ageBand: EligibleAgeBand | null;
  ageConfirmedAt: string | null;
  termsVersion: string | null;
  termsAcceptedAt: string | null;
  privacyVersion: string | null;
  privacyAcceptedAt: string | null;
  analysisConsentAt: string | null;
  marketingConsent: boolean;
  marketingConsentAt: string | null;
  marketingConsentWithdrawnAt: string | null;
};

export type AccountConsentStatus = AccountConsentRecord & {
  onboardingComplete: boolean;
  needsTermsReprompt: boolean;
  needsPrivacyReprompt: boolean;
  canUseAnalysis: boolean;
  canMeasureAds: boolean;
};

export const EMPTY_ACCOUNT_CONSENT: AccountConsentRecord = {
  ageBand: null,
  ageConfirmedAt: null,
  termsVersion: null,
  termsAcceptedAt: null,
  privacyVersion: null,
  privacyAcceptedAt: null,
  analysisConsentAt: null,
  marketingConsent: false,
  marketingConsentAt: null,
  marketingConsentWithdrawnAt: null,
};

export function isEligibleAgeBand(value: unknown): value is EligibleAgeBand {
  return value === "teen" || value === "adult";
}

export function evaluateAccountConsent(
  record: AccountConsentRecord,
): AccountConsentStatus {
  const needsTermsReprompt =
    !record.termsAcceptedAt || record.termsVersion !== TERMS_VERSION;
  const needsPrivacyReprompt =
    !record.privacyAcceptedAt || record.privacyVersion !== PRIVACY_VERSION;
  const onboardingComplete = Boolean(
    isEligibleAgeBand(record.ageBand) &&
      record.ageConfirmedAt &&
      record.analysisConsentAt &&
      !needsTermsReprompt &&
      !needsPrivacyReprompt,
  );
  const canUseAnalysis = onboardingComplete;
  const canMeasureAds =
    onboardingComplete &&
    record.ageBand === "adult" &&
    record.marketingConsent === true &&
    !record.marketingConsentWithdrawnAt;

  return {
    ...record,
    onboardingComplete,
    needsTermsReprompt,
    needsPrivacyReprompt,
    canUseAnalysis,
    canMeasureAds,
  };
}

export function mapProfileConsentRow(row: Record<string, unknown> | null | undefined): AccountConsentRecord {
  if (!row) return { ...EMPTY_ACCOUNT_CONSENT };
  const ageBand = isEligibleAgeBand(row.age_band) ? row.age_band : null;
  return {
    ageBand,
    ageConfirmedAt:
      typeof row.age_confirmed_at === "string" ? row.age_confirmed_at : null,
    termsVersion:
      typeof row.terms_version === "string" ? row.terms_version : null,
    termsAcceptedAt:
      typeof row.terms_accepted_at === "string" ? row.terms_accepted_at : null,
    privacyVersion:
      typeof row.privacy_version === "string" ? row.privacy_version : null,
    privacyAcceptedAt:
      typeof row.privacy_accepted_at === "string"
        ? row.privacy_accepted_at
        : null,
    analysisConsentAt:
      typeof row.analysis_consent_at === "string"
        ? row.analysis_consent_at
        : null,
    marketingConsent: row.marketing_consent === true,
    marketingConsentAt:
      typeof row.marketing_consent_at === "string"
        ? row.marketing_consent_at
        : null,
    marketingConsentWithdrawnAt:
      typeof row.marketing_consent_withdrawn_at === "string"
        ? row.marketing_consent_withdrawn_at
        : null,
  };
}

/**
 * Whether Meta measurement may be armed for this assessment.
 * Never for teens/under-13. Authed users require persisted adult marketing consent.
 */
export function resolveMarketingMeasurementAllowed(input: {
  authenticated: boolean;
  account?: AccountConsentStatus | null;
  guestAgeBand?: AgeBand | null;
  guestMarketingConsent?: boolean;
}): boolean {
  if (input.authenticated) {
    return Boolean(input.account?.canMeasureAds);
  }
  // Guests: only adults with an explicit opt-in (never default).
  return (
    input.guestAgeBand === "adult" && input.guestMarketingConsent === true
  );
}
