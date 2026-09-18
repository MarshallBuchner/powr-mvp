"use client";

import { useEffect, useState } from "react";

export type ProcessingStageId = "upload" | "analyze" | "report";

const STAGES: { id: ProcessingStageId; label: string }[] = [
  { id: "upload", label: "Uploading video" },
  { id: "analyze", label: "Analyzing skating" },
  { id: "report", label: "Building your report" },
];

type AnalysisProcessingPanelProps = {
  stage: ProcessingStageId;
  fileName?: string;
};

export default function AnalysisProcessingPanel({
  stage,
  fileName,
}: AnalysisProcessingPanelProps) {
  const activeIndex = Math.max(
    0,
    STAGES.findIndex((item) => item.id === stage),
  );

  return (
    <div className="analysis-processing" role="status" aria-live="polite">
      <div className="analysis-processing-heading">
        <p className="eyebrow">POWR ANALYSIS</p>
        <strong>{STAGES[activeIndex]?.label ?? "Analyzing skating"}</strong>
        <p>This usually takes about 30–45 seconds.</p>
        <p className="analysis-processing-keep-open">
          Keep this page open while we finish your assessment.
        </p>
        {fileName ? (
          <span className="analysis-processing-file">{fileName}</span>
        ) : null}
      </div>

      <div
        className="analysis-processing-bar"
        role="progressbar"
        aria-label="Analysis in progress"
        aria-valuetext="In progress"
      >
        <span className="analysis-processing-bar-fill" />
      </div>

      <ol className="analysis-processing-stages">
        {STAGES.map((item, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={item.id}
              className={
                done ? "is-done" : active ? "is-active" : "is-pending"
              }
            >
              <span className="analysis-processing-marker" aria-hidden="true">
                {done ? "✓" : active ? "●" : "○"}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Time-based stage hints while waiting on real work (not a fake %). */
export function useProcessingStage(
  isActive: boolean,
  override?: ProcessingStageId | null,
): ProcessingStageId {
  const [stage, setStage] = useState<ProcessingStageId>("upload");

  useEffect(() => {
    if (!isActive) {
      setStage("upload");
      return;
    }

    if (override) {
      setStage(override);
      return;
    }

    setStage("upload");
    const toAnalyze = window.setTimeout(() => setStage("analyze"), 2500);
    const toReport = window.setTimeout(() => setStage("report"), 22000);

    return () => {
      window.clearTimeout(toAnalyze);
      window.clearTimeout(toReport);
    };
  }, [isActive, override]);

  return override ?? stage;
}
