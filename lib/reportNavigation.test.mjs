import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canRetryReportNavigation,
  reportRequestHasAnalysis,
  shouldBlockDuplicateAnalyze,
  summarizeAnalyzeFailure,
} from "./reportNavigation.ts";

test("navigation retry is allowed only after a successful analysis", () => {
  assert.equal(
    canRetryReportNavigation({ analysisReady: true, navigationError: true }),
    true,
  );
  assert.equal(
    canRetryReportNavigation({ analysisReady: false, navigationError: true }),
    false,
  );
  assert.equal(
    canRetryReportNavigation({ analysisReady: true, navigationError: false }),
    false,
  );
});

test("duplicate analyze is blocked once started or ready", () => {
  assert.equal(
    shouldBlockDuplicateAnalyze({ analyzeStarted: true, analysisReady: false }),
    true,
  );
  assert.equal(
    shouldBlockDuplicateAnalyze({ analyzeStarted: false, analysisReady: true }),
    true,
  );
  assert.equal(
    shouldBlockDuplicateAnalyze({
      analyzeStarted: false,
      analysisReady: false,
    }),
    false,
  );
});

test("summarizeAnalyzeFailure stays actionable without leaking internals", () => {
  assert.match(summarizeAnalyzeFailure({ status: 402 }), /free assessment|Unlock/i);
  assert.match(summarizeAnalyzeFailure({ status: 422 }), /skating|skating/i);
  assert.match(
    summarizeAnalyzeFailure({ status: 500, error: "Analysis request failed." }),
    /Analysis request failed/i,
  );
});

test("reportRequestHasAnalysis requires an analysis object", () => {
  assert.equal(reportRequestHasAnalysis({ analysis: { overallScore: 70 } }), true);
  assert.equal(reportRequestHasAnalysis({ analysis: null }), false);
  assert.equal(reportRequestHasAnalysis(null), false);
});
