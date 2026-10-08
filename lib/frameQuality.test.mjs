import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzeImageData,
  inspectFrameDataUrl,
  insufficientVideoQualityMessage,
  summarizeFrameBatch,
} from "./frameQuality.ts";

test("inspectFrameDataUrl rejects missing and tiny payloads", () => {
  assert.equal(inspectFrameDataUrl(null).usable, false);
  assert.equal(inspectFrameDataUrl("not-an-image").usable, false);
  assert.equal(inspectFrameDataUrl("data:image/jpeg;base64,aaa").usable, false);
});

test("inspectFrameDataUrl accepts a plausible JPEG data URL", () => {
  const payload = `data:image/jpeg;base64,${"A".repeat(2000)}`;
  const result = inspectFrameDataUrl(payload);
  assert.equal(result.usable, true);
  assert.ok(result.byteLengthEstimate > 1000);
});

test("analyzeImageData rejects near-black flat frames", () => {
  const width = 200;
  const height = 160;
  const data = new Uint8ClampedArray(width * height * 4);
  // Almost black, almost flat
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 2;
    data[i + 1] = 2;
    data[i + 2] = 2;
    data[i + 3] = 255;
  }
  const result = analyzeImageData({ width, height, data });
  assert.equal(result.usable, false);
  assert.ok(result.issues.includes("too_dark") || result.issues.includes("too_flat"));
});

test("analyzeImageData accepts a varied bright frame", () => {
  const width = 200;
  const height = 160;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    const v = (i / 4) % 255;
    data[i] = v;
    data[i + 1] = 255 - v;
    data[i + 2] = (v * 3) % 255;
    data[i + 3] = 255;
  }
  const result = analyzeImageData({ width, height, data });
  assert.equal(result.usable, true);
});

test("summarizeFrameBatch requires a majority of usable frames", () => {
  const good = {
    usable: true,
    issues: [],
    width: 200,
    height: 160,
    meanLuma: 80,
    lumaStdDev: 40,
    byteLengthEstimate: 5000,
  };
  const bad = { ...good, usable: false, issues: ["too_dark"] };
  assert.equal(summarizeFrameBatch([good, good, bad, good, good]).usable, true);
  assert.equal(summarizeFrameBatch([good, bad, bad, bad, bad]).usable, false);
  assert.match(insufficientVideoQualityMessage(["too_dark"]), /brighter|full body/i);
});
