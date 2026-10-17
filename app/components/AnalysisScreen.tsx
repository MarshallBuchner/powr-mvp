"use client";

/**
 * POWR Analysis Lab — full-screen “watch POWR analyze your clip” experience.
 * Runs the real /api/analyze request while MediaPipe pose overlays the uploaded video.
 * Pose is an enhancement: if it fails, assessment generation continues normally.
 *
 * Live assessments: still-frame extraction first (Safari ConcurrentPlaybackNotPermitted),
 * then mount the looping overlay and run /api/analyze immediately. Presentation lasts
 * ~25–35s so users can see skeleton tracking; billing is never delayed for UX.
 *
 * Sample demos: ~30s overlay choreography with honest pre-generated copy (no /api/analyze).
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
import type { EntitlementState } from "@/lib/assessmentBilling";
import { stashEvidenceFrames } from "./evidenceStorage";
import { stashLastReport } from "./reportSession";
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
import {
  SAMPLE_DEMO_COMPLETE_HOLD_MS,
  SAMPLE_DEMO_LEAVE_MS,
  SAMPLE_DEMO_STAGES,
  canShowSampleViewReport,
  sampleDemoDurationMs,
  sampleDemoProgressPct,
  sampleDemoStageStartTimes,
  sampleDemoViewReportAfterMs,
} from "@/lib/sampleLabDemo";
import {
  canRetryReportNavigation,
  logReportHandoff,
  readAnalyzeResponse,
  shouldBlockDuplicateAnalyze,
  summarizeAnalyzeFailure,
} from "@/lib/reportNavigation";

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
  /** Opens the report. Receives the billed/sample request so navigation cannot lose it. */
  onComplete: (request?: AnalysisRequest) => void | Promise<void>;
  onBack?: () => void;
};

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
  const [navigationError, setNavigationError] = useState(false);
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
  const pendingReportRef = useRef<AnalysisRequest | null>(
    request.analysis ? request : null,
  );
  const requestRef = useRef(request);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const deferPoseOverlay = shouldDeferPoseOverlay({
    hasFile: Boolean(request.file),
    hasPrecomputedAnalysis: Boolean(request.analysis),
    framesReady,
  });

  const visibleStages = isSampleDemo ? SAMPLE_DEMO_STAGES : LIVE_LAB_STAGES;
  const minPresentationMs = liveMinPresentationMs(reducedMotion);
  const sampleDurationMs = sampleDemoDurationMs(reducedMotion);
  const sampleViewAfterMs = sampleDemoViewReportAfterMs(reducedMotion);

  const liveStage = useMemo(() => {
    if (isSampleDemo) {
      const sample = SAMPLE_DEMO_STAGES[activeStep] ?? SAMPLE_DEMO_STAGES[0];
      return { label: sample.label, detail: sample.detail };
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
      ? liveStage.label
      : liveStage.label;

  const subcopy = isComplete
    ? isSampleDemo
      ? "This is a pre-generated demo report — not a new live assessment."
      : "Your personalized development report is ready to review."
    : isSampleDemo
      ? liveStage.detail
      : liveStage.detail;

  const finishToReport = useCallback(
    (finalRequest: AnalysisRequest) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      pendingReportRef.current = finalRequest;
      setNavigationError(false);
      setError(null);
      onReady?.(finalRequest);
      setActiveStep(visibleStages.length - 1);
      setIsComplete(true);
      // Persist before navigation so /r/view works if the share API fails.
      stashLastReport(finalRequest);
      logReportHandoff("finish_to_report_start", {
        sample: isSampleReport(finalRequest),
        hasAnalysis: Boolean(finalRequest.analysis),
      });

      void (async () => {
        try {
          if (isSampleReport(finalRequest)) {
            await delay(SAMPLE_DEMO_COMPLETE_HOLD_MS);
            setIsLeaving(true);
            await delay(SAMPLE_DEMO_LEAVE_MS);
          } else {
            await delay(LIVE_COMPLETE_HOLD_MS);
          }
          await onComplete(finalRequest);
          logReportHandoff("finish_to_report_ok");
          if (!isSampleReport(finalRequest)) {
            setIsLeaving(true);
          }
        } catch (err) {
          console.error("POWR report navigation failed", err);
          logReportHandoff("finish_to_report_failed", {
            name: err instanceof Error ? err.name : "unknown",
          });
          finishedRef.current = false;
          setIsComplete(false);
          setIsLeaving(false);
          setNavigationError(true);
          setReportReady(true);
          setError(
            "Your assessment is ready, but opening the report failed. Tap Open Report to try again — you will not be charged again.",
          );
        }
      })();
    },
    [onComplete, onReady, visibleStages.length],
  );

  const handleViewReportNow = useCallback(() => {
    const pending = pendingReportRef.current;
    if (!pending?.analysis || finishedRef.current) return;
    forceNowRef.current = true;
    setForceReportNow(true);
    finishToReport(pending);
  }, [finishToReport]);

  const handleRetryOpenReport = useCallback(() => {
    const pending = pendingReportRef.current;
    if (
      !canRetryReportNavigation({
        analysisReady: Boolean(pending?.analysis),
        navigationError,
      })
    ) {
      return;
    }
    finishToReport(pending!);
  }, [finishToReport, navigationError]);

  // Drive real analyze when we have a file and no analysis yet;
  // sample path uses a longer theatrical demo with the real pose overlay.
  useEffect(() => {
    let cancelled = false;
    const current = requestRef.current;

    async function runLiveAnalyze() {
      if (!current.file) {
        setError("Missing video file for analysis.");
        return;
      }
      if (
        shouldBlockDuplicateAnalyze({
          analyzeStarted: analyzeStartedRef.current,
          analysisReady: Boolean(pendingReportRef.current?.analysis),
        })
      ) {
        return;
      }
      analyzeStartedRef.current = true;

      const minMs = liveMinPresentationMs(prefersReducedMotion());

      try {
        setActiveStep(0);
        setFramesReady(false);
        setReportReady(false);
        setAnalysisInFlight(false);
        setPresentationElapsedMs(0);
        setNavigationError(false);
        forceNowRef.current = false;
        setForceReportNow(false);
        pendingReportRef.current = null;

        logLabPlayback("live_analyze_start", {
          fileName: current.fileName,
          hasVideoUrl: Boolean(current.videoUrl),
          minPresentationMs: minMs,
        });

        // Phase 1: sample stills on an offscreen decoder ONLY.
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

            const parsed = await readAnalyzeResponse(response);
            const result = parsed.body;

            if (parsed.parseError) {
              logReportHandoff("analyze_parse_error", {
                status: parsed.status,
              });
              throw new Error(
                "The assessment response could not be read. If a credit was used, tap back and check My Assessments — do not re-run the same clip immediately.",
              );
            }

            if (
              parsed.status === 402 ||
              result?.error === "free_assessment_used"
            ) {
              throw new Error(
                summarizeAnalyzeFailure({
                  status: 402,
                  message: result?.message,
                }),
              );
            }
            if (
              parsed.status === 422 ||
              result?.error === "insufficient_video_quality"
            ) {
              throw new InsufficientVideoFramesError(
                summarizeAnalyzeFailure({
                  status: 422,
                  message: result?.message,
                }),
                Array.isArray(result?.issues)
                  ? (result?.issues as string[])
                  : [],
              );
            }
            if (!parsed.ok || !result) {
              throw new Error(
                summarizeAnalyzeFailure({
                  status: parsed.status,
                  error: result?.error,
                  message: result?.message,
                }),
              );
            }

            // Mirror entitlements as soon as the API succeeds — never wait for UX.
            if (result.entitlements && typeof result.entitlements === "object") {
              writeLocalEntitlements(result.entitlements as EntitlementState);
            } else {
              localConsumeAssessment();
            }

            const evidenceMoments = buildEvidenceMoments(
              frames,
              (result.analysis as { priorityImprovement?: string } | undefined)
                ?.priorityImprovement || "",
            );

            const finalRequest: AnalysisRequest = {
              ...current,
              analysis: result.analysis as AnalysisRequest["analysis"],
              evidenceMoments,
            };

            // Persist analysis BEFORE large evidence frames so report handoff
            // survives Safari sessionStorage pressure.
            stashLastReport(finalRequest);
            stashEvidenceFrames(evidenceMoments);

            track("analysis_succeeded", {
              goal: current.goal,
              remaining:
                typeof result.remaining === "number"
                  ? result.remaining
                  : undefined,
            });

            // Keep the billed result even if the lab unmounts mid-presentation.
            pendingReportRef.current = finalRequest;
            if (!cancelled) {
              setReportReady(true);
              setAnalysisInFlight(false);
              onReady?.(finalRequest);
              logLabPlayback("analyze_ready", {
                presentationElapsedMs:
                  performance.now() - presentationStartedAt,
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

          // Read through a typed local — assigning `null` earlier can narrow
          // useRef.current to `never` under TypeScript control-flow analysis.
          const pending = pendingReportRef.current as AnalysisRequest | null;
          const analysisReady = Boolean(pending?.analysis);
          const stageIndex = resolveLiveLabStageIndex({
            framesReady: true,
            analysisInFlight: !analysisReady,
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
            finishToReport(outcome.finalRequest);
            return;
          }
        }

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

    function runSampleDemo() {
      // ~30s choreography with the real sample clip + MediaPipe overlay.
      // No /api/analyze and no credit consumption.
      const durationMs = sampleDemoDurationMs(prefersReducedMotion());
      const starts = sampleDemoStageStartTimes(durationMs);
      const startedAt = performance.now();
      setFramesReady(true);
      setReportReady(true);
      pendingReportRef.current = current;
      setPresentationElapsedMs(0);
      setActiveStep(0);

      const stageTimers = starts.slice(1).map((startAt, index) =>
        window.setTimeout(() => {
          if (!cancelled) setActiveStep(index + 1);
        }, startAt),
      );

      const progressTick = window.setInterval(() => {
        if (cancelled) return;
        setPresentationElapsedMs(performance.now() - startedAt);
      }, 100);

      const done = window.setTimeout(() => {
        window.clearInterval(progressTick);
        if (cancelled) return;
        setPresentationElapsedMs(durationMs);
        finishToReport(current);
      }, durationMs);

      return () => {
        stageTimers.forEach((t) => window.clearTimeout(t));
        window.clearInterval(progressTick);
        window.clearTimeout(done);
      };
    }

    let cleanupTheatrical: (() => void) | undefined;

    if (isSampleReport(current)) {
      cleanupTheatrical = runSampleDemo();
    } else if (current.file) {
      void runLiveAnalyze();
    } else if (current.analysis) {
      // Precomputed non-sample handoff (rare) — do not re-bill.
      pendingReportRef.current = current;
      setFramesReady(true);
      setReportReady(true);
      finishToReport(current);
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
      ? sampleDemoProgressPct(presentationElapsedMs, sampleDurationMs)
      : liveLabProgressPct({
          framesReady,
          analysisReady: reportReady,
          presentationElapsedMs,
          minPresentationMs,
          forceNow: forceReportNow,
        });

  const showViewReportNow =
    !isSampleDemo &&
    reportReady &&
    !isComplete &&
    !error &&
    !isLeaving;

  const showViewSampleReport =
    isSampleDemo &&
    canShowSampleViewReport({
      elapsedMs: presentationElapsedMs,
      viewAfterMs: sampleViewAfterMs,
      isComplete,
    }) &&
    !error &&
    !isLeaving;

  const showNavRetry = canRetryReportNavigation({
    analysisReady: reportReady,
    navigationError,
  });

  return (
    <main
      className={`analysis-lab${isLeaving ? " is-leaving" : ""}${
        isSampleDemo ? " is-sample-demo" : " is-live-lab"
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
          {!isComplete && !error && isSampleDemo ? (
            <p className="analysis-lab-demo-note">
              Pre-generated demo — no live AI analysis on this clip.
            </p>
          ) : null}
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
          {showViewSampleReport ? (
            <div className="analysis-lab-skip">
              <button
                type="button"
                className="analysis-lab-view-now"
                onClick={handleViewReportNow}
              >
                View Sample Report →
              </button>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="analysis-lab-error" role="alert">
            <strong>
              {navigationError ? "Report handoff interrupted" : "Analysis interrupted"}
            </strong>
            <p>{error}</p>
            <div className="analysis-lab-error-actions">
              {showNavRetry ? (
                <button
                  type="button"
                  className="skel-btn is-primary"
                  onClick={handleRetryOpenReport}
                >
                  Open Report →
                </button>
              ) : null}
              {onBack ? (
                <button type="button" className="skel-btn" onClick={onBack}>
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
                      ? "Demo tracking"
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
                    ? "Live pose overlay on a sample clip — results are pre-generated"
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
                    {isSampleDemo ? "SAMPLE DEMO" : "ASSESSMENT PROGRESS"}
                  </h2>
                  <strong>{isComplete ? "100%" : `${progressPct}%`}</strong>
                </div>
                <div
                  className={`analysis-lab-progress-track${isComplete ? " is-complete" : ""}`}
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-label={
                    isSampleDemo ? "Sample demo progress" : "Analysis progress"
                  }
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
                ? "Opening the pre-generated demo report — not a live assessment."
                : "Your personalized development report is ready to review."}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                void onComplete(pendingReportRef.current ?? request)
              }
            >
              {isSampleDemo ? "View sample report →" : "View Development Report →"}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
