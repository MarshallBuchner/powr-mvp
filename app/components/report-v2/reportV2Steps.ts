export const REPORT_V2_STEPS = [
  "Overview",
  "Score",
  "Breakdown",
  "Priorities",
  "Drills",
  "Progress",
] as const;

export type ReportV2Step = (typeof REPORT_V2_STEPS)[number];

export function parseReportV2Step(
  raw: string | string[] | undefined,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(REPORT_V2_STEPS.length - 1, n - 1));
}

export function reportV2StepHref(index: number) {
  const safe = Math.max(0, Math.min(REPORT_V2_STEPS.length - 1, index));
  return safe === 0 ? "/r/v2" : `/r/v2?step=${safe + 1}`;
}
