"use client";

import { ChevronRight } from "lucide-react";

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

  return (
    <div className="rv2-category-bar">
      <div className="rv2-category-meta">
        <span className="rv2-category-name">
          <em aria-hidden="true">{icon}</em>
          {name}
        </span>
        <strong>
          {clamped}
          <ChevronRight size={16} aria-hidden="true" />
        </strong>
      </div>
      <div className="rv2-category-track" aria-hidden="true">
        <div className="rv2-category-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
