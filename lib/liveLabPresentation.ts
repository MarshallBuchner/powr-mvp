/**
 * Live Analysis Lab presentation policy.
 *
 * Goals:
 * - Run /api/analyze immediately after still-frame extraction (no billing delay).
 * - Keep a polished ~25–35s presentation so users see skating + skeleton overlay.
 * - Never claim work is happening after it has finished.
 * - Never block navigation forever if analysis is slow or fails.
 *
 * Safari concurrent-playback fix (lib/labPlayback.ts) stays separate: the visible
 * PoseVideoPlayer must still wait until frame extraction tears down its decoder.
 */

export const LIVE_MIN_PRESENTATION_MS = 28_000;
export const LIVE_REDUCED_MOTION_MIN_MS = 8_000;
export const LIVE_COMPLETE_HOLD_MS = 700;

export type LiveLabStageKind =
  | "extracting"
  | "analyzing"
  | "reviewing"
  | "waiting"
  | "ready";

export type LiveLabStage = {
  id: string;
  label: string;
  detail: string;
  kind: LiveLabStageKind;
};

/** User-facing live stages — labels stay honest about processing vs review. */
export const LIVE_LAB_STAGES: readonly LiveLabStage[] = [
  {
    id: "preparing",
    label: "Preparing your skating footage",
    detail: "Sampling clear frames from your clip for assessment.",
    kind: "extracting",
  },
  {
    id: "tracking",
    label: "Tracking body movement",
    detail: "Watch the green overlay follow your skating while POWR analyzes your clip.",
    kind: "analyzing",
  },
  {
    id: "mechanics",
    label: "Reviewing skating mechanics",
    detail: "Looking at stance, stride, and posture cues visible in your footage.",
    kind: "analyzing",
  },
  {
    id: "priorities",
    label: "Identifying development priorities",
    detail: "Selecting the coaching focus that matters most for your goal.",
    kind: "analyzing",
  },
  {
    id: "report",
    label: "Preparing your coaching report",
    detail: "Finalizing scores, notes, and drills from your assessment.",
    kind: "waiting",
  },
] as const;

export function liveMinPresentationMs(prefersReducedMotion: boolean): number {
  return prefersReducedMotion
    ? LIVE_REDUCED_MOTION_MIN_MS
    : LIVE_MIN_PRESENTATION_MS;
}

/**
 * Whether auto-navigation to the report is allowed.
 * Requires a successful assessment; presentation floor can be skipped via forceNow.
 */
export function canNavigateToLiveReport(input: {
  analysisReady: boolean;
  presentationElapsedMs: number;
  minPresentationMs: number;
  forceNow?: boolean;
  hasError?: boolean;
}): boolean {
  if (input.hasError) return false;
  if (!input.analysisReady) return false;
  if (input.forceNow) return true;
  return input.presentationElapsedMs >= input.minPresentationMs;
}

/**
 * Remaining presentation wait after analysis is ready (0 when ready to navigate).
 */
export function remainingPresentationMs(input: {
  analysisReady: boolean;
  presentationElapsedMs: number;
  minPresentationMs: number;
  forceNow?: boolean;
}): number {
  if (!input.analysisReady) return Math.max(0, input.minPresentationMs - input.presentationElapsedMs);
  if (input.forceNow) return 0;
  return Math.max(0, input.minPresentationMs - input.presentationElapsedMs);
}

export type LiveLabPhaseInput = {
  framesReady: boolean;
  analysisInFlight: boolean;
  analysisReady: boolean;
  presentationElapsedMs: number;
  minPresentationMs: number;
  prefersReducedMotion?: boolean;
};

/**
 * Pick the active stage index. After analysis completes, copy shifts to an
 * explicit review/presentation phase so we never fake ongoing processing.
 */
export function resolveLiveLabStageIndex(input: LiveLabPhaseInput): number {
  if (!input.framesReady) return 0;

  if (!input.analysisReady) {
    // Honest progress while the API is still working.
    const t = input.presentationElapsedMs;
    if (t < 6_000) return 1; // tracking
    if (t < 14_000) return 2; // mechanics
    if (t < 22_000) return 3; // priorities
    return 4; // preparing report / still waiting on network
  }

  // Assessment finished — remaining time is presentation/review only.
  const remaining = remainingPresentationMs(input);
  if (remaining <= 0) return 4;
  if (remaining > 12_000) return 2;
  if (remaining > 5_000) return 3;
  return 4;
}

export function liveLabStageCopy(
  index: number,
  input: Pick<LiveLabPhaseInput, "analysisReady" | "analysisInFlight" | "framesReady">,
): LiveLabStage {
  const base =
    LIVE_LAB_STAGES[Math.min(LIVE_LAB_STAGES.length - 1, Math.max(0, index))] ??
    LIVE_LAB_STAGES[0];

  if (!input.framesReady) {
    return base;
  }

  if (input.analysisReady) {
    // Never imply the model is still working after credits were consumed.
    if (base.id === "tracking" || base.id === "mechanics") {
      return {
        ...base,
        kind: "reviewing",
        detail:
          "Your assessment is ready — keep watching the tracking overlay, or open your report now.",
      };
    }
    if (base.id === "priorities") {
      return {
        ...base,
        kind: "reviewing",
        detail:
          "Assessment complete. Reviewing the development priorities that will appear in your report.",
      };
    }
    return {
      ...base,
      kind: "ready",
      label: "Your coaching report is ready",
      detail:
        "Opening shortly — or tap View Report Now to skip the rest of the presentation.",
    };
  }

  if (input.analysisInFlight && base.id === "report") {
    return {
      ...base,
      kind: "waiting",
      detail:
        "Still building your coaching report from the analysis — hang tight, this can take a moment.",
    };
  }

  return base;
}

export function liveLabProgressPct(input: {
  framesReady: boolean;
  analysisReady: boolean;
  presentationElapsedMs: number;
  minPresentationMs: number;
  forceNow?: boolean;
}): number {
  if (!input.framesReady) {
    return Math.min(12, Math.round(input.presentationElapsedMs / 80));
  }

  const floor = liveMinPresentationMs(false);
  const min = Math.max(1, input.minPresentationMs || floor);
  const presentationPct = Math.min(92, Math.round((input.presentationElapsedMs / min) * 92));

  if (!input.analysisReady) {
    // Cap under 96 until the assessment actually finishes.
    return Math.min(88, Math.max(18, presentationPct));
  }

  if (input.forceNow || input.presentationElapsedMs >= min) return 100;
  return Math.min(99, Math.max(90, presentationPct));
}

/** Detect reduced-motion preference in the browser (false during SSR/tests). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
