/**
 * Lightweight biomechanical heuristics from MediaPipe pose landmarks.
 * Values are approximate and labeled as prototype/demo metrics in the UI.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type PrototypeMetrics = {
  kneeBendDeg: number | null;
  torsoAngleDeg: number | null;
  shinAngleDeg: number | null;
  forwardLeanDeg: number | null;
  stanceWidth: number | null; // normalized fraction of frame width
  stridePosture: "Good" | "Tall" | "Deep" | "—";
  balance: "Stable" | "Shifting" | "—";
  confidencePct: number;
};

const IDX = {
  lShoulder: 11,
  rShoulder: 12,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnkle: 27,
  rAnkle: 28,
} as const;

function angleAtJoint(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
): number {
  // Angle ABC in degrees (at point b)
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (mag < 1e-6) return 0;
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

function segmentAngleFromVertical(
  top: NormalizedLandmark,
  bottom: NormalizedLandmark,
): number {
  // 0° = upright vertical; positive = lean in image space
  const dx = bottom.x - top.x;
  const dy = bottom.y - top.y;
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return Math.abs(deg);
}

function mid(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
): NormalizedLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
    visibility: ((a.visibility ?? 1) + (b.visibility ?? 1)) / 2,
  };
}

function vis(lm: NormalizedLandmark | undefined): number {
  if (!lm) return 0;
  return typeof lm.visibility === "number" ? lm.visibility : 0.8;
}

function avgConfidence(landmarks: NormalizedLandmark[]): number {
  if (!landmarks.length) return 0;
  let sum = 0;
  for (const lm of landmarks) sum += vis(lm);
  return sum / landmarks.length;
}

export function computePrototypeMetrics(
  landmarks: NormalizedLandmark[] | null,
): PrototypeMetrics {
  if (!landmarks || landmarks.length < 29) {
    return {
      kneeBendDeg: null,
      torsoAngleDeg: null,
      shinAngleDeg: null,
      forwardLeanDeg: null,
      stanceWidth: null,
      stridePosture: "—",
      balance: "—",
      confidencePct: 0,
    };
  }

  const conf = avgConfidence(landmarks);
  const confidencePct = Math.round(conf * 100);

  // Prefer the more visible leg for knee/shin
  const leftKneeScore = vis(landmarks[IDX.lHip]) + vis(landmarks[IDX.lKnee]) + vis(landmarks[IDX.lAnkle]);
  const rightKneeScore = vis(landmarks[IDX.rHip]) + vis(landmarks[IDX.rKnee]) + vis(landmarks[IDX.rAnkle]);
  const useLeft = leftKneeScore >= rightKneeScore;

  const hip = landmarks[useLeft ? IDX.lHip : IDX.rHip];
  const knee = landmarks[useLeft ? IDX.lKnee : IDX.rKnee];
  const ankle = landmarks[useLeft ? IDX.lAnkle : IDX.rAnkle];

  const kneeBendDeg =
    vis(hip) > 0.3 && vis(knee) > 0.3 && vis(ankle) > 0.3
      ? Math.round(angleAtJoint(hip, knee, ankle))
      : null;

  const shinAngleDeg =
    vis(knee) > 0.3 && vis(ankle) > 0.3
      ? Math.round(segmentAngleFromVertical(knee, ankle))
      : null;

  const lShoulder = landmarks[IDX.lShoulder];
  const rShoulder = landmarks[IDX.rShoulder];
  const lHip = landmarks[IDX.lHip];
  const rHip = landmarks[IDX.rHip];

  let torsoAngleDeg: number | null = null;
  let forwardLeanDeg: number | null = null;
  if (vis(lShoulder) > 0.3 && vis(rShoulder) > 0.3 && vis(lHip) > 0.3 && vis(rHip) > 0.3) {
    const shoulderMid = mid(lShoulder, rShoulder);
    const hipMid = mid(lHip, rHip);
    torsoAngleDeg = Math.round(segmentAngleFromVertical(shoulderMid, hipMid));
    forwardLeanDeg = torsoAngleDeg;
  }

  let stanceWidth: number | null = null;
  if (vis(landmarks[IDX.lAnkle]) > 0.3 && vis(landmarks[IDX.rAnkle]) > 0.3) {
    stanceWidth = Math.abs(landmarks[IDX.lAnkle].x - landmarks[IDX.rAnkle].x);
  }

  let stridePosture: PrototypeMetrics["stridePosture"] = "—";
  if (kneeBendDeg != null) {
    if (kneeBendDeg >= 145) stridePosture = "Tall";
    else if (kneeBendDeg >= 105) stridePosture = "Good";
    else stridePosture = "Deep";
  }

  let balance: PrototypeMetrics["balance"] = "—";
  if (stanceWidth != null && torsoAngleDeg != null) {
    balance = stanceWidth > 0.08 && torsoAngleDeg < 35 ? "Stable" : "Shifting";
  }

  return {
    kneeBendDeg,
    torsoAngleDeg,
    shinAngleDeg,
    forwardLeanDeg,
    stanceWidth,
    stridePosture,
    balance,
    confidencePct,
  };
}
