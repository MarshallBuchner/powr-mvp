import type { AnalysisRequest } from "./types";

export const LAST_REPORT_SESSION_KEY = "powr_last_report_v1";

/**
 * Persist the latest analysis for /r/view fallback.
 * Must never throw — Safari QuotaExceededError after large evidence frames
 * previously aborted report navigation after credits were already consumed.
 */
export function stashLastReport(request: AnalysisRequest): boolean {
  if (typeof window === "undefined" || !request.analysis) return false;
  const payload = {
    goal: request.goal,
    fileName: request.fileName,
    duration: request.duration,
    analysis: request.analysis,
    // Never persist evidence data URLs here — they blow Safari sessionStorage.
    evidenceMoments: request.evidenceMoments?.map(({ timeLabel, caption }) => ({
      timeLabel,
      caption,
    })),
  };
  try {
    sessionStorage.setItem(LAST_REPORT_SESSION_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    // Retry once without evidence metadata if quota is tight.
    try {
      sessionStorage.setItem(
        LAST_REPORT_SESSION_KEY,
        JSON.stringify({
          goal: payload.goal,
          fileName: payload.fileName,
          duration: payload.duration,
          analysis: payload.analysis,
        }),
      );
      return true;
    } catch {
      console.warn(
        "[POWR:report] stashLastReport failed",
        error instanceof Error ? error.name : "unknown",
      );
      return false;
    }
  }
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
