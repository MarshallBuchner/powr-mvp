import { sampleAnalysis } from "./sampleAnalysis";
import type { AnalysisRequest, RealAnalysis } from "./types";

export const SAMPLE_FILE_NAME = "POWR Sample Skating Assessment";
export const SAMPLE_SHARE_PATH = "/r/sample";

type LiveSharePayload = {
  v: 1;
  goal: string;
  fileName: string;
  duration: number | null;
  analysis: RealAnalysis;
};

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

export function getSharePath(request: AnalysisRequest) {
  if (isSampleReport(request)) {
    return SAMPLE_SHARE_PATH;
  }

  if (!request.analysis) {
    return "/";
  }

  const payload: LiveSharePayload = {
    v: 1,
    goal: request.goal,
    fileName: request.fileName,
    duration: request.duration,
    analysis: request.analysis,
  };

  return `/r?d=${toBase64Url(JSON.stringify(payload))}`;
}

export function decodeLiveSharePayload(
  encoded: string,
): AnalysisRequest | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as LiveSharePayload;

    if (parsed.v !== 1 || !parsed.analysis || !parsed.goal) {
      return null;
    }

    return {
      fileName: parsed.fileName || "Skating assessment",
      videoUrl: "",
      goal: parsed.goal,
      duration: parsed.duration ?? null,
      analysis: parsed.analysis,
    };
  } catch {
    return null;
  }
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "==".slice(0, (4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
