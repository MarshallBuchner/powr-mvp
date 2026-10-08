import assert from "node:assert/strict";
import { test } from "node:test";
import {
  looksLikeInsufficientSkatingEvidence,
  modelMarkedUnusable,
  shouldRejectAnalysisForQuality,
  stripUsabilityFields,
} from "./analysisUsability.ts";

test("modelMarkedUnusable trusts assessmentUsable flag", () => {
  assert.equal(modelMarkedUnusable({ assessmentUsable: false }), true);
  assert.equal(modelMarkedUnusable({ assessmentUsable: true }), false);
  assert.equal(modelMarkedUnusable(null), true);
});

test("legs-cut-off low-confidence reports are treated as insufficient evidence", () => {
  const analysis = {
    assessmentUsable: true,
    overallScore: 42,
    priorityImprovement: "The athlete's legs are cut off in the frame",
    summary: "Hard to judge stride because the lower body is cropped.",
    confidence: { label: "Low", score: 35, reason: "Legs cut off / limited view" },
  };
  assert.equal(looksLikeInsufficientSkatingEvidence(analysis), true);
  const gate = shouldRejectAnalysisForQuality(analysis);
  assert.equal(gate.reject, true);
  assert.match(gate.reason, /full body|skating|clip/i);
});

test("usable clear assessments are not rejected by heuristics", () => {
  const analysis = {
    assessmentUsable: true,
    overallScore: 72,
    priorityImprovement: "Deeper knee bend through the stride",
    summary: "Solid base with room to improve knee bend.",
    confidence: { label: "Moderate", score: 70, reason: "Clear side view" },
  };
  assert.equal(shouldRejectAnalysisForQuality(analysis).reject, false);
});

test("explicit unusable flag rejects before billing even with a numeric score", () => {
  const gate = shouldRejectAnalysisForQuality({
    assessmentUsable: false,
    usabilityReason: "Frames are blank",
    overallScore: 40,
    confidence: { label: "Low", score: 10, reason: "No skater visible" },
  });
  assert.equal(gate.reject, true);
  assert.equal(gate.reason, "Frames are blank");
});

test("stripUsabilityFields removes gate-only keys", () => {
  const stripped = stripUsabilityFields({
    overallScore: 70,
    assessmentUsable: true,
    usabilityReason: "ok",
    summary: "fine",
  });
  assert.equal("assessmentUsable" in stripped, false);
  assert.equal("usabilityReason" in stripped, false);
  assert.equal(stripped.overallScore, 70);
});
