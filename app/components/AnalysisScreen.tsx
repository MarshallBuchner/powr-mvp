"use client";

/**
 * POWR Analysis Lab — full-screen “watch POWR analyze your clip” experience.
 * Runs the real /api/analyze request while MediaPipe pose overlays the uploaded video.
 * Pose is an enhancement: if it fails, assessment generation continues normally.
 *
 * Live assessments: still-frame extraction first (Safari ConcurrentPlaybackNotPermitted),
 * then mount the looping overlay and run /api/analyze immediately. Presentation lasts
 * ~25–35s so users can see skeleton tracking; billing is never delayed for UX.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import type { AnalysisRequest } from "./types";
import {
  buildEvidenceMoments,
  extractVideoFrames,
  InsufficientVideoFramesError,
} from "./videoFrames";
import {
  localConsumeAssessment,
  writeLocalEntitlements,
} from "./assessmentEntitlements";
import { stashEvidenceFrames } from "./evidenceStorage";
import type { PrototypeMetrics } from "./prototype/poseMetrics";
import type { PoseDebugInfo } from "./prototype/PoseVideoPlayer";
import { isSampleReport } from "./shareReport";
import {
  logLabPlayback,
  shouldDeferPoseOverlay,
} from "@/lib/labPlayback";
import {
  LIVE_COMPLETE_HOLD_MS,
  LIVE_LAB_STAGES,
  canNavigateToLiveReport,
  liveLabProgressPct,
  liveLabStageCopy,
  liveMinPresentationMs,
  prefersReducedMotion,
  resolveLiveLabStageIndex,
} from "@/lib/liveLabPresentation";

const PoseVideoPlayer = dynamic(
  () => import("./prototype/PoseVideoPlayer"),
  {
    ssr: false,
    loading: () => (
      <div className="analysis-lab-video-fallback">Loading player…</div>
    ),
  },
);

type AnalysisScreenProps = {
  request: AnalysisRequest;
  /** Called when analysis payload is ready (before navigating to report). */
  onReady?: (request: AnalysisRequest) => void;
  onComplete: () => void | Promise<void>;
  onBack?: () => void;
};

/** Sample / non-live theatrical stages (unchanged short path). */
const SAMPLE_LAB_STAGES = [
  {
    label: "Preparing video",
    detail: "Preparing your clip for analysis",
  },
  {
    label: "Detecting player",
    detail: "Separating the player from the background",
  },
  {
    label: "Tracking body landmarks",
    detail: "Mapping joints and posture on your footage",
  },
  {
    label: "Reviewing skating posture",
    detail: "I'm taking a closer look at movement patterns that affect your skating",
  },
  {
    label: "Identifying movement patterns",
    detail: "Reviewing the mechanics that matter for your focus area",
  },
  {
    label: "Building development priorities",
    detail: "Selecting coaching priorities and drills",
  },
  {
    label: "Generating POWR report",
    detail: "Finalizing your personalized development report",
  },
] as const;

const EMPTY_METRICS: PrototypeMetrics = {
  kneeBendDeg: null,
  torsoAngleDeg: null,
  shinAngleDeg: null,
  forwardLeanDeg: null,
  stanceWidth: null,
  stridePosture: "—",
  balance: "—",
  confidencePct: 0,
};

function formatDeg(v: number | null) {
  return v == null ? "—" : `${v}°`;
}

function formatClipDuration(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function AnalysisScreen({
  request,
  onReady,
  onComplete,
  onBack,
}: AnalysisScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PrototypeMetrics>(EMPTY_METRICS);
  const [debug, setDebug] = useState<PoseDebugInfo | null>(null);
  const [poseStatus, setPoseStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  // Defer the visible pose player until still-frame extraction finishes so
  // iOS Safari does not pause the lab preview under ConcurrentPlaybackNotPermitted.
  const [framesReady, setFramesReady] = useState(
    () => Boolean(request.analysis) || !request.file,
  );
  const [reportReady, setReportReady] = useState(false);
  const [presentationElapsedMs, setPresentationElapsedMs] = useState(0);
  const [analysisInFlight, setAnalysisInFlight] = useState(false);
  const [forceReportNow, setForceReportNow] = useState(false);
  const [reducedMotion] = useState(() => prefersReducedMotion());

  const isSampleDemo = isSampleReport(request);
  const poseLimited = poseStatus === "error";
  const finishedRef = useRef(false);
  const analyzeStartedRef = useRef(false);
  const forceNowRef = useRef(false);
  const pendingReportRef = useRef<AnalysisRequest | null>(null);
  const requestRef = useRef(request);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const deferPoseOverlay = shouldDeferPoseOverlay({
    hasFile: Boolean(request.file),
    hasPrecomputedAnalysis: Boolean(request.analysis),
    framesReady,
  });

  const visibleStages = isSampleDemo ? SAMPLE_LAB_STAGES : LIVE_LAB_STAGES;
  const minPresentationMs = liveMinPresentationMs(reducedMotion);

  const liveStage = useMemo(() => {
    if (isSampleDemo) {
      const sample = SAMPLE_LAB_STAGES[activeStep] ?? SAMPLE_LAB_STAGES[0];
      return {
        label: sample.label,
        detail: sample.detail,
      };
    }
    return liveLabStageCopy(activeStep, {
      framesReady,
      analysisInFlight,
      analysisReady: reportReady,
    });
  }, [activeStep, analysisInFlight, framesReady, isSampleDemo, reportReady]);

  const completedSteps = useMemo(
    () => (isComplete ? visibleStages.length : activeStep),
    [activeStep, isComplete, visibleStages.length],
  );

  const headline = isComplete
    ? isSampleDemo
      ? "Your sample report is ready."
      : "Your development report is ready."
    : isSampleDemo
      ? "Loading the pre-generated sample report."
      : liveStage.label;

  const subcopy = isComplete
    ? isSampleDemo
      ? "This is a pre-generated demo report — not a new live assessment."
      : "Your personalized development report is ready to review."
    : isSampleDemo
      ? "Demo mode: showing how a finished POWR report looks. No live AI analysis is running on this clip."
      : liveStage.detail;

  const finishToReport = useCallback(
    (finalRequest: AnalysisRequest) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onReady?.(finalRequest);
      setActiveStep(visibleStages.length - 1);
      setIsComplete(true);
      // Navigate while the lab is still visible. Fading first caused a long
      // blank stretch on mobile while the share token request was in flight.
      void (async () => {
        try {
          if (!isSampleDemo) {
            await delay(LIVE_COMPLETE_HOLD_MS);
          }
          await onComplete();
        } catch (err) {
          console.error("POWR report navigation failed", err);
          finishedRef.current = false;
          setIsComplete(false);
          setIsLeaving(false);
          setError(
            "Your analysis finished, but opening the report failed. Tap below to try again.",
          );
          return;
        }
        setIsLeaving(true);
      })();
    },
    [isSampleDemo, onComplete, onReady, visibleStages.length],
  );

  const handleViewReportNow = useCallback(() => {
    if (!reportReady || finishedRef.current) return;
    forceNowRef.current = true;
    setForceReportNow(true);
    const pending = pendingReportRef.current;
    if (pending) {
      finishToReport(pending);
    }
  }, [finishToReport, reportReady]);

  // Drive real analyze when we have a file and no analysis yet;
  // theatrical path when analysis is already present (sample).
  useEffect(() => {
    let cancelled = false;
    const current = requestRef.current;

    async function runLiveAnalyze() {
      if (!current.file) {
        setError("Missing video file for analysis.");
        return;
      }
      // Prevent duplicate /api/analyze + credit consumption on remount races.
      if (analyzeStartedRef.current) return;
      analyzeStartedRef.current = true;

      const minMs = liveMinPresentationMs(prefersReducedMotion());

      try {
        setActiveStep(0);
        setFramesReady(false);
        setReportReady(false);
        setAnalysisInFlight(false);
        setPresentationElapsedMs(0);
        forceNowRef.current = false;
        setForceReportNow(false);
        pendingReportRef.current = null;

        logLabPlayback("live_analyze_start", {
          fileName: current.fileName,
          hasVideoUrl: Boolean(current.videoUrl),
          minPresentationMs: minMs,
        });

        // Phase 1: sample stills on an offscreen decoder ONLY.
        // Do not mount PoseVideoPlayer yet — concurrent play() freezes the lab
        // preview on iPhone Safari (Regular more than Private due to warm cache).
        logLabPlayback("frame_extract_start");
        const frames = await extractVideoFrames(current.file, 5);
        if (cancelled) return;
        logLabPlayback("frame_extract_done", { frameCount: frames.length });

        // Phase 2: mount looping preview + MediaPipe, start /api/analyze immediately.
        setFramesReady(true);
        setActiveStep(1);
        setAnalysisInFlight(true);
        const presentationStartedAt = performance.now();

        type AnalyzeOutcome =
          | { ok: true; finalRequest: AnalysisRequest }
          | { ok: false; error: unknown };

        const analyzeTask: Promise<AnalyzeOutcome> = (async () => {
          try {
            const response = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                frames: frames.map((frame) => frame.dataUrl),
                goal: current.goal,
              }),
            });

            const result = await response.json();

            if (
              response.status === 402 ||
              result.error === "free_assessment_used"
            ) {
              throw new Error(
                result.message ||
                  "You've used your free assessment. Unlock a pack to continue.",
              );
            }
            if (
              response.status === 422 ||
              result.error === "insufficient_video_quality"
            ) {
              throw new InsufficientVideoFramesError(
                result.message ||
                  "This clip does not have enough visible skating evidence for a reliable assessment.",
                Array.isArray(result.issues) ? result.issues : [],
              );
            }
            if (!response.ok || !result.success) {
              throw new Error(result.error || "Analysis failed.");
            }

            // Consume/mirror entitlements as soon as the API succeeds —
            // never wait for the presentation floor.
            if (result.entitlements) {
              writeLocalEntitlements(result.entitlements);
            } else {
              localConsumeAssessment();
            }

            const evidenceMoments = buildEvidenceMoments(
              frames,
              result.analysis?.priorityImprovement || "",
            );
            stashEvidenceFrames(evidenceMoments);

            track("analysis_succeeded", {
              goal: current.goal,
              remaining: result.remaining,
            });

            const finalRequest: AnalysisRequest = {
              ...current,
              analysis: result.analysis,
              evidenceMoments,
            };

            if (!cancelled) {
              pendingReportRef.current = finalRequest;
              setReportReady(true);
              setAnalysisInFlight(false);
              logLabPlayback("analyze_ready", {
                presentationElapsedMs: performance.now() - presentationStartedAt,
              });
            }

            return { ok: true as const, finalRequest };
          } catch (err) {
            if (!cancelled) {
              setAnalysisInFlight(false);
            }
            return { ok: false as const, error: err };
          }
        })();

        // Presentation loop: video/skeleton keep playing until both analysis
        // and the minimum presentation window are satisfied (or View Report Now).
        while (!cancelled) {
          const elapsed = performance.now() - presentationStartedAt;
          setPresentationElapsedMs(elapsed);

          const outcomeSettled = await Promise.race([
            analyzeTask.then((value) => ({ settled: true as const, value })),
            delay(100).then(() => ({ settled: false as const, value: null })),
          ]);

          if (outcomeSettled.settled && outcomeSettled.value) {
            if (!outcomeSettled.value.ok) {
              throw outcomeSettled.value.error;
            }
          }

          const analysisReady = Boolean(pendingReportRef.current);
          const inFlight = !analysisReady;

          const stageIndex = resolveLiveLabStageIndex({
            framesReady: true,
            analysisInFlight: inFlight,
            analysisReady,
            presentationElapsedMs: elapsed,
            minPresentationMs: minMs,
          });
          setActiveStep(stageIndex);

          if (
            canNavigateToLiveReport({
              analysisReady,
              presentationElapsedMs: elapsed,
              minPresentationMs: minMs,
              forceNow: forceNowRef.current,
            })
          ) {
            const outcome = await analyzeTask;
            if (!outcome.ok) throw outcome.error;
            if (cancelled) return;
            // If the user already forced navigation, finishToReport is a no-op.
            finishToReport(outcome.finalRequest);
            return;
          }
        }

        // Unmount/cancel: still let the in-flight request settle so we don't
        // leave a dangling unhandled rejection (credits already applied server-side).
        await analyzeTask;
      } catch (err) {
        if (cancelled) return;
        console.error("POWR analysis lab failed", err);
        setAnalysisInFlight(false);
        if (err instanceof InsufficientVideoFramesError) {
          setError(err.message);
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "POWR couldn't analyze this video. Please try again.",
        );
      }
    }

    function runTheatrical() {
      const total = 2400;
      const timers = SAMPLE_LAB_STAGES.slice(1).map((_, index) =>
        window.setTimeout(
          () => {
            if (!cancelled) setActiveStep(index + 1);
          },
          ((index + 1) * total) / SAMPLE_LAB_STAGES.length,
        ),
      );
      const done = window.setTimeout(() => {
        if (!cancelled) finishToReport(current);
      }, total);
      return () => {
        timers.forEach((t) => window.clearTimeout(t));
        window.clearTimeout(done);
      };
    }

    let cleanupTheatrical: (() => void) | undefined;

    if (current.analysis || (!current.file && current.videoUrl)) {
      cleanupTheatrical = runTheatrical();
    } else if (current.file) {
      void runLiveAnalyze();
    } else {
      setError("Nothing to analyze.");
    }

    return () => {
      cancelled = true;
      cleanupTheatrical?.();
    };
    // Run once per mount for this analysis session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressPct = isComplete
    ? 100
    : isSampleDemo
      ? Math.min(
          96,
          Math.round(((activeStep + 0.35) / SAMPLE_LAB_STAGES.length) * 100),
        )
      : liveLabProgressPct({
          framesReady,
          analysisReady: reportReady,
          presentationElapsedMs,
          minPresentationMs,
          forceNow: forceReportNow,
        });

  const showViewReportNow =
    !isSampleDemo && reportReady && !isComplete && !error && !isLeaving;

  return (
    <main
      className={`analysis-lab${isLeaving ? " is-leaving" : ""}${
        !isSampleDemo ? " is-live-lab" : ""
      }`}
    >
      <section className="analysis-lab-shell">
        <header className="analysis-lab-heading">
          <p className="eyebrow">
            {isSampleDemo ? "POWR SAMPLE DEMO" : "POWR ANALYSIS"}
          </p>
          <h1 key={headline} className="analysis-lab-headline">
            {headline}
          </h1>
          <p key={subcopy} className="analysis-lab-subcopy">
            {subcopy}
          </p>
          {!isComplete && !error && !isSampleDemo ? (
            <p className="analysis-lab-keep-open">
              {reportReady
                ? "Assessment complete — keep watching the overlay, or open your report now."
                : "Keep this page open while we finish your assessment."}
            </p>
          ) : null}
          {showViewReportNow ? (
            <div className="analysis-lab-skip">
              <button
                type="button"
                className="analysis-lab-view-now"
                onClick={handleViewReportNow}
              >
                View Report Now →
              </button>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="analysis-lab-error" role="alert">
            <strong>Analysis interrupted</strong>
            <p>{error}</p>
            <div className="analysis-lab-error-actions">
              {onBack ? (
                <button type="button" className="skel-btn is-primary" onClick={onBack}>
                  ← Back to upload
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="analysis-lab-layout">
            <div className="analysis-lab-primary">
              {request.videoUrl && !deferPoseOverlay ? (
                <div className="analysis-lab-video">
                  <PoseVideoPlayer
                    src={request.videoUrl}
                    labMode
                    showScanLine={!isComplete}
                    showSkeleton
                    showKeypoints
                    showLabels={false}
                    skeletonColor="green"
                    onMetrics={setMetrics}
                    onDebug={setDebug}
                    onModelStatus={setPoseStatus}
                  />
                  {poseLimited ? (
                    <p className="analysis-lab-pose-note">
                      Pose tracking limited — continuing video analysis
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="analysis-lab-video-fallback">
                  {deferPoseOverlay
                    ? "Preparing your skating footage…"
                    : "Preparing your clip…"}
                </div>
              )}

              <div className="analysis-lab-clip">
                <div className="clip-icon" aria-hidden="true">
                  ▶
                </div>
                <div className="clip-details">
                  <span className="clip-label">Selected clip</span>
                  <strong>{request.fileName}</strong>
                  <div className="clip-metadata">
                    <span>{request.goal}</span>
                    {formatClipDuration(request.duration) ? (
                      <>
                        <span className="metadata-divider">•</span>
                        <span>{formatClipDuration(request.duration)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <span
                  className={`analysis-lab-pill${isComplete ? " is-done" : ""}`}
                >
                  <span className="tracking-dot" />
                  {isComplete
                    ? isSampleDemo
                      ? "Sample ready"
                      : "Analysis complete"
                    : isSampleDemo
                      ? "Sample demo"
                      : reportReady
                        ? "Report ready"
                        : "AI tracking active"}
                </span>
              </div>
            </div>

            <aside className="analysis-lab-side">
              <div className="analysis-lab-card">
                <h2>{isSampleDemo ? "DEMO PREVIEW" : "AI TRACKING"}</h2>
                <p className="analysis-lab-card-note">
                  {isSampleDemo
                    ? "Optional pose overlay — not a live assessment"
                    : poseLimited
                      ? "Pose unavailable on this device — assessment continues"
                      : "Live pose estimates from your clip"}
                </p>
                <ul className="analysis-lab-metrics">
                  <li>
                    <span>Pose detected</span>
                    <strong>
                      {debug?.poseDetected
                        ? "Yes"
                        : poseStatus === "loading"
                          ? "…"
                          : "No"}
                    </strong>
                  </li>
                  <li>
                    <span>Landmarks</span>
                    <strong>{debug?.landmarkCount ?? "—"}</strong>
                  </li>
                  <li>
                    <span>Confidence</span>
                    <strong>
                      {debug ? `${debug.confidencePct}%` : "—"}
                    </strong>
                  </li>
                  <li>
                    <span>Timestamp</span>
                    <strong>
                      {debug ? `${debug.currentTime.toFixed(1)}s` : "—"}
                    </strong>
                  </li>
                  <li>
                    <span>Knee bend</span>
                    <strong>{formatDeg(metrics.kneeBendDeg)}</strong>
                  </li>
                  <li>
                    <span>Torso angle</span>
                    <strong>{formatDeg(metrics.torsoAngleDeg)}</strong>
                  </li>
                  <li>
                    <span>Shin angle</span>
                    <strong>{formatDeg(metrics.shinAngleDeg)}</strong>
                  </li>
                  <li>
                    <span>Stance width</span>
                    <strong>
                      {metrics.stanceWidth == null
                        ? "—"
                        : `${Math.round(metrics.stanceWidth * 100)}%`}
                    </strong>
                  </li>
                </ul>
              </div>

              <div className="analysis-lab-card">
                <div className="analysis-lab-progress-head">
                  <h2>
                    {isSampleDemo ? "SAMPLE REPORT" : "ASSESSMENT PROGRESS"}
                  </h2>
                  <strong>{isComplete ? "100%" : `${progressPct}%`}</strong>
                </div>
                <div
                  className={`analysis-lab-progress-track${isComplete ? " is-complete" : ""}`}
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-label="Analysis progress"
                >
                  <span
                    className="analysis-lab-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <ol className="analysis-lab-stages">
                  {visibleStages.map((step, index) => {
                    const done = index < completedSteps || isComplete;
                    const active = !isComplete && index === activeStep;
                    return (
                      <li
                        key={step.label}
                        className={
                          done ? "is-done" : active ? "is-active" : "is-pending"
                        }
                      >
                        <span className="analysis-lab-stage-mark" aria-hidden>
                          {done ? "✓" : active ? "●" : "○"}
                        </span>
                        <span>{step.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </aside>
          </div>
        )}

        {isComplete ? (
          <div className="analysis-lab-complete">
            <div className="analysis-lab-check" aria-hidden>
              ✓
            </div>
            <p className="eyebrow">{isSampleDemo ? "POWR SAMPLE" : "POWR CORE"}</p>
            <h2>{isSampleDemo ? "Sample ready" : "Analysis complete"}</h2>
            <p>
              {isSampleDemo
                ? "Open the pre-generated demo report to explore the POWR layout."
                : "Your personalized development report is ready to review."}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => void onComplete()}
            >
              {isSampleDemo ? "View sample report →" : "View Development Report →"}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
