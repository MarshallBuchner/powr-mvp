/**
 * Frame usability checks for skating analysis.
 * Reject blank / tiny / near-black samples before scoring or billing.
 */

export const MIN_FRAME_WIDTH = 160;
export const MIN_FRAME_HEIGHT = 120;
export const MIN_MEAN_LUMA = 12;
export const MIN_LUMA_STDDEV = 6;
export const MIN_DATA_URL_CHARS = 800;

export type FrameQualityIssue =
  | "missing"
  | "invalid_data_url"
  | "too_small"
  | "too_dark"
  | "too_flat"
  | "decode_failed";

export type FrameQualityResult = {
  usable: boolean;
  issues: FrameQualityIssue[];
  width: number;
  height: number;
  meanLuma: number;
  lumaStdDev: number;
  byteLengthEstimate: number;
};

function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}

/** Fast structural checks that work in Node and the browser (no decode). */
export function inspectFrameDataUrl(dataUrl: string | null | undefined): FrameQualityResult {
  const empty: FrameQualityResult = {
    usable: false,
    issues: ["missing"],
    width: 0,
    height: 0,
    meanLuma: 0,
    lumaStdDev: 0,
    byteLengthEstimate: 0,
  };

  if (!dataUrl || typeof dataUrl !== "string") return empty;

  const issues: FrameQualityIssue[] = [];
  if (!dataUrl.startsWith("data:image/")) {
    issues.push("invalid_data_url");
  }
  if (dataUrl.length < MIN_DATA_URL_CHARS) {
    issues.push("too_small");
  }

  const byteLengthEstimate = dataUrlByteLength(dataUrl);
  // Tiny JPEG payloads are almost always blank or corrupted samples.
  if (byteLengthEstimate > 0 && byteLengthEstimate < 1200) {
    if (!issues.includes("too_small")) issues.push("too_small");
  }

  return {
    usable: issues.length === 0,
    issues,
    width: 0,
    height: 0,
    meanLuma: 0,
    lumaStdDev: 0,
    byteLengthEstimate,
  };
}

export function analyzeImageData(image: {
  width: number;
  height: number;
  data: ArrayLike<number>;
}): FrameQualityResult {
  const issues: FrameQualityIssue[] = [];
  const { width, height, data } = image;

  if (width < MIN_FRAME_WIDTH || height < MIN_FRAME_HEIGHT) {
    issues.push("too_small");
  }

  let sum = 0;
  let sumSq = 0;
  let samples = 0;
  // Sample every Nth pixel for speed on large frames.
  const step = Math.max(1, Math.floor((width * height) / 8000));
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += luma;
    sumSq += luma * luma;
    samples += 1;
  }

  const meanLuma = samples ? sum / samples : 0;
  const variance = samples ? sumSq / samples - meanLuma * meanLuma : 0;
  const lumaStdDev = Math.sqrt(Math.max(0, variance));

  if (meanLuma < MIN_MEAN_LUMA) issues.push("too_dark");
  if (lumaStdDev < MIN_LUMA_STDDEV) issues.push("too_flat");

  return {
    usable: issues.length === 0,
    issues,
    width,
    height,
    meanLuma,
    lumaStdDev,
    byteLengthEstimate: data.length,
  };
}

export function summarizeFrameBatch(
  results: FrameQualityResult[],
): { usable: boolean; usableCount: number; issues: FrameQualityIssue[] } {
  const usableCount = results.filter((r) => r.usable).length;
  const need = Math.max(1, Math.ceil(results.length * 0.6));
  const issues = Array.from(new Set(results.flatMap((r) => r.issues)));
  return {
    usable: results.length > 0 && usableCount >= need,
    usableCount,
    issues,
  };
}

export function insufficientVideoQualityMessage(issues: FrameQualityIssue[]): string {
  if (issues.includes("too_dark") || issues.includes("too_flat")) {
    return "POWR could not read a clear skating clip from this upload (frames looked blank or too dark). Try a brighter side-view clip with your full body visible.";
  }
  if (issues.includes("too_small") || issues.includes("decode_failed")) {
    return "POWR could not decode usable video frames from this upload. Try another clip (10–30s, full body visible) from a different angle.";
  }
  return "This clip does not have enough visible skating evidence for a reliable assessment. Record a clearer side-view clip with your full body in frame.";
}
