/**
 * Analysis Lab playback policy.
 *
 * The lab preview is intended to loop continuously with a MediaPipe overlay
 * while /api/analyze runs. Frame stills for the API are sampled from a
 * *separate* offscreen <video> (see videoFrames.ts).
 *
 * iOS Safari enforces ConcurrentPlaybackNotPermitted: starting playback (even
 * muted) on a second <video> can pause other videos on the page. Regular
 * Safari often hits this because MediaPipe/WASM is warm-cached and the lab
 * player autoplays at the same moment extractVideoFrames() calls play()/seek.
 * Private Browsing is colder, so extract often finishes before the lab player
 * starts — which is why Private "works" and Regular freezes on one frame.
 *
 * Fix: defer mounting the visible PoseVideoPlayer until frame extraction has
 * fully torn down its offscreen decoder.
 */

export type LabPlaybackPhase = "extracting" | "overlay" | "theatrical";

export function resolveLabPlaybackPhase(input: {
  hasFile: boolean;
  hasPrecomputedAnalysis: boolean;
  framesReady: boolean;
}): LabPlaybackPhase {
  if (input.hasPrecomputedAnalysis || !input.hasFile) {
    return "theatrical";
  }
  return input.framesReady ? "overlay" : "extracting";
}

/** True when the visible pose player must wait for still-frame extraction. */
export function shouldDeferPoseOverlay(input: {
  hasFile: boolean;
  hasPrecomputedAnalysis: boolean;
  framesReady: boolean;
}): boolean {
  return resolveLabPlaybackPhase(input) === "extracting";
}

export type LabPlaybackSnapshot = {
  readyState: number;
  networkState: number;
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  muted: boolean;
  loop: boolean;
  currentTime: number;
  duration: number;
  videoWidth: number;
  videoHeight: number;
  errorCode: number | null;
};

export function snapshotVideoPlayback(
  video: Pick<
    HTMLVideoElement,
    | "readyState"
    | "networkState"
    | "paused"
    | "ended"
    | "seeking"
    | "muted"
    | "loop"
    | "currentTime"
    | "duration"
    | "videoWidth"
    | "videoHeight"
    | "error"
  >,
): LabPlaybackSnapshot {
  return {
    readyState: video.readyState,
    networkState: video.networkState,
    paused: video.paused,
    ended: video.ended,
    seeking: video.seeking,
    muted: video.muted,
    loop: video.loop,
    currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
    duration: Number.isFinite(video.duration) ? video.duration : 0,
    videoWidth: video.videoWidth || 0,
    videoHeight: video.videoHeight || 0,
    errorCode: video.error?.code ?? null,
  };
}

export function logLabPlayback(
  event: string,
  detail?: Record<string, unknown>,
): void {
  if (typeof console === "undefined") return;
  try {
    console.info(`[POWR:lab] ${event}`, detail ?? {});
  } catch {
    // Diagnostics must never break analysis.
  }
}
