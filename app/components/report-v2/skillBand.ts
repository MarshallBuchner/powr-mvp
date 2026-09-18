/** Shared score bands used on overall score and technique breakdown rows. */
export function skillBandLabel(score: number): "Excellent" | "Good" | "Developing" {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  return "Developing";
}
