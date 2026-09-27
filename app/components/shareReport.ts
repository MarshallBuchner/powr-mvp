import { sampleAnalysis } from "./sampleAnalysis";
import type { AnalysisRequest, RealAnalysis } from "./types";

export const SAMPLE_FILE_NAME = "POWR Sample Skating Assessment";
export const SAMPLE_SHARE_PATH = "/r/sample";

export function isSampleReport(
  request: Pick<AnalysisRequest, "fileName">,
) {
  return request.fileName === SAMPLE_FILE_NAME;
}

export function createSampleRequest(): AnalysisRequest {
  return {
    fileName: SAMPLE_FILE_NAME,
    videoUrl: "/sample-skating.mp4",
    goal: "Acceleration",
    duration: 13,
    analysis: sampleAnalysis,
  };
}

/** Preferred public path for a report (sample / saved private / token share). */
export function getSharePath(
  request: AnalysisRequest,
  options?: { savedId?: string; shareToken?: string },
) {
  if (isSampleReport(request)) {
    return SAMPLE_SHARE_PATH;
  }

  if (options?.shareToken) {
    return `/r/s/${options.shareToken}`;
  }

  // Saved assessments are private — owners open via authenticated /r/[id].
  if (options?.savedId) {
    return `/r/${options.savedId}`;
  }

  return "/r/view";
}

export type CreateShareResult = {
  path: string;
  token?: string;
  expiresAt?: string | null;
  mode: "token" | "session" | "sample" | "saved";
};

/**
 * Create a tokenized share (preferred) or fall back to session-only /r/view.
 * Never embeds analysis JSON in the URL.
 */
export async function createReportSharePath(
  request: AnalysisRequest,
  options?: { savedId?: string },
): Promise<CreateShareResult> {
  if (isSampleReport(request)) {
    return { path: SAMPLE_SHARE_PATH, mode: "sample" };
  }

  if (!request.analysis) {
    return { path: "/", mode: "session" };
  }

  try {
    const res = await fetch("/api/reports/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: request.goal,
        fileName: request.fileName,
        duration: request.duration,
        analysis: request.analysis as RealAnalysis,
        assessmentId: options?.savedId ?? null,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        token: string;
        path: string;
        expiresAt?: string | null;
      };
      return {
        path: data.path,
        token: data.token,
        expiresAt: data.expiresAt,
        mode: "token",
      };
    }
  } catch (error) {
    console.error("POWR createReportSharePath failed", error);
  }

  // Dev/local fallback — never put analysis in the query string.
  const { stashLastReport } = await import("./reportSession");
  stashLastReport(request);
  return { path: "/r/view", mode: "session" };
}

/** @deprecated Legacy URL payloads are no longer created. Kept for inbound old links. */
export function decodeLiveSharePayload(
  encoded: string,
): AnalysisRequest | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as {
      v?: number;
      goal?: string;
      fileName?: string;
      duration?: number | null;
      analysis?: RealAnalysis;
      evidenceMoments?: { timeLabel: string; caption: string }[];
    };

    if (parsed.v !== 1 || !parsed.analysis || !parsed.goal) {
      return null;
    }

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

function fromBase64Url(value: string) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "==".slice(0, (4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
