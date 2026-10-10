import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveLabPlaybackPhase,
  shouldDeferPoseOverlay,
  snapshotVideoPlayback,
} from "./labPlayback.ts";

test("live analysis defers pose overlay until frames are ready", () => {
  assert.equal(
    resolveLabPlaybackPhase({
      hasFile: true,
      hasPrecomputedAnalysis: false,
      framesReady: false,
    }),
    "extracting",
  );
  assert.equal(
    shouldDeferPoseOverlay({
      hasFile: true,
      hasPrecomputedAnalysis: false,
      framesReady: false,
    }),
    true,
  );
  assert.equal(
    resolveLabPlaybackPhase({
      hasFile: true,
      hasPrecomputedAnalysis: false,
      framesReady: true,
    }),
    "overlay",
  );
  assert.equal(
    shouldDeferPoseOverlay({
      hasFile: true,
      hasPrecomputedAnalysis: false,
      framesReady: true,
    }),
    false,
  );
});

test("sample / theatrical path never defers the overlay player", () => {
  assert.equal(
    resolveLabPlaybackPhase({
      hasFile: false,
      hasPrecomputedAnalysis: true,
      framesReady: false,
    }),
    "theatrical",
  );
  assert.equal(
    shouldDeferPoseOverlay({
      hasFile: false,
      hasPrecomputedAnalysis: true,
      framesReady: false,
    }),
    false,
  );
});

test("snapshotVideoPlayback captures stall-relevant fields", () => {
  const snap = snapshotVideoPlayback({
    readyState: 2,
    networkState: 1,
    paused: true,
    ended: false,
    seeking: false,
    muted: true,
    loop: true,
    currentTime: 1.25,
    duration: 12,
    videoWidth: 1080,
    videoHeight: 1920,
    error: null,
  });
  assert.equal(snap.paused, true);
  assert.equal(snap.readyState, 2);
  assert.equal(snap.videoWidth, 1080);
  assert.equal(snap.errorCode, null);
});
