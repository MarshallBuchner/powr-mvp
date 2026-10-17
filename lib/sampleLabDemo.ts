/**
 * Sample / demo Analysis Lab choreography only.
 * Live assessments use lib/liveLabPresentation.ts.
 */

export const SAMPLE_DEMO_DURATION_MS = 30_000;
export const SAMPLE_DEMO_REDUCED_MOTION_MS = 10_000;

/** Show “View Sample Report” after the overlay has meaningfully played. */
export const SAMPLE_DEMO_VIEW_REPORT_AFTER_MS = 10_000;
export const SAMPLE_DEMO_VIEW_REPORT_AFTER_REDUCED_MS = 4_000;

export const SAMPLE_DEMO_COMPLETE_HOLD_MS = 900;
export const SAMPLE_DEMO_LEAVE_MS = 750;

export type SampleDemoStage = {
  label: string;
  detail: string;
};

/** Honest demo beats — never imply a live backend AI request. */
export const SAMPLE_DEMO_STAGES: readonly SampleDemoStage[] = [
  {
    label: "Tracking skating movement",
    detail:
      "Watch the green overlay follow the skater. This is a pre-generated demo — not a new live AI analysis.",
  },
  {
    label: "Reviewing sample technique cues",
    detail:
      "Showing how POWR highlights posture and stride patterns in a finished skating assessment.",
  },
  {
    label: "Opening the sample report",
    detail:
      "Next you’ll explore a fixed demo report with scores, coaching notes, and drills.",
  },
] as const;

export function sampleDemoDurationMs(prefersReducedMotion: boolean): number {
  return prefersReducedMotion
    ? SAMPLE_DEMO_REDUCED_MOTION_MS
    : SAMPLE_DEMO_DURATION_MS;
}

export function sampleDemoViewReportAfterMs(
  prefersReducedMotion: boolean,
): number {
  return prefersReducedMotion
    ? SAMPLE_DEMO_VIEW_REPORT_AFTER_REDUCED_MS
    : SAMPLE_DEMO_VIEW_REPORT_AFTER_MS;
}

export function sampleDemoStepIndex(
  elapsedMs: number,
  durationMs: number = SAMPLE_DEMO_DURATION_MS,
  stageCount: number = SAMPLE_DEMO_STAGES.length,
): number {
  if (stageCount <= 0) return 0;
  if (elapsedMs <= 0) return 0;
  if (elapsedMs >= durationMs) return stageCount - 1;
  const step = Math.floor((elapsedMs / durationMs) * stageCount);
  return Math.min(stageCount - 1, Math.max(0, step));
}

export function sampleDemoProgressPct(
  elapsedMs: number,
  durationMs: number = SAMPLE_DEMO_DURATION_MS,
): number {
  if (durationMs <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsedMs / durationMs) * 100)));
}

export function sampleDemoStageStartTimes(
  durationMs: number = SAMPLE_DEMO_DURATION_MS,
  stageCount: number = SAMPLE_DEMO_STAGES.length,
): number[] {
  if (stageCount <= 0) return [];
  return Array.from({ length: stageCount }, (_, i) =>
    Math.round((durationMs * i) / stageCount),
  );
}

export function canShowSampleViewReport(input: {
  elapsedMs: number;
  viewAfterMs: number;
  isComplete?: boolean;
}): boolean {
  if (input.isComplete) return false;
  return input.elapsedMs >= input.viewAfterMs;
}
