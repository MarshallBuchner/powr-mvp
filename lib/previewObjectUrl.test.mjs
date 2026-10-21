import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONNECTION_LOST_MESSAGE,
  createPreviewUrlOwner,
  isNetworkFetchError,
  releaseAnalysisVideoUrl,
} from "./previewObjectUrl.ts";

function fakeApi() {
  let n = 0;
  const revoked = [];
  return {
    revoked,
    create: () => `blob:https://x/${++n}`,
    revoke: (u) => revoked.push(u),
  };
}

test("upload card unmount after handoff does NOT revoke the lab video URL", () => {
  const api = fakeApi();
  const owner = createPreviewUrlOwner(api);
  const url = owner.select({});
  owner.handoff(url); // onAnalyze -> AnalysisScreen/PoseVideoPlayer
  owner.dispose(); // Home unmounts UploadCard when the lab opens
  assert.deepEqual(api.revoked, []);
});

test("unmount without handoff revokes the preview URL", () => {
  const api = fakeApi();
  const owner = createPreviewUrlOwner(api);
  const url = owner.select({});
  owner.dispose();
  assert.deepEqual(api.revoked, [url]);
});

test("selecting a different file revokes the previous preview", () => {
  const api = fakeApi();
  const owner = createPreviewUrlOwner(api);
  const a = owner.select({});
  const b = owner.select({});
  assert.notEqual(a, b);
  assert.deepEqual(api.revoked, [a]);
  owner.select(null);
  assert.deepEqual(api.revoked, [a, b]);
});

test("page-level release revokes handed-off blob URLs only", () => {
  const api = fakeApi();
  releaseAnalysisVideoUrl("blob:https://x/9", api);
  releaseAnalysisVideoUrl("/sample.mp4", api);
  releaseAnalysisVideoUrl(undefined, api);
  assert.deepEqual(api.revoked, ["blob:https://x/9"]);
});

test("Safari 'Load failed' is classified as a network error", () => {
  assert.equal(isNetworkFetchError(new TypeError("Load failed")), true);
  assert.equal(isNetworkFetchError(new TypeError("Failed to fetch")), true);
  assert.equal(isNetworkFetchError(new Error("Load failed")), false);
  assert.equal(isNetworkFetchError(new TypeError("x is undefined")), false);
  assert.equal(CONNECTION_LOST_MESSAGE.includes("Load failed"), false);
});
