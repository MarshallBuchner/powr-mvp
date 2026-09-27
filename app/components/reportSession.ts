import type { AnalysisRequest } from "./types";

export const LAST_REPORT_SESSION_KEY = "powr_last_report_v1";

/** Fallback when secure share API is unavailable (local/dev). Not for public URLs. */
export function stashLastReport(request: AnalysisRequest) {
  if (typeof window === "undefined" || !request.analysis) return;
  const payload = {
    goal: request.goal,
    fileName: request.fileName,
    duration: request.duration,
    analysis: request.analysis,
    evidenceMoments: request.evidenceMoments?.map(({ timeLabel, caption }) => ({
      timeLabel,
      caption,
    })),
  };
  sessionStorage.setItem(LAST_REPORT_SESSION_KEY, JSON.stringify(payload));
}

export function readLastReport(): AnalysisRequest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_REPORT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      goal?: string;
      fileName?: string;
      duration?: number | null;
      analysis?: AnalysisRequest["analysis"];
      evidenceMoments?: AnalysisRequest["evidenceMoments"];
    };
    if (!parsed.analysis || !parsed.goal) return null;
    return {
      fileName: parsed.fileName || "Skating assessment",
      videoUrl: "",
      goal: parsed.goal,
      duration: parsed.duration ?? null,
      analysis: parsed.analysis,
      evidenceMoments: parsed.evidenceMoments,
    };
  } catch {
    return null;
  }
}
