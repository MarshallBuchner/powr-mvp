import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FRAME_JPEG_QUALITY,
  FRAME_MAX_LONG_EDGE,
  dataUrlBytes,
  qualitySampleSize,
  releaseCanvas,
  scaledFrameSize,
} from "./frameSizing.ts";
import { MIN_FRAME_HEIGHT, MIN_FRAME_WIDTH } from "./frameQuality.ts";

test("4K portrait iPhone frames are capped at 960px long edge", () => {
  assert.deepEqual(scaledFrameSize(2160, 3840), { width: 540, height: 960 });
  assert.deepEqual(scaledFrameSize(3840, 2160), { width: 960, height: 540 });
  assert.deepEqual(scaledFrameSize(1080, 1920), { width: 540, height: 960 });
  assert.equal(FRAME_MAX_LONG_EDGE, 960);
  assert.equal(FRAME_JPEG_QUALITY, 0.75);
});

test("small clips are never upscaled", () => {
  assert.deepEqual(scaledFrameSize(640, 480), { width: 640, height: 480 });
  assert.deepEqual(scaledFrameSize(0, 100), { width: 0, height: 0 });
});

test("RGBA canvas memory drops ~16x for 4K", () => {
  const full = 2160 * 3840 * 4;
  const s = scaledFrameSize(2160, 3840);
  assert.ok(full / (s.width * s.height * 4) >= 15.9);
});

test("quality sample canvas is tiny but still passes the min-size gate", () => {
  const s = qualitySampleSize(540, 960);
  assert.equal(s.width, 160);
  assert.ok(s.height >= MIN_FRAME_HEIGHT && s.width >= MIN_FRAME_WIDTH);
  assert.ok(s.width * s.height * 4 < 200_000);
  const l = qualitySampleSize(960, 540);
  assert.ok(l.width >= MIN_FRAME_WIDTH && l.height >= MIN_FRAME_HEIGHT);
});

test("releaseCanvas frees the backing store", () => {
  const c = { width: 540, height: 960 };
  releaseCanvas(c);
  assert.deepEqual(c, { width: 0, height: 0 });
  assert.doesNotThrow(() => releaseCanvas(null));
});

test("dataUrlBytes estimates decoded size", () => {
  assert.equal(dataUrlBytes("data:image/jpeg;base64,AAAA"), 3);
  assert.equal(dataUrlBytes(""), 0);
});
