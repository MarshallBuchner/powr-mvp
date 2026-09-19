/**
 * Drawing helpers for MediaPipe pose landmarks on a 2D canvas.
 * Landmark coords are normalized (0–1) relative to the video frame.
 */

import { PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";

export type SkeletonColor = "green" | "white";

const COLORS: Record<SkeletonColor, { line: string; joint: string; label: string }> = {
  green: {
    line: "rgba(184, 255, 59, 0.92)",
    joint: "rgba(247, 248, 249, 0.95)",
    label: "rgba(184, 255, 59, 0.85)",
  },
  white: {
    line: "rgba(247, 248, 249, 0.92)",
    joint: "rgba(184, 255, 59, 0.95)",
    label: "rgba(247, 248, 249, 0.8)",
  },
};

/** Sparse labels for a few major joints — keeps the overlay readable. */
const LABEL_MAP: Record<number, string> = {
  0: "nose",
  11: "L.shoulder",
  12: "R.shoulder",
  23: "L.hip",
  24: "R.hip",
  25: "L.knee",
  26: "R.knee",
  27: "L.ankle",
  28: "R.ankle",
};

export type DrawPoseOptions = {
  showSkeleton: boolean;
  showKeypoints: boolean;
  showLabels: boolean;
  color: SkeletonColor;
  /** Minimum visibility to draw a landmark (0–1). */
  minVisibility?: number;
};

function isVisible(lm: NormalizedLandmark, minVisibility: number): boolean {
  // visibility may be undefined on some builds — treat missing as visible
  const v = typeof lm.visibility === "number" ? lm.visibility : 1;
  return v >= minVisibility;
}

export function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
}

export function drawPoseLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  options: DrawPoseOptions,
) {
  const minV = options.minVisibility ?? 0.35;
  const palette = COLORS[options.color];

  if (options.showSkeleton) {
    ctx.lineWidth = Math.max(2, Math.round(width * 0.0035));
    ctx.lineCap = "round";
    ctx.strokeStyle = palette.line;
    ctx.shadowColor = palette.line;
    ctx.shadowBlur = 6;

    for (const conn of PoseLandmarker.POSE_CONNECTIONS) {
      const a = landmarks[conn.start];
      const b = landmarks[conn.end];
      if (!a || !b) continue;
      if (!isVisible(a, minV) || !isVisible(b, minV)) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  if (options.showKeypoints) {
    const r = Math.max(3, Math.round(width * 0.006));
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!isVisible(lm, minV)) continue;
      ctx.beginPath();
      ctx.fillStyle = palette.joint;
      ctx.arc(lm.x * width, lm.y * height, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (options.showLabels) {
    ctx.font = `600 ${Math.max(10, Math.round(width * 0.018))}px system-ui, sans-serif`;
    ctx.fillStyle = palette.label;
    ctx.textBaseline = "bottom";
    for (const [idxStr, label] of Object.entries(LABEL_MAP)) {
      const lm = landmarks[Number(idxStr)];
      if (!lm || !isVisible(lm, minV)) continue;
      ctx.fillText(label, lm.x * width + 6, lm.y * height - 6);
    }
  }
}
