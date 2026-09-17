"use client";

import type { ReportV2ProgressPoint } from "./mockReportData";

type ProgressChartProps = {
  points: ReportV2ProgressPoint[];
};

export default function ProgressChart({ points }: ProgressChartProps) {
  if (!points.length) return null;

  const width = 320;
  const height = 140;
  const pad = 16;
  const scores = points.map((p) => p.score);
  const min = Math.min(...scores, 40);
  const max = Math.max(...scores, 100);
  const range = Math.max(max - min, 1);

  const coords = points.map((point, index) => {
    const x =
      pad +
      (points.length === 1
        ? (width - pad * 2) / 2
        : (index / (points.length - 1)) * (width - pad * 2));
    const y = height - pad - ((point.score - min) / range) * (height - pad * 2);
    return { x, y, ...point };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="rv2-progress-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Progress chart">
        <path d={path} className="rv2-progress-line" />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="5" className="rv2-progress-dot" />
        ))}
      </svg>
      <div className="rv2-progress-labels">
        {points.map((p) => (
          <span key={p.label}>
            {p.label}
            <strong>{p.score}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
