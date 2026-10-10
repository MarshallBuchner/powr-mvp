import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LIVE_LAB_STAGES,
  LIVE_MIN_PRESENTATION_MS,
  LIVE_REDUCED_MOTION_MIN_MS,
  canNavigateToLiveReport,
  liveLabProgressPct,
  liveLabStageCopy,
  liveMinPresentationMs,
  remainingPresentationMs,
  resolveLiveLabStageIndex,
} from "./liveLabPresentation.ts";
import { shouldDeferPoseOverlay } from "./labPlayback.ts";

test("live minimum presentation is about 25–35 seconds", () => {
  assert.ok(LIVE_MIN_PRESENTATION_MS >= 25_000);
  assert.ok(LIVE_MIN_PRESENTATION_MS <= 35_000);
  assert.equal(liveMinPresentationMs(false), LIVE_MIN_PRESENTATION_MS);
  assert.equal(liveMinPresentationMs(true), LIVE_REDUCED_MOTION_MIN_MS);
  assert.ok(LIVE_REDUCED_MOTION_MIN_MS < LIVE_MIN_PRESENTATION_MS);
});

test("live stages match the required presentation labels", () => {
  assert.equal(LIVE_LAB_STAGES.length, 5);
  assert.match(LIVE_LAB_STAGES[0].label, /Preparing your skating footage/i);
  assert.match(LIVE_LAB_STAGES[1].label, /Tracking body movement/i);
  assert.match(LIVE_LAB_STAGES[2].label, /Reviewing skating mechanics/i);
  assert.match(LIVE_LAB_STAGES[3].label, /Identifying development priorities/i);
  assert.match(LIVE_LAB_STAGES[4].label, /Preparing your coaching report/i);
});

test("fast analysis completion still waits for the presentation floor", () => {
  const min = LIVE_MIN_PRESENTATION_MS;
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: true,
      presentationElapsedMs: 1_000,
      minPresentationMs: min,
    }),
    false,
  );
  assert.ok(
    remainingPresentationMs({
      analysisReady: true,
      presentationElapsedMs: 1_000,
      minPresentationMs: min,
    }) > 20_000,
  );
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: true,
      presentationElapsedMs: min,
      minPresentationMs: min,
    }),
    true,
  );
});

test("View Report Now / forceNow skips remaining presentation once ready", () => {
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: true,
      presentationElapsedMs: 500,
      minPresentationMs: LIVE_MIN_PRESENTATION_MS,
      forceNow: true,
    }),
    true,
  );
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: false,
      presentationElapsedMs: 500,
      minPresentationMs: LIVE_MIN_PRESENTATION_MS,
      forceNow: true,
    }),
    false,
  );
});

test("slow analysis: do not navigate when presentation floor elapsed but API unfinished", () => {
  const min = LIVE_MIN_PRESENTATION_MS;
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: false,
      presentationElapsedMs: min + 5_000,
      minPresentationMs: min,
    }),
    false,
  );
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: true,
      presentationElapsedMs: min + 5_000,
      minPresentationMs: min,
    }),
    true,
  );
});

test("errors never allow navigation via presentation helpers", () => {
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: true,
      presentationElapsedMs: LIVE_MIN_PRESENTATION_MS,
      minPresentationMs: LIVE_MIN_PRESENTATION_MS,
      hasError: true,
    }),
    false,
  );
});

test("after analysis is ready, stage copy is review/presentation — not fake processing", () => {
  const idx = resolveLiveLabStageIndex({
    framesReady: true,
    analysisInFlight: false,
    analysisReady: true,
    presentationElapsedMs: 10_000,
    minPresentationMs: LIVE_MIN_PRESENTATION_MS,
  });
  const copy = liveLabStageCopy(idx, {
    framesReady: true,
    analysisInFlight: false,
    analysisReady: true,
  });
  assert.match(copy.detail, /ready|complete|Reviewing|View Report Now/i);
  assert.notEqual(copy.kind, "analyzing");
  assert.notEqual(copy.kind, "extracting");
});

test("while API is still in flight past the floor, waiting copy stays honest", () => {
  const idx = resolveLiveLabStageIndex({
    framesReady: true,
    analysisInFlight: true,
    analysisReady: false,
    presentationElapsedMs: LIVE_MIN_PRESENTATION_MS + 2_000,
    minPresentationMs: LIVE_MIN_PRESENTATION_MS,
  });
  assert.equal(idx, 4);
  const copy = liveLabStageCopy(idx, {
    framesReady: true,
    analysisInFlight: true,
    analysisReady: false,
  });
  assert.match(copy.detail, /Still building|hang tight/i);
});

test("Safari playback deferral still applies until frames are ready", () => {
  assert.equal(
    shouldDeferPoseOverlay({
      hasFile: true,
      hasPrecomputedAnalysis: false,
      framesReady: false,
    }),
    true,
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

test("progress stays below completion until both analysis and presentation are done", () => {
  const fastReady = liveLabProgressPct({
    framesReady: true,
    analysisReady: true,
    presentationElapsedMs: 2_000,
    minPresentationMs: LIVE_MIN_PRESENTATION_MS,
  });
  assert.ok(fastReady < 100);
  assert.ok(fastReady >= 90);

  const done = liveLabProgressPct({
    framesReady: true,
    analysisReady: true,
    presentationElapsedMs: LIVE_MIN_PRESENTATION_MS,
    minPresentationMs: LIVE_MIN_PRESENTATION_MS,
  });
  assert.equal(done, 100);

  const waitingOnApi = liveLabProgressPct({
    framesReady: true,
    analysisReady: false,
    presentationElapsedMs: LIVE_MIN_PRESENTATION_MS + 1_000,
    minPresentationMs: LIVE_MIN_PRESENTATION_MS,
  });
  assert.ok(waitingOnApi < 96);
});

test("cancellation / incomplete analysis cannot navigate", () => {
  // Models unmount/cancel: analysis never becomes ready.
  assert.equal(
    canNavigateToLiveReport({
      analysisReady: false,
      presentationElapsedMs: 0,
      minPresentationMs: LIVE_MIN_PRESENTATION_MS,
      forceNow: true,
    }),
    false,
  );
});
