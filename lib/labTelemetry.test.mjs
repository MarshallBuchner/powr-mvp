import assert from "node:assert/strict";
import { test } from "node:test";
import { createRateLimiter, sanitizeTelemetry, uaFamily } from "./labTelemetry.ts";

test("telemetry keeps only allowlisted fields", () => {
  const e = sanitizeTelemetry({
    event: "pagehide", stage: "analyze_sent", navType: "reload",
    attemptId: "22222222-2222-4222-8222-222222222222",
    frameWidth: 540, frameHeight: 960, frameCount: 5, payloadBytes: 150000,
    email: "kid@example.com", fileName: "IMG_0001.MOV", frames: ["data:image/jpeg;base64,xx"],
  });
  assert.equal(e.event, "pagehide");
  assert.equal(e.frameWidth, 540);
  const s = JSON.stringify(e);
  assert.doesNotMatch(s, /example\.com|IMG_0001|base64/);
});

test("unknown events / junk are rejected", () => {
  assert.equal(sanitizeTelemetry({ event: "hack" }), null);
  assert.equal(sanitizeTelemetry(null), null);
  assert.equal(sanitizeTelemetry({ event: "stage", stage: "x" }).stage, null);
});

test("UA family is coarse", () => {
  assert.equal(uaFamily("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"), "ios-safari");
  assert.equal(uaFamily("Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36"), "desktop-chrome");
});

test("rate limiter caps per key per window", () => {
  const allow = createRateLimiter(2, 1000);
  assert.equal(allow("a", 0), true);
  assert.equal(allow("a", 1), true);
  assert.equal(allow("a", 2), false);
  assert.equal(allow("b", 2), true);
  assert.equal(allow("a", 2000), true);
});
