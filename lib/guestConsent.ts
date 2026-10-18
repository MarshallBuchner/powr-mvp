/**
 * Guest (signed-out) consent persistence in localStorage.
 * Cleared notions of account onboarding — guests must still pass age + analysis ack.
 */

import type { AgeBand } from "@/lib/consent";
import {
  PRIVACY_VERSION,
  TERMS_VERSION,
  isEligibleAgeBand,
  type EligibleAgeBand,
} from "@/lib/accountConsent";

export const GUEST_CONSENT_STORAGE_KEY = "powr_guest_consent_v1";

export type GuestConsentRecord = {
  ageBand: EligibleAgeBand | null;
  termsVersion: string | null;
  privacyVersion: string | null;
  analysisConsentAt: string | null;
  /** Optional Meta ads measurement — default false; adults only. */
  marketingConsent: boolean;
  updatedAt: string | null;
};

export const EMPTY_GUEST_CONSENT: GuestConsentRecord = {
  ageBand: null,
  termsVersion: null,
  privacyVersion: null,
  analysisConsentAt: null,
  marketingConsent: false,
  updatedAt: null,
};

export function guestConsentComplete(record: GuestConsentRecord): boolean {
  return Boolean(
    isEligibleAgeBand(record.ageBand) &&
      record.analysisConsentAt &&
      record.termsVersion === TERMS_VERSION &&
      record.privacyVersion === PRIVACY_VERSION,
  );
}

export function readGuestConsent(): GuestConsentRecord {
  if (typeof window === "undefined") return { ...EMPTY_GUEST_CONSENT };
  try {
    const raw = localStorage.getItem(GUEST_CONSENT_STORAGE_KEY);
    if (!raw) return { ...EMPTY_GUEST_CONSENT };
    const parsed = JSON.parse(raw) as Partial<GuestConsentRecord>;
    const ageBand = isEligibleAgeBand(parsed.ageBand) ? parsed.ageBand : null;
    return {
      ageBand,
      termsVersion:
        typeof parsed.termsVersion === "string" ? parsed.termsVersion : null,
      privacyVersion:
        typeof parsed.privacyVersion === "string"
          ? parsed.privacyVersion
          : null,
      analysisConsentAt:
        typeof parsed.analysisConsentAt === "string"
          ? parsed.analysisConsentAt
          : null,
      marketingConsent: parsed.marketingConsent === true && ageBand === "adult",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
  } catch {
    return { ...EMPTY_GUEST_CONSENT };
  }
}

export function writeGuestConsent(
  input: Partial<GuestConsentRecord> & { ageBand?: AgeBand | null },
): GuestConsentRecord {
  const current = readGuestConsent();
  const ageBand = isEligibleAgeBand(input.ageBand)
    ? input.ageBand
    : input.ageBand === null
      ? null
      : current.ageBand;
  const next: GuestConsentRecord = {
    ageBand,
    termsVersion:
      input.termsVersion !== undefined
        ? input.termsVersion
        : current.termsVersion,
    privacyVersion:
      input.privacyVersion !== undefined
        ? input.privacyVersion
        : current.privacyVersion,
    analysisConsentAt:
      input.analysisConsentAt !== undefined
        ? input.analysisConsentAt
        : current.analysisConsentAt,
    marketingConsent:
      ageBand === "adult" &&
      (input.marketingConsent !== undefined
        ? input.marketingConsent === true
        : current.marketingConsent),
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(GUEST_CONSENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage failures must not block analysis.
  }
  return next;
}

export function clearGuestMarketingConsent(): GuestConsentRecord {
  return writeGuestConsent({ marketingConsent: false });
}
