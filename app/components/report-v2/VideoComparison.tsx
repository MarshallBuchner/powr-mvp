"use client";

export default function VideoComparison() {
  return (
    <div className="rv2-video-compare" aria-label="Side-by-side skating comparison">
      <p className="rv2-section-kicker">SIDE-BY-SIDE COMPARISON</p>
      <div className="rv2-video-grid">
        <div className="rv2-video-panel">
          <div className="rv2-video-frame is-you">
            <span>▶</span>
            <em>Pose overlay placeholder</em>
          </div>
          <strong>YOUR SKATE</strong>
        </div>
        <div className="rv2-video-panel">
          <div className="rv2-video-frame is-pro">
            <span>▶</span>
            <em>Pro reference placeholder</em>
          </div>
          <strong>PRO REFERENCE</strong>
        </div>
      </div>
      <p className="rv2-video-note">
        Video comparison is a preview placeholder in this UI build — live clips
        will plug in without changing the assessment analyze flow.
      </p>
    </div>
  );
}
