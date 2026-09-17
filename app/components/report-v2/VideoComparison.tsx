"use client";

import { Expand, Pause, Play } from "lucide-react";
import { useState } from "react";

type VideoComparisonProps = {
  youImage: string;
  proImage: string;
  youAngle: string;
  proAngle: string;
  duration: string;
};

export default function VideoComparison({
  youImage,
  proImage,
  youAngle,
  proAngle,
  duration,
}: VideoComparisonProps) {
  const [playing, setPlaying] = useState(false);
  const [slide, setSlide] = useState(12);

  return (
    <div className="rv2-video-compare" aria-label="Side-by-side skating comparison">
      <p className="rv2-section-kicker">SIDE-BY-SIDE COMPARISON</p>
      <div className="rv2-video-grid">
        <div className="rv2-video-panel">
          <div
            className="rv2-video-frame is-you"
            style={{ backgroundImage: `url(${youImage})` }}
          >
            <span className="rv2-angle is-warn">{youAngle}</span>
            <button
              type="button"
              className="rv2-play"
              aria-label="Play your skate clip"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
          <strong>YOUR SKATE</strong>
        </div>
        <div className="rv2-video-panel">
          <div
            className="rv2-video-frame is-pro"
            style={{ backgroundImage: `url(${proImage})` }}
          >
            <span className="rv2-angle is-good">{proAngle}</span>
            <button
              type="button"
              className="rv2-play"
              aria-label="Play pro reference clip"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
          <strong>PRO REFERENCE</strong>
        </div>
      </div>
      <div className="rv2-video-controls">
        <button
          type="button"
          className="rv2-control-btn"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <input
          type="range"
          min={0}
          max={38}
          value={slide}
          onChange={(e) => setSlide(Number(e.target.value))}
          aria-label="Scrub comparison"
        />
        <span>
          0:{String(slide).padStart(2, "0")} / {duration}
        </span>
        <em>1x</em>
        <Expand size={14} aria-hidden="true" />
      </div>
      <p className="rv2-video-note">
        Demo stills with pose-style overlays. Live clips + real angles plug in
        later — analyze flow stays unchanged.
      </p>
    </div>
  );
}
