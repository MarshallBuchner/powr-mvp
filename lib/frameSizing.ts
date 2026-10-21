/**
 * Memory-safe frame sizing for /api/analyze stills (iPhone Safari jetsam fix).
 *
 * Full-resolution iPhone clips (4K = 2160x3840) made each extraction canvas
 * ~33MB RGBA plus a 33MB getImageData copy per frame, and produced multi-MB
 * base64 JPEGs that were duplicated into the JSON request body.
 *
 * Coaching tradeoff: the server sends frames with detail:"high"; OpenAI
 * downsizes high-detail images so the short side is <=768px and tiles at 512px.
 * A 960px long edge (540x960 portrait) keeps the whole skater well above the
 * tile granularity, so posture/knee-bend/stride cues remain visible while
 * cutting pixels ~16x versus 4K. Per-frame dims are reported in telemetry so
 * the tradeoff can be audited.
 */
export const FRAME_MAX_LONG_EDGE = 960;
export const FRAME_JPEG_QUALITY = 0.75;
/** Brightness/contrast check runs on a tiny canvas (short edge 160px). */
export const QUALITY_SAMPLE_SHORT_EDGE = 160;

export type Size = { width: number; height: number };

function even(n: number) {
  const v = Math.max(2, Math.round(n));
  return v % 2 === 0 ? v : v - 1;
}

/** Scale (never upscale) so the long edge is <= maxLongEdge. */
export function scaledFrameSize(
  width: number,
  height: number,
  maxLongEdge = FRAME_MAX_LONG_EDGE,
): Size {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const long = Math.max(width, height);
  const scale = long > maxLongEdge ? maxLongEdge / long : 1;
  return { width: even(width * scale), height: even(height * scale) };
}

/** Tiny sample for luma checks; keeps >=160x120 so frameQuality still applies. */
export function qualitySampleSize(width: number, height: number): Size {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const short = Math.min(width, height);
  const scale = short > QUALITY_SAMPLE_SHORT_EDGE ? QUALITY_SAMPLE_SHORT_EDGE / short : 1;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Release a canvas backing store immediately (Safari keeps it until GC otherwise). */
export function releaseCanvas(canvas: { width: number; height: number } | null | undefined) {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}

/** Approximate decoded bytes of a base64 data URL (telemetry only). */
export function dataUrlBytes(dataUrl: string | null | undefined): number {
  if (!dataUrl) return 0;
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.length - comma - 1 : dataUrl.length;
  return Math.floor((b64 * 3) / 4);
}
