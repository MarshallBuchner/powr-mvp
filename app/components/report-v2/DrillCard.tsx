"use client";

import type { ReportV2Drill } from "./mockReportData";

type DrillCardProps = {
  drill: ReportV2Drill;
};

export default function DrillCard({ drill }: DrillCardProps) {
  return (
    <article className="rv2-drill-card">
      <div className="rv2-drill-thumb" aria-hidden="true">
        <span>▶</span>
      </div>
      <div className="rv2-drill-body">
        <div className="rv2-drill-tags">
          <em>{drill.category}</em>
          <em>{drill.duration}</em>
          <em>{drill.difficulty}</em>
        </div>
        <h3>{drill.title}</h3>
        <p>{drill.description}</p>
      </div>
    </article>
  );
}
