import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageGateMessage,
  canStartAnalysis,
  isEligibleToSelfAuthorize,
} from "./consent.ts";
import {
  createShareToken,
  guestShareExpiresAt,
  isShareTokenFormat,
} from "./reportTokens.ts";

describe("consent / age gate", () => {
  it("blocks under-13 self authorization", () => {
    assert.equal(isEligibleToSelfAuthorize("under13"), false);
    assert.equal(canStartAnalysis({ ageBand: "under13", consented: true }), false);
    assert.match(ageGateMessage("under13") || "", /under 13/i);
  });

  it("requires both age eligibility and consent", () => {
    assert.equal(canStartAnalysis({ ageBand: "adult", consented: false }), false);
    assert.equal(canStartAnalysis({ ageBand: null, consented: true }), false);
    assert.equal(canStartAnalysis({ ageBand: "teen", consented: true }), true);
    assert.equal(canStartAnalysis({ ageBand: "adult", consented: true }), true);
  });
});

describe("report share tokens", () => {
  it("creates opaque hex tokens", () => {
    const token = createShareToken();
    assert.equal(isShareTokenFormat(token), true);
    assert.notEqual(token, createShareToken());
  });

  it("rejects short or non-hex tokens", () => {
    assert.equal(isShareTokenFormat("abc"), false);
    assert.equal(isShareTokenFormat("../etc/passwd"), false);
  });

  it("sets guest expiry in the future", () => {
    const expires = guestShareExpiresAt(new Date("2026-01-01T00:00:00Z"));
    assert.ok(expires.getTime() > Date.parse("2026-01-01T00:00:00Z"));
  });
});
