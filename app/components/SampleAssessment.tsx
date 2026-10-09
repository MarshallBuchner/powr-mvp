"use client";

import { useState } from "react";

type SampleAssessmentProps = {
  onAnalyze: () => void;
  onBack: () => void;
};

export default function SampleAssessment({
  onAnalyze,
  onBack,
}: SampleAssessmentProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <main className="sample-assessment-screen">
      <div className="sample-assessment-container">
        <button className="sample-back-button" type="button" onClick={onBack}>
          ← Back
        </button>

        <div className="sample-assessment-header">
          <p className="eyebrow">POWR SAMPLE ASSESSMENT</p>

          <h1>See what POWR sees.</h1>

          <p>
            Watch this sample skating clip, then open a{" "}
            <strong>pre-generated demo report</strong> that shows the same layout
            a player gets after a live assessment.
          </p>
        </div>

        <div className="sample-video-card">
          <div className="sample-video-label">SAMPLE SKATING VIDEO</div>

          <video
            className="sample-video"
            src="/sample-skating.mp4"
            poster="/sample-skating-poster.jpg"
            controls
            playsInline
            preload="metadata"
          />

          <div className="sample-video-info">
            <div>
              <strong>Acceleration sample</strong>
              <span>13-second skating clip</span>
            </div>

            <span className="sample-ready-badge">Demo ready</span>
          </div>
        </div>

        <label className="consent-check sample-demo-ack">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>
            I understand this is a <strong>pre-generated sample/demo</strong> —
            POWR will not run a new live AI assessment on this clip.
          </span>
        </label>

        <button
          className="sample-analyze-button"
          type="button"
          disabled={!acknowledged}
          onClick={onAnalyze}
        >
          <span>Watch sample analysis</span>
          <span>→</span>
        </button>

        <p className="sample-explainer">
          Next you&apos;ll see the sample clip with a green tracking overlay,
          then a <strong>pre-generated</strong> report — no live AI analysis and
          no assessment credit used.
        </p>
      </div>
    </main>
  );
}
