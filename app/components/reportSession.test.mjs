import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LAST_REPORT_SESSION_KEY,
  readLastReport,
  stashLastReport,
} from "./reportSession.ts";

function installMemorySessionStorage(options = {}) {
  const { failOnSet = false, failAlways = false, maxChars = Infinity } = options;
  const map = new Map();
  let sets = 0;
  const store = {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      sets += 1;
      if (failAlways || (failOnSet && sets === 1)) {
        const err = new Error("The quota has been exceeded.");
        err.name = "QuotaExceededError";
        throw err;
      }
      if (String(value).length > maxChars) {
        const err = new Error("The quota has been exceeded.");
        err.name = "QuotaExceededError";
        throw err;
      }
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
  globalThis.window = { sessionStorage: store };
  globalThis.sessionStorage = store;
  return { map, get sets() { return sets; } };
}

const sampleRequest = {
  fileName: "clip.mp4",
  videoUrl: "blob:test",
  goal: "Acceleration",
  duration: 12,
  analysis: {
    overallScore: 72,
    summary: "Solid base",
    strengths: ["Balance"],
    priorityImprovement: "Knee bend",
    whyItMatters: "Power",
    movementMetrics: [],
    drills: [],
    confidence: { score: 70, label: "Moderate", reason: "Clear view" },
  },
  evidenceMoments: [
    {
      timeLabel: "0:05",
      caption: "Primary moment",
      dataUrl: `data:image/jpeg;base64,${"A".repeat(5000)}`,
    },
  ],
};

test("stashLastReport never throws on QuotaExceededError", () => {
  installMemorySessionStorage({ failAlways: true });
  assert.equal(stashLastReport(sampleRequest), false);
  assert.equal(readLastReport(), null);
});

test("stashLastReport retries without evidence metadata after quota pressure", () => {
  // First write (with evidence captions) fails; lean retry succeeds.
  const mem = installMemorySessionStorage({ failOnSet: true });
  assert.equal(stashLastReport(sampleRequest), true);
  assert.ok(mem.sets >= 2);
  const stored = JSON.parse(mem.map.get(LAST_REPORT_SESSION_KEY));
  assert.equal(stored.goal, "Acceleration");
  assert.equal(stored.analysis.overallScore, 72);
  assert.equal("evidenceMoments" in stored, false);
});

test("stashLastReport never persists evidence JPEG data URLs", () => {
  const mem = installMemorySessionStorage();
  assert.equal(stashLastReport(sampleRequest), true);
  const raw = mem.map.get(LAST_REPORT_SESSION_KEY);
  assert.equal(raw.includes("data:image"), false);
  assert.equal(raw.includes("base64"), false);
  const report = readLastReport();
  assert.equal(report.analysis.overallScore, 72);
  assert.ok(
    !report.evidenceMoments?.some((m) => m.dataUrl),
  );
});

test("stashLastReport returns false without window/analysis and does not throw", () => {
  const previous = globalThis.window;
  delete globalThis.window;
  delete globalThis.sessionStorage;
  try {
    assert.equal(stashLastReport(sampleRequest), false);
    assert.equal(
      stashLastReport({ ...sampleRequest, analysis: null }),
      false,
    );
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
