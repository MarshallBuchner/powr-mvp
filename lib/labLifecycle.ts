/**
 * Client lifecycle marker for the live Analysis Lab (no PII, no frames/video).
 *
 * Written at each stage so that, if iOS kills the WebContent process and Safari
 * reloads the homepage, the next boot can (a) report what stage we died in and
 * (b) offer the already-completed report or an idempotent replay lookup.
 */
export const LIFECYCLE_KEY = "powr_lab_lifecycle_v1";
export const DEVICE_KEY = "powr_device_key_v1";
export const COMPLETED_RECOVERY_MS = 30 * 24 * 60 * 60 * 1000;
export const INTERRUPTED_RECOVERY_MS = 15 * 60 * 1000;

export type LabStage =
  | "started"
  | "frames_extracted"
  | "analyze_sent"
  | "analyze_200"
  | "analyze_error"
  | "share_ready"
  | "navigate"
  | "report_opened";

export type LabLifecycleMarker = {
  attemptId: string;
  stage: LabStage;
  t: number;
  startedAt: number;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  payloadBytes?: number;
  sharePath?: string;
};

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHARE_PATH_RE = /^\/r\/(?:s\/[a-f0-9]{32,96}|view)$/i;

export function isValidAttemptId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isSafeSharePath(value: unknown): value is string {
  return typeof value === "string" && SHARE_PATH_RE.test(value);
}

export function newAttemptId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function storage(store?: KV | null): KV | null {
  if (store) return store;
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function readLifecycle(store?: KV | null): LabLifecycleMarker | null {
  const s = storage(store);
  if (!s) return null;
  try {
    const raw = s.getItem(LIFECYCLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LabLifecycleMarker;
    if (!isValidAttemptId(parsed?.attemptId) || typeof parsed.t !== "number") return null;
    if (parsed.sharePath && !isSafeSharePath(parsed.sharePath)) delete parsed.sharePath;
    return parsed;
  } catch {
    return null;
  }
}

/** Merge-write a stage. Never throws (quota / private mode). */
export function writeLifecycle(
  attemptId: string,
  stage: LabStage,
  extra: Partial<Omit<LabLifecycleMarker, "attemptId" | "stage" | "t">> = {},
  store?: KV | null,
  now = Date.now(),
): LabLifecycleMarker | null {
  const s = storage(store);
  if (!s || !isValidAttemptId(attemptId)) return null;
  const prev = readLifecycle(s);
  const base = prev && prev.attemptId === attemptId ? prev : null;
  const next: LabLifecycleMarker = {
    ...(base ?? {}),
    ...extra,
    attemptId,
    stage,
    t: now,
    startedAt: base?.startedAt ?? now,
  };
  if (next.sharePath && !isSafeSharePath(next.sharePath)) delete next.sharePath;
  try {
    s.setItem(LIFECYCLE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}

export function clearLifecycle(store?: KV | null) {
  try {
    storage(store)?.removeItem(LIFECYCLE_KEY);
  } catch {
    /* ignore */
  }
}

export type RecoveryState =
  | { kind: "none" }
  | { kind: "completed"; sharePath: string; attemptId: string }
  | { kind: "interrupted"; attemptId: string; stage: LabStage };

/** What the homepage should offer on boot. */
export function getRecoveryState(
  marker: LabLifecycleMarker | null,
  now = Date.now(),
): RecoveryState {
  if (!marker) return { kind: "none" };
  const age = now - marker.t;
  if (age < 0) return { kind: "none" };
  if (marker.stage === "report_opened") return { kind: "none" };
  if (marker.sharePath && age <= COMPLETED_RECOVERY_MS) {
    return { kind: "completed", sharePath: marker.sharePath, attemptId: marker.attemptId };
  }
  if (
    (marker.stage === "analyze_sent" || marker.stage === "analyze_200" || marker.stage === "analyze_error") &&
    age <= INTERRUPTED_RECOVERY_MS
  ) {
    return { kind: "interrupted", attemptId: marker.attemptId, stage: marker.stage };
  }
  return { kind: "none" };
}

/** Random per-device key (not PII). The server stores only a hash of it. */
export function getOrCreateDeviceKey(store?: KV | null): string {
  const s = storage(store);
  try {
    const existing = s?.getItem(DEVICE_KEY);
    if (existing && isValidAttemptId(existing)) return existing;
    const created = newAttemptId();
    s?.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return newAttemptId();
  }
}

export function readNavigationType(): string {
  try {
    const entry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    return entry?.type ?? "unknown";
  } catch {
    return "unknown";
  }
}
