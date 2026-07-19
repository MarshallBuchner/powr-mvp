"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function AnalysisScreen({
  request,
  onComplete,
}: AnalysisScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(4);
  const [isComplete, setIsComplete] = useState(false);

  const completedSteps = useMemo(
    () => (isComplete ? analysisSteps.length : activeStep),
    [activeStep, isComplete],
  );

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

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(completionTimer);
      stepTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <main className="analysis-page">
      <section className="analysis-shell">
        <div className="analysis-heading">
          <span className="eyebrow">POWR ANALYSIS</span>

          <h1>
            {isComplete
              ? "Your development report is ready."
              : "Analyzing your skating."}
          </h1>

          <p>
            {isComplete
              ? "Your movement data has been processed into personalized feedback."
              : "POWR is reviewing your movement frame by frame."}
          </p>
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
                  className={`analysis-step ${
                    isStepComplete ? "step-complete" : ""
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

        @media (max-width: 640px) {
          .analysis-page {
            padding: 48px 16px;
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