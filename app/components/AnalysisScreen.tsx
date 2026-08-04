"use client";

import { useEffect, useMemo, useState } from "react";
import { goalProfiles } from "./goalProfiles";
import type { AnalysisRequest } from "./types";

type AnalysisScreenProps = {
  request: AnalysisRequest;
  onComplete: () => void;
};

type AnalysisStep = {
  label: string;
  detail: string;
};

const analysisSteps: AnalysisStep[] = [
  {
    label: "Uploading clip",
    detail: "Preparing your video for analysis",
  },
  {
    label: "Locating skater",
    detail: "Separating the player from the background",
  },
  {
    label: "Tracking body landmarks",
    detail: "Mapping key joints throughout the movement",
  },
  {
    label: "Measuring skating mechanics",
    detail: "Reviewing posture, stride, balance, and power",
  },
  {
    label: "Comparing movement patterns",
    detail: "Identifying strengths and development opportunities",
  },
  {
    label: "Preparing development report",
    detail: "Turning the analysis into actionable feedback",
  },
];

const brainMessages = [
  {
    title: "VIDEO PREPARATION",
    items: [
      "Video uploaded",
      "Preparing clip",
      "Checking frame quality",
    ],
  },
  {
    title: "PLAYER DETECTION",
    items: [
      "Ice surface detected",
      "Searching for skater",
      "Separating player from background",
    ],
  },
  {
    title: "BODY TRACKING",
    items: [
      "Player isolated",
      "Mapping body landmarks",
      "Tracking lower-body movement",
    ],
  },
  {
    title: "MECHANICS ANALYSIS",
    items: [
      "Reviewing knee bend",
      "Measuring hip extension",
      "Evaluating stride recovery",
    ],
  },
  {
    title: "MOVEMENT COMPARISON",
    items: [
      "Comparing movement patterns",
      "Identifying strengths",
      "Finding development opportunities",
    ],
  },
  {
    title: "REPORT GENERATION",
    items: [
      "Building recommendations",
      "Selecting development drills",
      "Finalizing report",
    ],
  },
];


export default function AnalysisScreen({
  request,
  onComplete,
}: AnalysisScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(4);
  const [isComplete, setIsComplete] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [brainProgress, setBrainProgress] = useState(0);
  const [typedBrainText, setTypedBrainText] = useState("");
  const goalProfile =
    goalProfiles[request.goal] ?? goalProfiles.Acceleration;

  const selectedGoalMessages = goalProfile.analysisMessages;
  const completedSteps = useMemo(
    () => (isComplete ? analysisSteps.length : activeStep),
    [activeStep, isComplete],
  );
  const confidence =
    activeStep > 2 ||
      (activeStep === 2 && brainProgress >= 2) ||
      isComplete
      ? Math.min(99.2, 60 + progress * 0.392)
      : 0;

  const framesProcessed = Math.round(progress * 48.12);

  const strideCycles =
    activeStep > 2 ||
      (activeStep === 2 && brainProgress >= 3) ||
      isComplete
      ? Math.max(1, Math.round(progress / 8))
      : 0;

  const landmarks =
    activeStep > 2 ||
      (activeStep === 2 && brainProgress >= 2) ||
      isComplete
      ? 18
      : 0;

  const edgeStability =
    progress < 35
      ? "Scanning"
      : progress < 65
        ? "Calculating"
        : progress < 90
          ? "Good"
          : "Excellent";

  const headDetected = activeStep >= 2 || isComplete;

  const shouldersDetected = activeStep >= 2 || isComplete;

  const hipsDetected = activeStep >= 3 || isComplete;

  const kneesDetected = activeStep >= 3 || isComplete;

  const anklesDetected = activeStep >= 4 || isComplete;

  const currentBrain =
    isComplete
      ? brainMessages[brainMessages.length - 1]
      : activeStep === 3
        ? {
          ...brainMessages[activeStep],
          items: selectedGoalMessages,
        }
        : brainMessages[activeStep];
  useEffect(() => {
    const totalDuration = 12_000;
    const updateInterval = 120;
    const progressIncrease = 96 / (totalDuration / updateInterval);

    const progressTimer = window.setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = currentProgress + progressIncrease;
        return nextProgress >= 100 ? 100 : nextProgress;
      });
    }, updateInterval);

    const stepTimers = analysisSteps.slice(1).map((_, index) =>
      window.setTimeout(
        () => setActiveStep(index + 1),
        ((index + 1) * totalDuration) / analysisSteps.length,
      ),
    );

    const completionTimer = window.setTimeout(() => {
      setProgress(100);
      setIsComplete(true);
    }, totalDuration);

    const fadeTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, totalDuration + 700);

    const reportTimer = window.setTimeout(() => {
      onComplete();
    }, totalDuration + 1200);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(completionTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(reportTimer);
      stepTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    setBrainProgress(0);

    const timers = [
      window.setTimeout(() => setBrainProgress(1), 300),
      window.setTimeout(() => setBrainProgress(2), 700),
      window.setTimeout(() => setBrainProgress(3), 1100),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [activeStep]);

  useEffect(() => {
    if (isComplete || brainProgress === 0) {
      setTypedBrainText("");
      return;
    }

    const activeMessage = currentBrain.items[brainProgress - 1];

    setTypedBrainText("");

    let characterIndex = 0;

    const typingTimer = window.setInterval(() => {
      characterIndex += 1;

      setTypedBrainText(activeMessage.slice(0, characterIndex));

      if (characterIndex >= activeMessage.length) {
        window.clearInterval(typingTimer);
      }
    }, 28);

    return () => window.clearInterval(typingTimer);
  }, [brainProgress, currentBrain, isComplete]);

  return (
    <main className={`analysis-page ${isLeaving ? "analysis-leaving" : ""}`}>
      <section className="analysis-shell">
        <div className="analysis-heading">
          <span className="eyebrow">POWR ANALYSIS</span>

          <h1>
            {isComplete
              ? "Your development report is ready."
              : `Reviewing your ${request.goal.toLowerCase()} mechanics.`}
          </h1>

          <p>
            {isComplete
              ? "Your movement data has been turned into personalized coaching feedback."
              : `I'm taking a closer look at the movement patterns that affect your ${request.goal.toLowerCase()}.`}
          </p>
        </div>

        <div className="analysis-video">
          <video
            src={request.videoUrl}
            className="analysis-video-player"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div
            className={`scan-line ${activeStep < 2 && !isComplete ? "scan-active" : ""
              }`}
          />
          <div
            className={`body-tracking-overlay ${(activeStep > 2 ||
              (activeStep === 2 && brainProgress >= 2) ||
              isComplete)
              ? "tracking-visible"
              : ""
              }`}
            aria-hidden="true"
          >

            <div className="tracking-skeleton">
              <span
                className={`joint joint-head ${headDetected ? "joint-visible" : ""
                  }`}
              />
              <span
                className={`joint joint-shoulder-left ${shouldersDetected ? "joint-visible" : ""
                  }`}
              />

              <span
                className={`joint joint-shoulder-right ${shouldersDetected ? "joint-visible" : ""
                  }`}
              />
              <span
                className={`joint joint-hip-left ${hipsDetected ? "joint-visible" : ""
                  }`}
              />

              <span
                className={`joint joint-hip-right ${hipsDetected ? "joint-visible" : ""
                  }`}
              />
              <span
                className={`joint joint-knee-left ${kneesDetected ? "joint-visible" : ""
                  }`}
              />

              <span
                className={`joint joint-knee-right ${kneesDetected ? "joint-visible" : ""
                  }`}
              />
              <span
                className={`joint joint-ankle-left ${anklesDetected ? "joint-visible" : ""
                  }`}
              />

              <span
                className={`joint joint-ankle-right ${anklesDetected ? "joint-visible" : ""
                  }`}
              />

              <span className="skeleton-line line-shoulders" />
              <span className="skeleton-line line-torso-left" />
              <span className="skeleton-line line-torso-right" />
              <span className="skeleton-line line-hips" />
              <span className="skeleton-line line-leg-left-top" />
              <span className="skeleton-line line-leg-left-bottom" />
              <span className="skeleton-line line-leg-right-top" />
              <span className="skeleton-line line-leg-right-bottom" />
            </div>
          </div>
          <div className="telemetry-panel">
            <div className="telemetry-title">AI TRACKING</div>

            <div className="telemetry-row">
              <span>Confidence</span>
              <strong>{confidence.toFixed(1)}%</strong>
            </div>

            <div className="telemetry-row">
              <span>Frames</span>
              <strong>{framesProcessed.toLocaleString()}</strong>
            </div>

            <div className="telemetry-row">
              <span>Landmarks</span>
              <strong>{landmarks}</strong>
            </div>

            <div className="telemetry-row">
              <span>Stride Cycles</span>
              <strong>{strideCycles}</strong>
            </div>

            <div className="telemetry-row">
              <span>Edge Stability</span>
              <strong>{edgeStability}</strong>
            </div>
          </div>

          <div className="brain-panel">
            <div className="brain-title">{currentBrain.title}</div>

            <div className="brain-items">
              {currentBrain.items
                .slice(0, isComplete ? currentBrain.items.length : brainProgress)
                .map((item, index) => (
                  <div className="brain-item" key={item}>
                    <span className="brain-check">
                      {index < 2 || isComplete ? "✓" : "•"}
                    </span>

                    <span>
                      {!isComplete && index === brainProgress - 1
                        ? typedBrainText
                        : item}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="analysis-video-status">
            <span className="tracking-dot" />
            <span>{isComplete ? "Analysis complete" : "AI tracking active"}</span>
          </div>
        </div>
        <div className="analysis-card">
          <div className="clip-summary">
            <div className="clip-icon" aria-hidden="true">
              ▶
            </div>

            <div className="clip-details">
              <span className="clip-label">Selected clip</span>
              <strong>{request.fileName}</strong>

              <div className="clip-metadata">
                <span>{request.goal}</span>
                <span className="metadata-divider">•</span>
                <span>{request.duration}</span>
              </div>
            </div>

            <span className="secure-label">SECURE</span>
          </div>

          <div className="core-section">
            <div className={`core-orb ${isComplete ? "complete" : ""}`}>
              <div className="core-ring core-ring-one" />
              <div className="core-ring core-ring-two" />
              <div className="core-center">
                <span>{isComplete ? "✓" : "P"}</span>
              </div>
            </div>

            <div className="core-copy">
              <span className="core-label">POWR CORE</span>
              <strong>
                {isComplete
                  ? "Analysis complete"
                  : analysisSteps[activeStep].label}
              </strong>
              <p>
                {isComplete
                  ? "Your personalized development report is ready to review."
                  : analysisSteps[activeStep].detail}
              </p>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-heading">
              <span>Analysis progress</span>
              <strong>{Math.round(progress)}%</strong>
            </div>

            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="steps-list">
            {analysisSteps.map((step, index) => {
              const isStepComplete = index < completedSteps;
              const isStepActive = !isComplete && index === activeStep;

              return (
                <div
                  className={`analysis-step ${isStepComplete ? "step-complete" : ""
                    } ${isStepActive ? "step-active" : ""}`}
                  key={step.label}
                >
                  <div className="step-status">
                    {isStepComplete ? (
                      <span className="checkmark">✓</span>
                    ) : isStepActive ? (
                      <span className="active-dot" />
                    ) : (
                      <span className="inactive-dot" />
                    )}
                  </div>

                  <div className="step-copy">
                    <strong>{step.label}</strong>
                    <span>{step.detail}</span>
                  </div>

                  <span className="step-state">
                    {isStepComplete
                      ? "Complete"
                      : isStepActive
                        ? "Analyzing"
                        : "Waiting"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="analysis-footer">
            <p>
              {isComplete
                ? "Your results have been prepared."
                : "Keep this page open while POWR completes the assessment."}
            </p>

            <button
              className="report-button"
              type="button"
              onClick={onComplete}
              disabled={!isComplete}
            >
              {isComplete
                ? "View Development Report →"
                : "Analysis in progress"}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
  .analysis-page {
    min-height: 100vh;
    padding: 72px 24px;
    background:
      radial-gradient(
        circle at 50% 20%,
        rgba(184, 255, 46, 0.1),
        transparent 34%
      ),
      #080a08;
    color: #f7f8f4;
    transition:
      opacity 500ms ease,
      transform 500ms ease;
  }

  .analysis-page.analysis-leaving {
    opacity: 0;
    transform: translateY(-10px);
  }

        .analysis-shell {
          width: min(860px, 100%);
          margin: 0 auto;
        }

        .analysis-heading {
          max-width: 680px;
          margin: 0 auto 36px;
          text-align: center;
        }

        .eyebrow,
        .core-label,
        .clip-label,
        .secure-label {
          color: #b8ff2e;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .analysis-heading h1 {
          margin: 14px 0 12px;
          font-size: clamp(2.25rem, 6vw, 4.6rem);
          line-height: 0.98;
          letter-spacing: -0.055em;
        }

        .analysis-heading p {
          margin: 0;
          color: #9ba197;
          font-size: 1rem;
          line-height: 1.7;
        }

        .analysis-card {
          overflow: hidden;
          border: 1px solid #252a23;
          border-radius: 30px;
          background: rgba(15, 18, 14, 0.96);
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.4);
        }

        .clip-summary,
        .core-section,
        .progress-section,
        .analysis-footer {
          padding: 24px 28px;
        }

        .clip-summary {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid #252a23;
        }

        .clip-icon {
          display: grid;
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid rgba(184, 255, 46, 0.25);
          border-radius: 14px;
          background: rgba(184, 255, 46, 0.08);
          color: #b8ff2e;
          font-size: 0.8rem;
        }

        .clip-details {
          min-width: 0;
          flex: 1;
        }

        .clip-details strong {
          display: block;
          overflow: hidden;
          margin-top: 4px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .clip-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 6px;
          color: #858b82;
          font-size: 0.84rem;
        }

        .secure-label {
          color: #747b70;
        }

        .core-section {
          display: flex;
          align-items: center;
          gap: 26px;
          padding-top: 34px;
          padding-bottom: 34px;
        }

        .core-orb {
          position: relative;
          display: grid;
          width: 112px;
          height: 112px;
          flex: 0 0 auto;
          place-items: center;
        }

        .core-ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(184, 255, 46, 0.32);
          border-radius: 50%;
          animation: pulse 2.2s ease-out infinite;
        }

        .core-ring-two {
          animation-delay: 1.1s;
        }

        .core-center {
          position: relative;
          z-index: 2;
          display: grid;
          width: 68px;
          height: 68px;
          place-items: center;
          border: 1px solid rgba(184, 255, 46, 0.5);
          border-radius: 50%;
          background: #b8ff2e;
          box-shadow: 0 0 42px rgba(184, 255, 46, 0.3);
          color: #0a0c09;
          font-size: 1.7rem;
          font-weight: 900;
        }

        .core-orb.complete .core-ring {
          animation: none;
          opacity: 0.35;
        }

        .core-copy {
          min-width: 0;
        }

        .core-copy strong {
          display: block;
          margin-top: 8px;
          font-size: clamp(1.35rem, 4vw, 2rem);
          letter-spacing: -0.035em;
        }

        .core-copy p {
          margin: 8px 0 0;
          color: #91988e;
          line-height: 1.55;
        }

        .progress-section {
          padding-top: 0;
        }

        .progress-heading {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #a4aaa0;
          font-size: 0.86rem;
        }

        .progress-heading strong {
          color: #b8ff2e;
        }

        .progress-track {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: #272c25;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fe41e, #c8ff5d);
          box-shadow: 0 0 18px rgba(184, 255, 46, 0.25);
          transition: width 180ms linear;
        }

        .steps-list {
          border-top: 1px solid #252a23;
          border-bottom: 1px solid #252a23;
        }

        .analysis-step {
          display: grid;
          grid-template-columns: 26px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 18px 28px;
          border-bottom: 1px solid #20241f;
          opacity: 0.42;
          transition:
            opacity 250ms ease,
            background 250ms ease;
        }

        .analysis-step:last-child {
          border-bottom: 0;
        }

        .analysis-step.step-active {
          background: rgba(184, 255, 46, 0.035);
          opacity: 1;
        }

        .analysis-step.step-complete {
          opacity: 0.82;
        }

        .step-status {
          display: grid;
          place-items: center;
        }

        .checkmark {
          display: grid;
          width: 22px;
          height: 22px;
          place-items: center;
          border-radius: 50%;
          background: #b8ff2e;
          color: #0a0c09;
          font-size: 0.72rem;
          font-weight: 900;
        }

        .active-dot,
        .inactive-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .active-dot {
          background: #b8ff2e;
          box-shadow: 0 0 0 6px rgba(184, 255, 46, 0.1);
          animation: blink 1.1s ease-in-out infinite;
        }

        .inactive-dot {
          background: #555b52;
        }

        .step-copy strong,
        .step-copy span {
          display: block;
        }

        .step-copy strong {
          font-size: 0.95rem;
        }

        .step-copy span {
          margin-top: 4px;
          color: #7f867c;
          font-size: 0.8rem;
        }

        .step-state {
          color: #747b70;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .step-active .step-state,
        .step-complete .step-state {
          color: #b8ff2e;
        }

        .analysis-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .analysis-footer p {
          margin: 0;
          color: #777e74;
          font-size: 0.82rem;
        }

        .report-button {
          min-height: 48px;
          padding: 0 22px;
          border: 0;
          border-radius: 999px;
          background: #b8ff2e;
          color: #0a0c09;
          cursor: pointer;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 850;
          transition:
            transform 180ms ease,
            opacity 180ms ease;
        }

        .report-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .report-button:disabled {
          background: #242923;
          color: #6f766c;
          cursor: not-allowed;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.58);
            opacity: 0.8;
          }

          100% {
            transform: scale(1.12);
            opacity: 0;
          }
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 0.45;
          }

          50% {
            opacity: 1;
          }
        }
        .analysis-video {
          position: relative;
          margin: 0 auto 32px;
          overflow: hidden;
          border: 1px solid #252a23;
          border-radius: 28px;
          background: #050605;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
        }
        
        .analysis-video::after {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            transparent 55%,
            rgba(0, 0, 0, 0.5) 100%
          );
          content: "";
        }
        
        .analysis-video-player {
          display: block;
          width: 100%;
          max-height: 520px;
          object-fit: contain;
          background: #000;
        }
        .body-tracking-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 600ms ease;
        }
        
        .body-tracking-overlay.tracking-visible {
          opacity: 1;
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 2;
          height: 3px;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(184, 255, 46, 0.95),
            transparent
          );
          opacity: 0;
        }
        
        .scan-active {
          opacity: 0.85;
          animation: scanDown 2.8s linear infinite;
        }
        .tracking-skeleton {
          position: absolute;
          top: 16%;
          left: 50%;
          width: 190px;
          height: 330px;
          transform: translateX(-50%);
          filter: drop-shadow(0 0 8px rgba(184, 255, 46, 0.45));
        }
        
        .joint {
          position: absolute;
          z-index: 2;
          opacity: 0;

transform: scale(0.4);

transition:
  opacity 350ms ease,
  transform 350ms ease;
          width: 11px;
          height: 11px;
          border: 2px solid #b8ff2e;
          border-radius: 50%;
          background: rgba(8, 10, 8, 0.8);
          box-shadow:
            0 0 0 5px rgba(184, 255, 46, 0.08),
            0 0 14px rgba(184, 255, 46, 0.65);
          animation: jointPulse 1.5s ease-in-out infinite;
        }

        .joint-visible {
          opacity: 1;
          transform: scale(1);
        }
        
        .joint-head {
          top: 0;
          left: 90px;
        }
        
        .joint-shoulder-left {
          top: 60px;
          left: 48px;
        }
        
        .joint-shoulder-right {
          top: 60px;
          right: 48px;
        }
        
        .joint-hip-left {
          top: 155px;
          left: 66px;
        }
        
        .joint-hip-right {
          top: 155px;
          right: 66px;
        }
        
        .joint-knee-left {
          top: 235px;
          left: 45px;
        }
        
        .joint-knee-right {
          top: 235px;
          right: 45px;
        }
        
        .joint-ankle-left {
          bottom: 0;
          left: 20px;
        }
        
        .joint-ankle-right {
          right: 20px;
          bottom: 0;
        }
        
        .skeleton-line {
          position: absolute;
          z-index: 1;
          height: 2px;
          background: linear-gradient(
            90deg,
            rgba(184, 255, 46, 0.25),
            rgba(184, 255, 46, 0.9),
            rgba(184, 255, 46, 0.25)
          );
          transform-origin: left center;
        }
        
        .line-shoulders {
          top: 65px;
          left: 54px;
          width: 82px;
        }
        
        .line-torso-left {
          top: 68px;
          left: 53px;
          width: 97px;
          transform: rotate(79deg);
        }
        
        .line-torso-right {
          top: 68px;
          right: 53px;
          width: 97px;
          transform: rotate(101deg);
          transform-origin: right center;
        }
        
        .line-hips {
          top: 160px;
          left: 72px;
          width: 46px;
        }
        
        .line-leg-left-top {
          top: 163px;
          left: 71px;
          width: 82px;
          transform: rotate(106deg);
        }
        
        .line-leg-left-bottom {
          top: 241px;
          left: 50px;
          width: 93px;
          transform: rotate(109deg);
        }
        
        .line-leg-right-top {
          top: 163px;
          right: 71px;
          width: 82px;
          transform: rotate(74deg);
          transform-origin: right center;
        }
        
        .line-leg-right-bottom {
          top: 241px;
          right: 50px;
          width: 93px;
          transform: rotate(71deg);
          transform-origin: right center;
        }
        @keyframes scanDown{

          0%{
              top:-10%;
          }
        
          100%{
              top:110%;
          }
        
        }
        @keyframes jointPulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.7;
          }
        
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
        .telemetry-panel {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 2;
        
          width: 220px;
        
          padding: 16px;
        
          border: 1px solid rgba(184,255,46,.18);
          border-radius: 18px;
        
          background: rgba(8,10,8,.72);
          backdrop-filter: blur(18px);
        
          color: white;
        }

        .brain-panel {
          position: absolute;
          top: 250px;
          left: 18px;
          z-index: 2;
        
          width: 220px;
        
          padding: 16px;
        
          border: 1px solid rgba(184,255,46,.18);
          border-radius: 18px;
        
          background: rgba(8,10,8,.72);
          backdrop-filter: blur(18px);
        
          color: white;
        }
        
        .brain-title {
          margin-bottom: 14px;
        
          color: #b8ff2e;
        
          font-size: .72rem;
          font-weight: 800;
          letter-spacing: .18em;
        }
        
        .brain-item {
          display: flex;
          align-items: center;
          gap: 10px;
        
          margin-bottom: 10px;
        
          font-size: .82rem;
        }
        
        .brain-item:last-child {
          margin-bottom: 0;
        }
        
        .brain-check {
          color: #b8ff2e;
          font-weight: 800;
        }
        
        .telemetry-title{
          margin-bottom:14px;
        
          color:#b8ff2e;
        
          font-size:.72rem;
          font-weight:800;
          letter-spacing:.18em;
        }
        
        .telemetry-row{
          display:flex;
          justify-content:space-between;
        
          margin-bottom:10px;
        
          font-size:.82rem;
        }
        
        .telemetry-row:last-child{
          margin-bottom:0;
        }
        
        .telemetry-row span{
          color:#8d9388;
        }
        
        .telemetry-row strong{
          color:white;
        }
        .analysis-video-status {
          position: absolute;
          z-index: 2;
          right: 20px;
          bottom: 18px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 13px;
          border: 1px solid rgba(184, 255, 46, 0.22);
          border-radius: 999px;
          background: rgba(8, 10, 8, 0.78);
          color: #e9eee4;
          font-size: 0.74rem;
          font-weight: 750;
          letter-spacing: 0.04em;
          backdrop-filter: blur(12px);
        }
        
        .tracking-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #b8ff2e;
          box-shadow: 0 0 0 5px rgba(184, 255, 46, 0.1);
          animation: blink 1.1s ease-in-out infinite;
        }
        
        @media (max-width: 640px) {
          .analysis-page {
            padding: 48px 16px;
          }

          .telemetry-panel,
.brain-panel {
  position: relative;
  top: auto;
  left: auto;
  width: auto;
  margin: 16px;
}

.brain-panel {
  margin-top: 0;
}

          .analysis-card {
            border-radius: 24px;
          }

          .clip-summary,
          .core-section,
          .progress-section,
          .analysis-footer {
            padding-right: 20px;
            padding-left: 20px;
          }

          .secure-label {
            display: none;
          }

          .core-section {
            flex-direction: column;
            text-align: center;
          }

          .analysis-step {
            grid-template-columns: 24px minmax(0, 1fr);
            padding-right: 20px;
            padding-left: 20px;
          }

          .step-state {
            display: none;
          }

          .analysis-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .report-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}