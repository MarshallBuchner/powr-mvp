/**
 * Client-side eligibility helpers for upload/analysis consent.
 * Keep wording conservative; do not collect DOB or youth profiles here.
 */

export type AgeBand = "under13" | "teen" | "adult";

export function isEligibleToSelfAuthorize(ageBand: AgeBand | null): boolean {
  return ageBand === "teen" || ageBand === "adult";
}

export function canStartAnalysis(options: {
  ageBand: AgeBand | null;
  consented: boolean;
}): boolean {
  return isEligibleToSelfAuthorize(options.ageBand) && options.consented;
}

export function ageGateMessage(ageBand: AgeBand | null): string | null {
  if (ageBand === "under13") {
    return "POWR assessments are not available for self-service use by children under 13.";
  }
  return null;
}
