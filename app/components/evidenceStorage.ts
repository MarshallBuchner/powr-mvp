import type { AnalysisEvidenceMoment } from "./types";

const EVIDENCE_STORAGE_KEY = "powr_evidence_frames_v1";

export function stashEvidenceFrames(moments: AnalysisEvidenceMoment[]) {
  try {
    const payload = moments
      .filter((m) => m.dataUrl)
      .map(({ timeLabel, caption, dataUrl }) => ({
        timeLabel,
        caption,
        dataUrl,
      }));
    sessionStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function readStashedEvidenceFrames(): AnalysisEvidenceMoment[] {
  try {
    const raw = sessionStorage.getItem(EVIDENCE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalysisEvidenceMoment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
