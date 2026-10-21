/** Lab telemetry sanitising + rate limiting (shared by client beacon and /api/telemetry). */
export const TELEMETRY_MAX_BYTES = 2048;
export const TELEMETRY_RATE_LIMIT = 30;
export const TELEMETRY_WINDOW_MS = 60_000;

const EVENTS = new Set([
  "stage",
  "pagehide",
  "visibility_hidden",
  "visibility_visible",
  "pageshow",
  "boot",
  "boot_after_interrupted_lab",
]);
const STAGES = new Set([
  "started", "frames_extracted", "analyze_sent", "analyze_200", "analyze_error",
  "share_ready", "navigate", "report_opened", "none",
]);
const NAV_TYPES = new Set(["navigate", "reload", "back_forward", "prerender", "unknown"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TelemetryEvent = {
  event: string;
  stage: string | null;
  navType: string | null;
  attemptId: string | null;
  frameWidth: number | null;
  frameHeight: number | null;
  frameCount: number | null;
  payloadBytes: number | null;
  persisted: boolean | null;
  sinceStartMs: number | null;
};

function int(v: unknown, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : null;
}

/** Allowlist-only. Anything else (names, emails, frames, URLs) is dropped. */
export function sanitizeTelemetry(input: unknown): TelemetryEvent | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (typeof o.event !== "string" || !EVENTS.has(o.event)) return null;
  return {
    event: o.event,
    stage: typeof o.stage === "string" && STAGES.has(o.stage) ? o.stage : null,
    navType: typeof o.navType === "string" && NAV_TYPES.has(o.navType) ? o.navType : null,
    attemptId: typeof o.attemptId === "string" && UUID_RE.test(o.attemptId) ? o.attemptId : null,
    frameWidth: int(o.frameWidth, 10000),
    frameHeight: int(o.frameHeight, 10000),
    frameCount: int(o.frameCount, 100),
    payloadBytes: int(o.payloadBytes, 200_000_000),
    persisted: typeof o.persisted === "boolean" ? o.persisted : null,
    sinceStartMs: int(o.sinceStartMs, 24 * 3600_000),
  };
}

/** Coarse UA family only — never log the raw UA. */
export function uaFamily(ua: string | null | undefined): string {
  const s = ua || "";
  const ios = /iPhone|iPad|iPod/.test(s);
  if (ios && /CriOS/.test(s)) return "ios-chrome";
  if (ios && /FxiOS/.test(s)) return "ios-firefox";
  if (ios) return "ios-safari";
  if (/Android/.test(s)) return /Chrome/.test(s) ? "android-chrome" : "android-other";
  if (/Edg\//.test(s)) return "desktop-edge";
  if (/Chrome\//.test(s)) return "desktop-chrome";
  if (/Firefox\//.test(s)) return "desktop-firefox";
  if (/Safari\//.test(s)) return "desktop-safari";
  return "other";
}

export function createRateLimiter(limit = TELEMETRY_RATE_LIMIT, windowMs = TELEMETRY_WINDOW_MS) {
  const hits = new Map<string, { n: number; start: number }>();
  return function allow(key: string, now = Date.now()): boolean {
    if (hits.size > 5000) hits.clear();
    const h = hits.get(key);
    if (!h || now - h.start > windowMs) {
      hits.set(key, { n: 1, start: now });
      return true;
    }
    h.n += 1;
    return h.n <= limit;
  };
}
