export const PENDING_ASSESSMENT_KEY = "powr_pending_assessment_v1";

export type PendingAssessmentPayload = {
  goal: string;
  fileName: string;
  duration: number | null;
  analysis: unknown;
};

export function stashPendingAssessment(payload: PendingAssessmentPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_ASSESSMENT_KEY, JSON.stringify(payload));
}
