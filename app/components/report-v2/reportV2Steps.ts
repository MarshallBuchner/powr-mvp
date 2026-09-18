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
  raw: string | string[] | undefined | null,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(REPORT_V2_STEPS.length - 1, n - 1));
}

type StepHrefOptions = {
  basePath?: string;
  /** Existing query string to preserve (e.g. live share `d=`) */
  searchParams?: URLSearchParams | string | Record<string, string> | null;
};

export function reportV2StepHref(
  index: number,
  options: StepHrefOptions = {},
) {
  const basePath = options.basePath || "/r/v2";
  const safe = Math.max(0, Math.min(REPORT_V2_STEPS.length - 1, index));

  const params =
    options.searchParams instanceof URLSearchParams
      ? new URLSearchParams(options.searchParams.toString())
      : typeof options.searchParams === "string"
        ? new URLSearchParams(options.searchParams)
        : new URLSearchParams(options.searchParams ?? undefined);

  params.delete("step");
  if (safe > 0) {
    params.set("step", String(safe + 1));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
