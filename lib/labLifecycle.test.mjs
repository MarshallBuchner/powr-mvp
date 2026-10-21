import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COMPLETED_RECOVERY_MS,
  INTERRUPTED_RECOVERY_MS,
  LIFECYCLE_KEY,
  getOrCreateDeviceKey,
  getRecoveryState,
  isValidAttemptId,
  newAttemptId,
  readLifecycle,
  writeLifecycle,
} from "./labLifecycle.ts";

function mem() {
  const m = new Map();
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const ID = "22222222-2222-4222-8222-222222222222";

test("attempt ids are UUID v4", () => {
  const id = newAttemptId();
  assert.equal(isValidAttemptId(id), true);
  assert.equal(isValidAttemptId("nope"), false);
});

test("marker stores only stage/timing/dims — no PII, frames, or file names", () => {
  const s = mem();
  writeLifecycle(ID, "frames_extracted", { frameWidth: 540, frameHeight: 960, frameCount: 5 }, s, 1000);
  writeLifecycle(ID, "analyze_sent", { payloadBytes: 150000 }, s, 2000);
  const raw = s.m.get(LIFECYCLE_KEY);
  assert.doesNotMatch(raw, /data:image|base64|@|\.mov|\.mp4/);
  const m = readLifecycle(s);
  assert.equal(m.stage, "analyze_sent");
  assert.equal(m.frameWidth, 540);
  assert.equal(m.startedAt, 1000);
});

test("recovery banner: completed attempt with share path offers 'Open your last report'", () => {
  const s = mem();
  const m = writeLifecycle(ID, "share_ready", { sharePath: `/r/s/${"a".repeat(48)}` }, s, 1000);
  assert.deepEqual(getRecoveryState(m, 1000 + 60_000), { kind: "completed", sharePath: `/r/s/${"a".repeat(48)}`, attemptId: ID });
  assert.equal(getRecoveryState(m, 1000 + COMPLETED_RECOVERY_MS + 1).kind, "none");
});

test("recovery banner: tab killed while analyze in flight → interrupted (replay lookup)", () => {
  const s = mem();
  const m = writeLifecycle(ID, "analyze_sent", {}, s, 1000);
  assert.equal(getRecoveryState(m, 5000).kind, "interrupted");
  assert.equal(getRecoveryState(m, 1000 + INTERRUPTED_RECOVERY_MS + 1).kind, "none");
  assert.equal(getRecoveryState(writeLifecycle(ID, "frames_extracted", {}, mem(), 1), 2).kind, "none");
});

test("unsafe share paths are never stored or offered", () => {
  const s = mem();
  const m = writeLifecycle(ID, "share_ready", { sharePath: "https://evil.test/x" }, s, 1);
  assert.equal(m.sharePath, undefined);
  assert.equal(getRecoveryState(m, 2).kind, "none");
});

test("quota errors never throw", () => {
  const s = { getItem: () => null, setItem: () => { const e = new Error("q"); e.name = "QuotaExceededError"; throw e; }, removeItem() {} };
  assert.doesNotThrow(() => writeLifecycle(ID, "started", {}, s));
  assert.equal(isValidAttemptId(getOrCreateDeviceKey(s)), true);
});

test("device key is stable per device", () => {
  const s = mem();
  assert.equal(getOrCreateDeviceKey(s), getOrCreateDeviceKey(s));
});
