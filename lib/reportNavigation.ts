/**
 * Report handoff helpers: persist analysis before navigation and recover when
 * share-link creation or routing fails — without re-running /api/analyze.
 */

import type { AnalysisRequest } from "@/app/components/types";

export type ReportHandoffResult =
  | { ok: true; path: string; mode: string }
  | { ok: false; error: string; path?: string };

/** Privacy-conscious client diagnostics (no frames, emails, or raw analysis). */
export function logReportHandoff(
  event: string,
  detail?: Record<string, unknown>,
): void {
  if (typeof console === "undefined") return;
  try {
    console.info(`[POWR:report] ${event}`, detail ?? {});
  } catch {
    // never break handoff
  }
}

export function summarizeAnalyzeFailure(input: {
  status?: number;
  error?: unknown;
  message?: unknown;
}): string {
  if (input.status === 402) {
    return typeof input.message === "string" && input.message.trim()
      ? input.message
      : "You've used your free assessment. Unlock a pack to continue.";
  }
  if (input.status === 422) {
    return typeof input.message === "string" && input.message.trim()
      ? input.message
      : "This clip does not have enough visible skating evidence for a reliable assessment.";
  }
  if (input.status === 503) {
    return "Analysis is temporarily unavailable. Please try again in a moment.";
  }
  if (typeof input.message === "string" && input.message.trim()) {
    return input.message;
  }
  if (typeof input.error === "string" && input.error.trim()) {
    return input.error;
  }
  return "POWR couldn't finish this assessment. Please try again.";
}

/**
 * Parse /api/analyze JSON without throwing on empty/HTML error bodies
 * (common when a proxy times out on iPhone Safari).
 */
export async function readAnalyzeResponse(response: Response): Promise<{
  ok: boolean;
  status: number;
  body: Record<string, unknown> | null;
  parseError: boolean;
}> {
  const status = response.status;
  let body: Record<string, unknown> | null = null;
  let parseError = false;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    parseError = true;
  }
  return {
    ok: response.ok && Boolean(body && body.success === true),
    status,
    body,
    parseError,
  };
}

export function canRetryReportNavigation(input: {
  analysisReady: boolean;
  navigationError: boolean;
}): boolean {
  return input.analysisReady && input.navigationError;
}

/** True when we must not start another billed /api/analyze. */
export function shouldBlockDuplicateAnalyze(input: {
  analyzeStarted: boolean;
  analysisReady: boolean;
}): boolean {
  return input.analyzeStarted || input.analysisReady;
}

export function reportRequestHasAnalysis(
  request: Pick<AnalysisRequest, "analysis"> | null | undefined,
): boolean {
  return Boolean(request?.analysis && typeof request.analysis === "object");
}
