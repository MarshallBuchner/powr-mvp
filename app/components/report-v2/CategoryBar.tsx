"use client";

import { ChevronRight } from "lucide-react";
import { skillBandLabel } from "./skillBand";

type CategoryBarProps = {
  name: string;
  score: number;
  icon?: string;
};

export default function CategoryBar({
  name,
  score,
  icon = "•",
}: CategoryBarProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const band = skillBandLabel(clamped);

  return (
    <div className="rv2-category-bar">
      <div className="rv2-category-meta">
        <span className="rv2-category-name">
          <em aria-hidden="true">{icon}</em>
          {name}
        </span>
        <strong className="rv2-category-score">
          <span className="rv2-category-band">{band}</span>
          <span>{clamped}</span>
          <ChevronRight size={16} aria-hidden="true" />
        </strong>
      </div>
      <div className="rv2-category-track" aria-hidden="true">
        <div className="rv2-category-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
