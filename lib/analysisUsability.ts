/**
 * Post-model gate: reject skating reports that lack usable visual evidence.
 * Keep this separate from entitlement/billing so unusable clips never consume credits.
 */

export type AnalysisUsabilityFields = {
  assessmentUsable?: unknown;
  usabilityReason?: unknown;
  confidence?: {
    label?: unknown;
    score?: unknown;
    reason?: unknown;
  };
  overallScore?: unknown;
  priorityImprovement?: unknown;
  summary?: unknown;
};

const CUTOFF_HINT =
  /\b(cut\s*off|cropped|out of frame|not (fully )?visible|missing (legs?|feet|ankles?)|legs? (are )?(cut|missing|cropped)|cannot see (the )?(legs?|feet|full body)|insufficient (video|footage|evidence)|too dark|blank|black frame)\b/i;

export function modelMarkedUnusable(analysis: AnalysisUsabilityFields | null | undefined): boolean {
  if (!analysis || typeof analysis !== "object") return true;
  if (analysis.assessmentUsable === false) return true;
  if (analysis.assessmentUsable === true) return false;
  // Older responses without the field: fall through to heuristics.
  return false;
}

/**
 * Heuristic safety net when the model still returns a score for unusable footage
 * (e.g. "legs cut off" as the main finding with very low confidence).
 */
export function looksLikeInsufficientSkatingEvidence(
  analysis: AnalysisUsabilityFields | null | undefined,
): boolean {
  if (!analysis || typeof analysis !== "object") return true;

  const confidenceLabel =
    typeof analysis.confidence?.label === "string"
      ? analysis.confidence.label
      : "";
  const confidenceScore = Number(analysis.confidence?.score);
  const reasonParts = [
    typeof analysis.usabilityReason === "string" ? analysis.usabilityReason : "",
    typeof analysis.confidence?.reason === "string" ? analysis.confidence.reason : "",
    typeof analysis.priorityImprovement === "string" ? analysis.priorityImprovement : "",
    typeof analysis.summary === "string" ? analysis.summary : "",
  ]
    .join(" ")
    .toLowerCase();

  const cutoffLanguage = CUTOFF_HINT.test(reasonParts);
  const veryLowConfidence =
    confidenceLabel === "Low" &&
    Number.isFinite(confidenceScore) &&
    confidenceScore <= 45;

  // Low-confidence + crop/visibility language ⇒ not a reliable skating assessment.
  if (cutoffLanguage && (veryLowConfidence || confidenceLabel === "Low")) {
    return true;
  }

  // Explicit unusable flag already handled elsewhere; here only heuristics.
  return false;
}

export function shouldRejectAnalysisForQuality(
  analysis: AnalysisUsabilityFields | null | undefined,
): { reject: boolean; reason: string } {
  if (modelMarkedUnusable(analysis)) {
    const reason =
      typeof analysis?.usabilityReason === "string" && analysis.usabilityReason.trim()
        ? analysis.usabilityReason.trim()
        : "The uploaded clip does not show enough of the skater for a reliable POWR assessment.";
    return { reject: true, reason };
  }

  if (looksLikeInsufficientSkatingEvidence(analysis)) {
    return {
      reject: true,
      reason:
        typeof analysis?.usabilityReason === "string" && analysis.usabilityReason.trim()
          ? analysis.usabilityReason.trim()
          : "POWR could not see a full skating body clearly enough to score this clip. Try a brighter side-view video with your full body in frame.",
    };
  }

  return { reject: false, reason: "" };
}

/** Strip gate-only fields before returning analysis to clients/reports. */
export function stripUsabilityFields<T extends Record<string, unknown>>(analysis: T): T {
  const clone = { ...analysis };
  delete (clone as { assessmentUsable?: unknown }).assessmentUsable;
  delete (clone as { usabilityReason?: unknown }).usabilityReason;
  return clone;
}
