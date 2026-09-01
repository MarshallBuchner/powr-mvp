"use client";

type SampleAssessmentProps = {
  onAnalyze: () => void;
  onBack: () => void;
};

export default function SampleAssessment({
  onAnalyze,
  onBack,
}: SampleAssessmentProps) {
  return (
    <main className="sample-assessment-screen">
      <div className="sample-assessment-container">

        <button
          className="sample-back-button"
          type="button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="sample-assessment-header">
          <p className="eyebrow">POWR SAMPLE ASSESSMENT</p>

          <h1>See what POWR sees.</h1>

          <p>
            Watch this sample skating clip, then run it through POWR
            to see how video becomes actionable coaching feedback.
          </p>
        </div>

        <div className="sample-video-card">
          <div className="sample-video-label">
            SAMPLE SKATING VIDEO
          </div>

          <video
            className="sample-video"
            src="/sample-skating.mp4"
            controls
            playsInline
            preload="metadata"
          />

          <div className="sample-video-info">
            <div>
              <strong>Acceleration sample</strong>
              <span>13-second skating clip</span>
            </div>

            <span className="sample-ready-badge">Ready to analyze</span>
          </div>
        </div>

        <button
          className="sample-analyze-button"
          type="button"
          onClick={onAnalyze}
        >
          <span>Analyze Sample Skating</span>
          <span>→</span>
        </button>

        <p className="sample-explainer">
          This is a demo clip. You will see the same report layout a player
          gets after uploading their own skating video.
        </p>

      </div>
    </main>
  );
}