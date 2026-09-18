"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import type { ReportV2Drill } from "./mockReportData";

type DrillCardProps = {
  drill: ReportV2Drill;
  onOpen?: (drill: ReportV2Drill) => void;
};

export default function DrillCard({ drill, onOpen }: DrillCardProps) {
  return (
    <article className="rv2-drill-card">
      <button
        type="button"
        className="rv2-drill-thumb"
        style={{ backgroundImage: `url(${drill.image})` }}
        aria-label={`Preview ${drill.title}`}
        onClick={() => onOpen?.(drill)}
      >
        <span>
          <Play size={16} />
        </span>
      </button>
      <div className="rv2-drill-body">
        <div className="rv2-drill-tags">
          <em>{drill.category.toUpperCase()}</em>
          <em>{drill.duration}</em>
          <em>{drill.difficulty.toUpperCase()}</em>
        </div>
        <h3>{drill.title}</h3>
        <p>{drill.description}</p>
      </div>
    </article>
  );
}

type DrillMediaLightboxProps = {
  drill: ReportV2Drill | null;
  onClose: () => void;
};

export function DrillMediaLightbox({ drill, onClose }: DrillMediaLightboxProps) {
  if (!drill) return null;

  return (
    <div className="rv2-lightbox" role="dialog" aria-modal="true" aria-label={drill.title}>
      <button type="button" className="rv2-lightbox-backdrop" onClick={onClose} aria-label="Close" />
      <div className="rv2-lightbox-card">
        <button type="button" className="rv2-lightbox-close" onClick={onClose} aria-label="Close preview">
          <X size={18} />
        </button>
        <div
          className="rv2-lightbox-media"
          style={{ backgroundImage: `url(${drill.image})` }}
        >
          <span className="rv2-play is-lg">
            <Play size={22} />
          </span>
        </div>
        <div className="rv2-lightbox-copy">
          <div className="rv2-drill-tags">
            <em>{drill.category.toUpperCase()}</em>
            <em>{drill.duration}</em>
            <em>{drill.difficulty.toUpperCase()}</em>
          </div>
          <h3>{drill.title}</h3>
          <p>{drill.description}</p>
          <p className="rv2-video-note">Demo photo — swap for drill video when library is ready.</p>
        </div>
      </div>
    </div>
  );
}

export function useDrillLightbox() {
  const [active, setActive] = useState<ReportV2Drill | null>(null);
  return {
    active,
    open: setActive,
    close: () => setActive(null),
  };
}
