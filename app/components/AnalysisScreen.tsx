"use client";

/**
 * POWR Analysis Lab — full-screen “watch POWR analyze your clip” experience.
 * Runs the real /api/analyze request while MediaPipe pose overlays the uploaded video.
 * Pose is an enhancement: if it fails, assessment generation continues normally.
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
  SAMPLE_DEMO_COMPLETE_HOLD_MS,
  SAMPLE_DEMO_DURATION_MS,
  SAMPLE_DEMO_LEAVE_MS,
  SAMPLE_DEMO_STAGES,
  sampleDemoProgressPct,
  sampleDemoStageStartTimes,
} from "@/lib/sampleLabDemo";

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

const LAB_STAGES = [
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
  const [sampleElapsedMs, setSampleElapsedMs] = useState(0);
  const isSampleDemo = isSampleReport(request);
  const poseLimited = poseStatus === "error";
  const finishedRef = useRef(false);
  const requestRef = useRef(request);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const visibleStages = isSampleDemo ? SAMPLE_DEMO_STAGES : LAB_STAGES;

  const completedSteps = useMemo(
    () => (isComplete ? visibleStages.length : activeStep),
    [activeStep, isComplete, visibleStages.length],
  );

  const headline = isComplete
    ? isSampleDemo
      ? "Your sample report is ready."
      : "Your development report is ready."
    : isSampleDemo
      ? (SAMPLE_DEMO_STAGES[activeStep]?.label ??
        SAMPLE_DEMO_STAGES[0].label)
      : `Reviewing your ${request.goal.toLowerCase()} mechanics.`;

  const subcopy = isComplete
    ? isSampleDemo
      ? "This is a pre-generated demo report — not a new live assessment."
      : "Your personalized development report is ready to review."
    : isSampleDemo
      ? (SAMPLE_DEMO_STAGES[activeStep]?.detail ??
        SAMPLE_DEMO_STAGES[0].detail)
      : LAB_STAGES[activeStep]?.detail ??
        "Taking a closer look at the movement patterns visible in your clip.";

  const finishToReport = useCallback(
    (finalRequest: AnalysisRequest) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onReady?.(finalRequest);
      setActiveStep(LAB_STAGES.length - 1);
      setIsComplete(true);
      // Live path: navigate while the lab is still visible. Fading first caused
      // a long blank stretch on mobile while the share token request was in flight.
      void (async () => {
        try {
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
    [onComplete, onReady],
  );

  /** Sample-only: hold a complete beat, fade out, then open the fixed report. */
  const finishSampleDemo = useCallback(
    (finalRequest: AnalysisRequest) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onReady?.(finalRequest);
      setActiveStep(SAMPLE_DEMO_STAGES.length - 1);
      setIsComplete(true);
      void (async () => {
        try {
          await delay(SAMPLE_DEMO_COMPLETE_HOLD_MS);
          setIsLeaving(true);
          await delay(SAMPLE_DEMO_LEAVE_MS);
          await onComplete();
        } catch (err) {
          console.error("POWR sample report navigation failed", err);
          finishedRef.current = false;
          setIsComplete(false);
          setIsLeaving(false);
          setError(
            "The sample demo finished, but opening the report failed. Tap below to try again.",
          );
        }
      })();
    },
    [onComplete, onReady],
  );

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

      try {
        setActiveStep(0);
        await delay(350);
        if (cancelled) return;

        setActiveStep(1);
        const frames = await extractVideoFrames(current.file, 5);
        if (cancelled) return;

        setActiveStep(2);
        await delay(200);
        if (cancelled) return;
        setActiveStep(3);

        // Advance mid-stages while the network request is in flight (UX only).
        const midTimer = window.setTimeout(() => {
          if (!cancelled) setActiveStep((s) => Math.max(s, 4));
        }, 4000);
        const lateTimer = window.setTimeout(() => {
          if (!cancelled) setActiveStep((s) => Math.max(s, 5));
        }, 12000);

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frames: frames.map((frame) => frame.dataUrl),
            goal: current.goal,
          }),
        });
        window.clearTimeout(midTimer);
        window.clearTimeout(lateTimer);
        if (cancelled) return;

        const result = await response.json();

        if (response.status === 402 || result.error === "free_assessment_used") {
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

        // Only mirror entitlements after a successful usable analysis.
        // Unusable clips return above without consuming credits.
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

        setActiveStep(5);
        await delay(280);
        if (cancelled) return;
        setActiveStep(6);
        await delay(320);
        if (cancelled) return;

        const finalRequest: AnalysisRequest = {
          ...current,
          analysis: result.analysis,
          evidenceMoments,
        };
        finishToReport(finalRequest);
      } catch (err) {
        if (cancelled) return;
        console.error("POWR analysis lab failed", err);
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

    function runLiveTheatrical() {
      // Non-sample theatrical fallback (kept short). Sample uses runSampleDemo.
      const total = 2400;
      const timers = LAB_STAGES.slice(1).map((_, index) =>
        window.setTimeout(
          () => {
            if (!cancelled) setActiveStep(index + 1);
          },
          ((index + 1) * total) / LAB_STAGES.length,
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

    function runSampleDemo() {
      // ~13.5s choreography so visitors can see skating + green skeleton.
      // Does not call /api/analyze or consume credits.
      const starts = sampleDemoStageStartTimes();
      const startedAt = performance.now();
      setSampleElapsedMs(0);
      setActiveStep(0);

      const stageTimers = starts.slice(1).map((startAt, index) =>
        window.setTimeout(() => {
          if (!cancelled) setActiveStep(index + 1);
        }, startAt),
      );

      const progressTick = window.setInterval(() => {
        if (cancelled) return;
        setSampleElapsedMs(performance.now() - startedAt);
      }, 100);

      const done = window.setTimeout(() => {
        window.clearInterval(progressTick);
        if (cancelled) return;
        setSampleElapsedMs(SAMPLE_DEMO_DURATION_MS);
        finishSampleDemo(current);
      }, SAMPLE_DEMO_DURATION_MS);

      return () => {
        stageTimers.forEach((t) => window.clearTimeout(t));
        window.clearInterval(progressTick);
        window.clearTimeout(done);
      };
    }

    let cleanupTheatrical: (() => void) | undefined;

    if (isSampleReport(current)) {
      cleanupTheatrical = runSampleDemo();
    } else if (current.analysis || (!current.file && current.videoUrl)) {
      cleanupTheatrical = runLiveTheatrical();
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
      ? sampleDemoProgressPct(sampleElapsedMs)
      : Math.min(
          96,
          Math.round(
            ((activeStep + 0.35) / LAB_STAGES.length) * 100,
          ),
        );

  return (
    <main
      className={`analysis-lab${isSampleDemo ? " is-sample-demo" : ""}${
        isLeaving ? " is-leaving" : ""
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
              Keep this page open while we finish your assessment.
            </p>
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
              {request.videoUrl ? (
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
                  Preparing your clip…
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
                    : "Pose estimates"}
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
                    {isSampleDemo ? "SAMPLE DEMO" : "REPORT GENERATION"}
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
