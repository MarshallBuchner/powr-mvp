/**
 * Sample / demo Analysis Lab choreography only.
 * Live assessments keep their own stage list and timing in AnalysisScreen.
 */

export const SAMPLE_DEMO_DURATION_MS = 13_500;

export type SampleDemoStage = {
  label: string;
  detail: string;
};

/** Polished progress beats shown while the sample clip + skeleton play. */
export const SAMPLE_DEMO_STAGES: readonly SampleDemoStage[] = [
  {
    label: "Tracking skating movement",
    detail:
      "Watch the green overlay follow the skater — this is a pre-generated demo, not a new live AI analysis.",
  },
  {
    label: "Analyzing skating technique",
    detail:
      "Showing how POWR highlights posture and stride patterns in this sample skating assessment.",
  },
  {
    label: "Preparing your report",
    detail:
      "Opening a fixed sample report so you can explore scores, coaching notes, and drills.",
  },
] as const;

/** Hold the “sample ready” beat before fading into the report. */
export const SAMPLE_DEMO_COMPLETE_HOLD_MS = 900;

/** Match the cinematic leave transition before navigating. */
export const SAMPLE_DEMO_LEAVE_MS = 750;

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

/** Stage boundary timestamps (ms) for scheduling UI updates. */
export function sampleDemoStageStartTimes(
  durationMs: number = SAMPLE_DEMO_DURATION_MS,
  stageCount: number = SAMPLE_DEMO_STAGES.length,
): number[] {
  if (stageCount <= 0) return [];
  return Array.from({ length: stageCount }, (_, i) =>
    Math.round((durationMs * i) / stageCount),
  );
}
