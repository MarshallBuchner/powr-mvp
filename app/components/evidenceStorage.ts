import type { AnalysisEvidenceMoment } from "./types";

const EVIDENCE_STORAGE_KEY = "powr_evidence_frames_v1";

/**
 * Persist lightweight evidence captions only.
 * Never store JPEG/base64 data URLs — that exhausted Safari sessionStorage and
 * broke report navigation after a billed assessment (PR #30 root cause).
 */
export function stashEvidenceFrames(moments: AnalysisEvidenceMoment[]) {
  try {
    const payload = moments.map(({ timeLabel, caption }) => ({
      timeLabel,
      caption,
    }));
    sessionStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private mode failures — report handoff must continue.
  }
}

export function readStashedEvidenceFrames(): AnalysisEvidenceMoment[] {
  try {
    const raw = sessionStorage.getItem(EVIDENCE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalysisEvidenceMoment[];
    if (!Array.isArray(parsed)) return [];
    // Strip any legacy dataUrl fields from older clients.
    return parsed.map(({ timeLabel, caption }) => ({
      timeLabel,
      caption,
    }));
  } catch {
    return [];
  }
}

/** True when a candidate stash payload would embed large image data. */
export function evidencePayloadContainsDataUrls(
  moments: Array<{ dataUrl?: string | null }>,
): boolean {
  return moments.some(
    (m) => typeof m.dataUrl === "string" && m.dataUrl.startsWith("data:"),
  );
}
