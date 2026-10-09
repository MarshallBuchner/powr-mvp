import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SAMPLE_DEMO_DURATION_MS,
  SAMPLE_DEMO_STAGES,
  sampleDemoProgressPct,
  sampleDemoStageStartTimes,
  sampleDemoStepIndex,
} from "./sampleLabDemo.ts";

test("sample demo runs 12–15 seconds", () => {
  assert.ok(SAMPLE_DEMO_DURATION_MS >= 12_000);
  assert.ok(SAMPLE_DEMO_DURATION_MS <= 15_000);
});

test("sample demo uses the three polished progress messages", () => {
  assert.equal(SAMPLE_DEMO_STAGES.length, 3);
  assert.match(SAMPLE_DEMO_STAGES[0].label, /Tracking skating movement/i);
  assert.match(SAMPLE_DEMO_STAGES[1].label, /Analyzing skating technique/i);
  assert.match(SAMPLE_DEMO_STAGES[2].label, /Preparing your report/i);
  for (const stage of SAMPLE_DEMO_STAGES) {
    assert.match(stage.detail, /demo|sample|pre-generated|fixed/i);
  }
});

test("sampleDemoStepIndex advances across the choreography", () => {
  assert.equal(sampleDemoStepIndex(0), 0);
  assert.equal(sampleDemoStepIndex(1_000), 0);
  assert.equal(sampleDemoStepIndex(5_000), 1);
  assert.equal(sampleDemoStepIndex(10_000), 2);
  assert.equal(sampleDemoStepIndex(SAMPLE_DEMO_DURATION_MS), 2);
});

test("sampleDemoProgressPct reaches 100 at the end", () => {
  assert.equal(sampleDemoProgressPct(0), 0);
  assert.ok(sampleDemoProgressPct(SAMPLE_DEMO_DURATION_MS / 2) >= 45);
  assert.equal(sampleDemoProgressPct(SAMPLE_DEMO_DURATION_MS), 100);
});

test("sampleDemoStageStartTimes covers each stage once", () => {
  const starts = sampleDemoStageStartTimes();
  assert.equal(starts.length, 3);
  assert.equal(starts[0], 0);
  assert.ok(starts[1] > starts[0]);
  assert.ok(starts[2] > starts[1]);
  assert.ok(starts[2] < SAMPLE_DEMO_DURATION_MS);
});
