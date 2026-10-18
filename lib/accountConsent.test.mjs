import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_ACCOUNT_CONSENT,
  PRIVACY_VERSION,
  TERMS_VERSION,
  evaluateAccountConsent,
  mapProfileConsentRow,
  resolveMarketingMeasurementAllowed,
} from "./accountConsent.ts";

describe("account consent evaluation", () => {
  it("requires age, analysis, and current legal versions for onboarding", () => {
    const incomplete = evaluateAccountConsent(EMPTY_ACCOUNT_CONSENT);
    assert.equal(incomplete.onboardingComplete, false);
    assert.equal(incomplete.canUseAnalysis, false);
    assert.equal(incomplete.canMeasureAds, false);

    const ready = evaluateAccountConsent({
      ageBand: "adult",
      ageConfirmedAt: "2026-10-17T00:00:00.000Z",
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: "2026-10-17T00:00:00.000Z",
      privacyVersion: PRIVACY_VERSION,
      privacyAcceptedAt: "2026-10-17T00:00:00.000Z",
      analysisConsentAt: "2026-10-17T00:00:00.000Z",
      marketingConsent: false,
      marketingConsentAt: null,
      marketingConsentWithdrawnAt: null,
    });
    assert.equal(ready.onboardingComplete, true);
    assert.equal(ready.canUseAnalysis, true);
    assert.equal(ready.canMeasureAds, false);
  });

  it("reprompts when terms or privacy versions change", () => {
    const stale = evaluateAccountConsent({
      ageBand: "adult",
      ageConfirmedAt: "2026-10-01T00:00:00.000Z",
      termsVersion: "old-terms",
      termsAcceptedAt: "2026-10-01T00:00:00.000Z",
      privacyVersion: PRIVACY_VERSION,
      privacyAcceptedAt: "2026-10-01T00:00:00.000Z",
      analysisConsentAt: "2026-10-01T00:00:00.000Z",
      marketingConsent: true,
      marketingConsentAt: "2026-10-01T00:00:00.000Z",
      marketingConsentWithdrawnAt: null,
    });
    assert.equal(stale.needsTermsReprompt, true);
    assert.equal(stale.onboardingComplete, false);
    assert.equal(stale.canMeasureAds, false);
  });

  it("allows Meta measurement only for adults with active marketing consent", () => {
    const base = {
      ageBand: "adult",
      ageConfirmedAt: "2026-10-17T00:00:00.000Z",
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: "2026-10-17T00:00:00.000Z",
      privacyVersion: PRIVACY_VERSION,
      privacyAcceptedAt: "2026-10-17T00:00:00.000Z",
      analysisConsentAt: "2026-10-17T00:00:00.000Z",
      marketingConsent: true,
      marketingConsentAt: "2026-10-17T00:00:00.000Z",
      marketingConsentWithdrawnAt: null,
    };
    assert.equal(evaluateAccountConsent(base).canMeasureAds, true);

    const teen = evaluateAccountConsent({ ...base, ageBand: "teen" });
    assert.equal(teen.canMeasureAds, false);

    const withdrawn = evaluateAccountConsent({
      ...base,
      marketingConsent: false,
      marketingConsentWithdrawnAt: "2026-10-17T12:00:00.000Z",
    });
    assert.equal(withdrawn.canMeasureAds, false);
  });

  it("maps profile rows fail-closed for invalid age bands", () => {
    const mapped = mapProfileConsentRow({
      age_band: "under13",
      marketing_consent: true,
    });
    assert.equal(mapped.ageBand, null);
    assert.equal(mapped.marketingConsent, true);
    assert.equal(evaluateAccountConsent(mapped).canMeasureAds, false);
  });
});

describe("resolveMarketingMeasurementAllowed", () => {
  it("uses account canMeasureAds for authenticated users", () => {
    const account = evaluateAccountConsent({
      ageBand: "adult",
      ageConfirmedAt: "2026-10-17T00:00:00.000Z",
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: "2026-10-17T00:00:00.000Z",
      privacyVersion: PRIVACY_VERSION,
      privacyAcceptedAt: "2026-10-17T00:00:00.000Z",
      analysisConsentAt: "2026-10-17T00:00:00.000Z",
      marketingConsent: true,
      marketingConsentAt: "2026-10-17T00:00:00.000Z",
      marketingConsentWithdrawnAt: null,
    });
    assert.equal(
      resolveMarketingMeasurementAllowed({
        authenticated: true,
        account,
        guestAgeBand: "adult",
        guestMarketingConsent: true,
      }),
      true,
    );
    assert.equal(
      resolveMarketingMeasurementAllowed({
        authenticated: true,
        account: { ...account, marketingConsent: false, canMeasureAds: false },
      }),
      false,
    );
  });

  it("allows guest measurement only for explicit adult opt-in", () => {
    assert.equal(
      resolveMarketingMeasurementAllowed({
        authenticated: false,
        guestAgeBand: "adult",
        guestMarketingConsent: true,
      }),
      true,
    );
    assert.equal(
      resolveMarketingMeasurementAllowed({
        authenticated: false,
        guestAgeBand: "teen",
        guestMarketingConsent: true,
      }),
      false,
    );
    assert.equal(
      resolveMarketingMeasurementAllowed({
        authenticated: false,
        guestAgeBand: "adult",
        guestMarketingConsent: false,
      }),
      false,
    );
  });
});
