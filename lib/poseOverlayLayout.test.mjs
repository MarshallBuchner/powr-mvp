import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import ts from "typescript";
import vm from "node:vm";

function loadPoseDrawing() {
  const source = fs.readFileSync("app/components/prototype/poseDrawing.ts", "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  const exports = {};
  const fakeLandmarker = { POSE_CONNECTIONS: [] };
  const fakeRequire = (name) => {
    if (name === "@mediapipe/tasks-vision") {
      return { PoseLandmarker: fakeLandmarker };
    }
    throw new Error(`Unexpected require: ${name}`);
  };
  vm.runInNewContext(
    outputText,
    {
      exports,
      require: fakeRequire,
      console,
    },
    { filename: "poseDrawing.ts" },
  );
  return exports;
}

test("videoContentRect centers letterboxed content when box is wider than video", () => {
  const { videoContentRect } = loadPoseDrawing();
  const rect = videoContentRect({
    videoWidth: 1080,
    videoHeight: 1920,
    clientWidth: 390,
    clientHeight: 400,
  });
  // Portrait video in a taller/wider clamp → width-limited or height-limited.
  assert.ok(rect.width > 0 && rect.height > 0);
  assert.ok(rect.x >= 0 && rect.y >= 0);
  assert.ok(rect.width <= 390 + 0.01);
  assert.ok(rect.height <= 400 + 0.01);
  // Aspect preserved
  assert.ok(Math.abs(rect.width / rect.height - 1080 / 1920) < 0.02);
});

test("videoContentRect fills the box when aspects match", () => {
  const { videoContentRect } = loadPoseDrawing();
  const rect = videoContentRect({
    videoWidth: 1920,
    videoHeight: 1080,
    clientWidth: 640,
    clientHeight: 360,
  });
  assert.equal(rect.x, 0);
  assert.equal(rect.y, 0);
  assert.equal(rect.width, 640);
  assert.equal(rect.height, 360);
});
