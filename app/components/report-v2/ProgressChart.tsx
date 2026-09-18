"use client";

import { useMemo, useState } from "react";
import type { ReportV2ProgressPoint } from "./mockReportData";

type ProgressChartProps = {
  points: ReportV2ProgressPoint[];
};

const RANGES = [
  { id: "4", label: "4 Weeks", take: 2 },
  { id: "8", label: "8 Weeks", take: 3 },
  { id: "12", label: "12 Weeks", take: 4 },
] as const;

export default function ProgressChart({ points }: ProgressChartProps) {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("8");

  const visible = useMemo(() => {
    if (!points.length) return [];
    const take = RANGES.find((r) => r.id === range)?.take ?? points.length;
    return points.slice(Math.max(0, points.length - take));
  }, [points, range]);

  if (!points.length) return null;

  const width = 320;
  const height = 160;
  const padX = 18;
  const padY = 22;
  const scores = visible.map((p) => p.score);
  const min = 0;
  const max = 100;
  const rangeScore = max - min;

  const coords = visible.map((point, index) => {
    const x =
      padX +
      (visible.length === 1
        ? (width - padX * 2) / 2
        : (index / (visible.length - 1)) * (width - padX * 2));
    const y =
      height - padY - ((point.score - min) / rangeScore) * (height - padY * 2);
    return { x, y, ...point };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const area =
    coords.length > 1
      ? `${path} L ${coords[coords.length - 1].x} ${height - padY} L ${coords[0].x} ${height - padY} Z`
      : "";

  return (
    <div className="rv2-progress-chart">
      {points.length > 1 ? (
        <div className="rv2-range-tabs" role="tablist" aria-label="Progress range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={range === r.id}
              className={range === r.id ? "is-active" : undefined}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="rv2-video-note" style={{ marginBottom: 10 }}>
          First assessment on record — reassess to build your trend line.
        </p>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Progress chart">
        {[25, 50, 75].map((tick) => {
          const y = height - padY - ((tick - min) / rangeScore) * (height - padY * 2);
          return (
            <line
              key={tick}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              className="rv2-progress-grid"
            />
          );
        })}
        {area ? <path d={area} className="rv2-progress-area" /> : null}
        {coords.length > 1 ? (
          <path d={path} className="rv2-progress-line" />
        ) : null}
        {coords.map((c) => (
          <g key={c.label}>
            <circle cx={c.x} cy={c.y} r="6" className="rv2-progress-dot" />
            <text x={c.x} y={c.y - 12} className="rv2-progress-score" textAnchor="middle">
              {c.score}
            </text>
          </g>
        ))}
      </svg>
      <div className="rv2-progress-labels">
        {visible.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
