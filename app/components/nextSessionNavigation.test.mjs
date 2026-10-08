import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NEXT_SESSION_UPLOAD_HREF,
  navigateToNextSessionUpload,
  resolveNextSessionAction,
} from "./nextSessionNavigation.ts";

test("next session CTA always resolves to restart, even when local credits are empty", () => {
  assert.equal(
    resolveNextSessionAction({
      isSample: false,
      demoMode: false,
      canRunLocally: false,
      upgradeTargetPresent: false,
    }),
    "restart",
  );
  assert.equal(
    resolveNextSessionAction({
      canRunLocally: true,
      upgradeTargetPresent: true,
    }),
    "restart",
  );
});

test("next session destination is the homepage upload anchor", () => {
  assert.equal(NEXT_SESSION_UPLOAD_HREF, "/#start-assessment");
});

test("navigateToNextSessionUpload uses location.assign for iOS-safe hash navigation", () => {
  const calls = [];
  const previous = globalThis.window;
  globalThis.window = {
    location: {
      assign(url) {
        calls.push(url);
      },
    },
  };
  try {
    navigateToNextSessionUpload();
    assert.deepEqual(calls, [NEXT_SESSION_UPLOAD_HREF]);
  } finally {
    if (previous === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previous;
    }
  }
});
