import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evidencePayloadContainsDataUrls,
  readStashedEvidenceFrames,
  stashEvidenceFrames,
} from "./evidenceStorage.ts";

function installMemorySessionStorage() {
  const map = new Map();
  const store = {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
  globalThis.sessionStorage = store;
  return map;
}

test("stashEvidenceFrames never writes JPEG/base64 data URLs", () => {
  const map = installMemorySessionStorage();
  stashEvidenceFrames([
    {
      timeLabel: "0:04",
      caption: "Stride",
      dataUrl: `data:image/jpeg;base64,${"B".repeat(8000)}`,
    },
  ]);
  const raw = [...map.values()].join("");
  assert.equal(raw.includes("data:image"), false);
  assert.equal(raw.includes("base64"), false);
  const read = readStashedEvidenceFrames();
  assert.equal(read.length, 1);
  assert.equal(read[0].caption, "Stride");
  assert.equal(read[0].dataUrl, undefined);
});

test("stashEvidenceFrames ignores quota errors", () => {
  globalThis.sessionStorage = {
    setItem() {
      const err = new Error("quota");
      err.name = "QuotaExceededError";
      throw err;
    },
    getItem() {
      return null;
    },
  };
  assert.doesNotThrow(() =>
    stashEvidenceFrames([{ timeLabel: "0:01", caption: "x", dataUrl: "data:image/jpeg;base64,xx" }]),
  );
});

test("evidencePayloadContainsDataUrls detects dangerous payloads", () => {
  assert.equal(
    evidencePayloadContainsDataUrls([
      { dataUrl: "data:image/jpeg;base64,abc" },
    ]),
    true,
  );
  assert.equal(evidencePayloadContainsDataUrls([{ dataUrl: null }]), false);
});
