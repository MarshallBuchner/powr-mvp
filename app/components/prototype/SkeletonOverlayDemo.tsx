"use client";

/**
 * Prototype shell: upload → pose overlay player → heuristic metrics panel.
 */

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { SkeletonColor } from "./poseDrawing";
import type { PrototypeMetrics } from "./poseMetrics";
import type { PoseDebugInfo } from "./PoseVideoPlayer";

// MediaPipe uses browser/WASM APIs — load the player client-only.
const PoseVideoPlayer = dynamic(() => import("./PoseVideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="skel-player-placeholder">Preparing pose player…</div>
  ),
});

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

function formatDeg(v: number | null): string {
  return v == null ? "—" : `${v}°`;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="skel-metric-card">
      <p className="skel-metric-label">{label}</p>
      <p className="skel-metric-value">{value}</p>
      {hint ? <p className="skel-metric-hint">{hint}</p> : null}
    </div>
  );
}

export default function SkeletonOverlayDemo() {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showKeypoints, setShowKeypoints] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [skeletonColor, setSkeletonColor] = useState<SkeletonColor>("green");
  const [metrics, setMetrics] = useState<PrototypeMetrics>(EMPTY_METRICS);
  const [debug, setDebug] = useState<PoseDebugInfo | null>(null);

  // Revoke blob URLs when replaced / unmounted
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const loadFile = useCallback((file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      window.alert("Please upload a video file (mp4, mov, or webm).");
      return;
    }
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    setMetrics(EMPTY_METRICS);
    setDebug(null);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    loadFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  const clearVideo = () => {
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName(null);
    setMetrics(EMPTY_METRICS);
    setDebug(null);
  };

  const captureFrame = async () => {
    // Composite video + canvas into a PNG download
    const stage = document.querySelector(".skel-player-stage") as HTMLElement | null;
    const video = stage?.querySelector("video") as HTMLVideoElement | null;
    const canvas = stage?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!video || !canvas) return;

    const out = document.createElement("canvas");
    out.width = canvas.width || video.clientWidth;
    out.height = canvas.height || video.clientHeight;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `powr-skeleton-frame-${Math.floor(video.currentTime * 1000)}.png`;
    a.click();
  };

  return (
    <div className="skel-demo">
      <header className="skel-demo-header">
        <p className="eyebrow">POWR LABS</p>
        <h1>POWR Skeleton Overlay Prototype</h1>
        <p className="skel-demo-lead">
          Upload a hockey clip to preview live pose tracking.
        </p>
        <p className="skel-demo-note">
          Prototype only — results are for concept validation. Metrics are
          heuristic estimates from on-device pose landmarks, not a full POWR
          biomechanics report.
        </p>
      </header>

      {!objectUrl ? (
        <div
          className={`skel-dropzone${dragOver ? " is-dragover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p className="skel-dropzone-title">Drop a skating or shooting clip</p>
          <p className="skel-dropzone-sub">
            Upload a skating or shooting clip to preview pose tracking. Accepts
            mp4, mov, or webm — processed entirely in your browser.
          </p>
          <label className="skel-btn is-primary skel-file-label">
            Choose video
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              onChange={onFileInput}
              hidden
            />
          </label>
        </div>
      ) : (
        <div className="skel-workspace">
          <div className="skel-workspace-main">
            <div className="skel-file-row">
              <span className="skel-file-name">{fileName}</span>
              <div className="skel-file-actions">
                <label className="skel-btn skel-file-label">
                  Replace
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/*"
                    onChange={onFileInput}
                    hidden
                  />
                </label>
                <button type="button" className="skel-btn" onClick={clearVideo}>
                  Clear
                </button>
                <button type="button" className="skel-btn" onClick={captureFrame}>
                  Capture frame
                </button>
              </div>
            </div>

            <PoseVideoPlayer
              src={objectUrl}
              showSkeleton={showSkeleton}
              showKeypoints={showKeypoints}
              showLabels={showLabels}
              skeletonColor={skeletonColor}
              onMetrics={setMetrics}
              onDebug={setDebug}
            />

            <div className="skel-toggles">
              <label className="skel-toggle">
                <input
                  type="checkbox"
                  checked={showSkeleton}
                  onChange={(e) => setShowSkeleton(e.target.checked)}
                />
                Show skeleton
              </label>
              <label className="skel-toggle">
                <input
                  type="checkbox"
                  checked={showKeypoints}
                  onChange={(e) => setShowKeypoints(e.target.checked)}
                />
                Show keypoints
              </label>
              <label className="skel-toggle">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
                Show labels
              </label>
              <label className="skel-toggle">
                Color
                <select
                  value={skeletonColor}
                  onChange={(e) =>
                    setSkeletonColor(e.target.value as SkeletonColor)
                  }
                >
                  <option value="green">Neon green</option>
                  <option value="white">White</option>
                </select>
              </label>
            </div>
          </div>

          <aside className="skel-workspace-side">
            <div className="skel-side-header">
              <h2>Prototype metrics</h2>
              <p>Estimated from pose landmarks while the clip plays.</p>
            </div>

            <div className="skel-metric-grid">
              <MetricCard
                label="Knee bend"
                value={formatDeg(metrics.kneeBendDeg)}
                hint="Angle at the leading knee"
              />
              <MetricCard
                label="Torso angle"
                value={formatDeg(metrics.torsoAngleDeg)}
                hint="Lean vs vertical"
              />
              <MetricCard
                label="Shin angle"
                value={formatDeg(metrics.shinAngleDeg)}
              />
              <MetricCard
                label="Forward lean"
                value={formatDeg(metrics.forwardLeanDeg)}
              />
              <MetricCard label="Stride posture" value={metrics.stridePosture} />
              <MetricCard label="Balance" value={metrics.balance} />
              <MetricCard
                label="Confidence"
                value={`${metrics.confidencePct}%`}
              />
              <MetricCard
                label="Stance width"
                value={
                  metrics.stanceWidth == null
                    ? "—"
                    : `${Math.round(metrics.stanceWidth * 100)}%`
                }
                hint="Ankle separation / frame"
              />
            </div>

            <div className="skel-debug">
              <h3>Frame status</h3>
              <ul>
                <li>
                  Time:{" "}
                  <strong>
                    {debug ? `${debug.currentTime.toFixed(2)}s` : "—"}
                  </strong>
                </li>
                <li>
                  Pose detected:{" "}
                  <strong>
                    {debug ? (debug.poseDetected ? "Yes" : "No") : "—"}
                  </strong>
                </li>
                <li>
                  Landmarks: <strong>{debug?.landmarkCount ?? "—"}</strong>
                </li>
                <li>
                  Detection confidence:{" "}
                  <strong>
                    {debug ? `${debug.confidencePct}%` : "—"}
                  </strong>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
