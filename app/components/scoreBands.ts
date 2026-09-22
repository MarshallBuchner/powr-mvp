/**
 * Shared skating score-band thresholds for report UI.
 * Keep overall ring labels and breakdown band copy in one place.
 */

export type ScoreBandId = "developing" | "solid" | "strong";

export type ScoreBand = {
  id: ScoreBandId;
  /** Short label for breakdown rows: Developing / Solid / Strong */
  label: "Developing" | "Solid" | "Strong";
  /** Ring badge used on the overall score circle */
  ringLabel: "DEVELOPING" | "GOOD" | "EXCELLENT";
  /** Sentence fragment used in overall interpretation */
  basePhrase: "Developing skating base" | "Solid skating base" | "Strong skating base";
};

/** Thresholds match existing ReportV2 / ReportScreen interpretation logic. */
export function getScoreBand(score: number): ScoreBand {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  if (clamped >= 85) {
    return {
      id: "strong",
      label: "Strong",
      ringLabel: "EXCELLENT",
      basePhrase: "Strong skating base",
    };
  }
  if (clamped >= 70) {
    return {
      id: "solid",
      label: "Solid",
      ringLabel: "GOOD",
      basePhrase: "Solid skating base",
    };
  }
  return {
    id: "developing",
    label: "Developing",
    ringLabel: "DEVELOPING",
    basePhrase: "Developing skating base",
  };
}

export function scoreInterpretation(
  overallScore: number,
  priorityImprovement: string,
) {
  const band = getScoreBand(overallScore);
  const priority =
    priorityImprovement.length > 64
      ? `${priorityImprovement.slice(0, 61).trim()}…`
      : priorityImprovement;
  return `${band.basePhrase} · Biggest opportunity: ${priority}`;
}
