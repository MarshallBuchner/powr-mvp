import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SAMPLE_DEMO_DURATION_MS,
  SAMPLE_DEMO_STAGES,
  canShowSampleViewReport,
  sampleDemoDurationMs,
  sampleDemoProgressPct,
  sampleDemoStageStartTimes,
  sampleDemoStepIndex,
  sampleDemoViewReportAfterMs,
} from "./sampleLabDemo.ts";

test("sample demo runs about 30 seconds (shorter with reduced motion)", () => {
  assert.ok(SAMPLE_DEMO_DURATION_MS >= 28_000);
  assert.ok(SAMPLE_DEMO_DURATION_MS <= 32_000);
  assert.equal(sampleDemoDurationMs(false), SAMPLE_DEMO_DURATION_MS);
  assert.ok(sampleDemoDurationMs(true) < SAMPLE_DEMO_DURATION_MS);
  assert.ok(sampleDemoViewReportAfterMs(false) < SAMPLE_DEMO_DURATION_MS);
});

test("sample demo copy is honest about pre-generated results", () => {
  assert.equal(SAMPLE_DEMO_STAGES.length, 3);
  for (const stage of SAMPLE_DEMO_STAGES) {
    assert.match(
      `${stage.label} ${stage.detail}`,
      /demo|sample|pre-generated|fixed/i,
    );
  }
  assert.doesNotMatch(
    SAMPLE_DEMO_STAGES.map((s) => s.detail).join(" "),
    /live AI analysis is running|calling the model|billing/i,
  );
});

test("sample demo stages and progress advance across the choreography", () => {
  const duration = SAMPLE_DEMO_DURATION_MS;
  assert.equal(sampleDemoStepIndex(0, duration), 0);
  assert.equal(sampleDemoStepIndex(duration / 2, duration), 1);
  assert.equal(sampleDemoStepIndex(duration, duration), 2);
  assert.equal(sampleDemoProgressPct(duration, duration), 100);
  assert.equal(sampleDemoStageStartTimes(duration).length, 3);
});

test("View Sample Report appears after meaningful playback", () => {
  assert.equal(
    canShowSampleViewReport({ elapsedMs: 1_000, viewAfterMs: 10_000 }),
    false,
  );
  assert.equal(
    canShowSampleViewReport({ elapsedMs: 10_000, viewAfterMs: 10_000 }),
    true,
  );
  assert.equal(
    canShowSampleViewReport({
      elapsedMs: 12_000,
      viewAfterMs: 10_000,
      isComplete: true,
    }),
    false,
  );
});
