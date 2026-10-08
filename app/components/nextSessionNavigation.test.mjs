import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NEXT_SESSION_UPLOAD_HASH,
  NEXT_SESSION_UPLOAD_HREF,
  NEXT_SESSION_UPLOAD_PATH,
  buildNextSessionUploadUrl,
  navigateToNextSessionUpload,
  resolveNextSessionAction,
  scrollToNextSessionUploadAnchor,
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
  assert.equal(NEXT_SESSION_UPLOAD_PATH, "/");
  assert.equal(NEXT_SESSION_UPLOAD_HASH, "start-assessment");
  assert.equal(
    buildNextSessionUploadUrl("https://trainwithpowr.com"),
    "/#start-assessment",
  );
});

test("navigateToNextSessionUpload uses a full URL href for iOS Safari", () => {
  const calls = [];
  const previous = globalThis.window;
  globalThis.window = {
    location: {
      origin: "https://trainwithpowr.com",
      pathname: "/r/s/abc",
      set href(url) {
        calls.push(["href", url]);
      },
      get href() {
        return "https://trainwithpowr.com/r/s/abc";
      },
      assign(url) {
        calls.push(["assign", url]);
      },
    },
  };
  try {
    navigateToNextSessionUpload();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "href");
    assert.equal(
      calls[0][1],
      "https://trainwithpowr.com/#start-assessment",
    );
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test("scrollToNextSessionUploadAnchor finds #start-assessment", () => {
  const previousDoc = globalThis.document;
  let scrolled = false;
  globalThis.document = {
    getElementById(id) {
      if (id !== "start-assessment") return null;
      return {
        scrollIntoView() {
          scrolled = true;
        },
      };
    },
  };
  try {
    assert.equal(scrollToNextSessionUploadAnchor(), true);
    assert.equal(scrolled, true);
  } finally {
    if (previousDoc === undefined) delete globalThis.document;
    else globalThis.document = previousDoc;
  }
});

test("Safari/Chrome storage divergence explains old no-op: empty credits + missing upgrade", () => {
  // Documents the production failure mode: Safari localStorage empty after
  // consume, upgrade wrap absent → old handler returned without navigating.
  const safariCanRun = false;
  const upgradePresent = false;
  assert.equal(
    resolveNextSessionAction({
      canRunLocally: safariCanRun,
      upgradeTargetPresent: upgradePresent,
    }),
    "restart",
  );
});

test("Private vs regular Safari: CTA href must not depend on stored can-run state", () => {
  // Regular Safari (used session) and Private Safari (clean) must resolve the
  // same restart action — navigation is href-based, not entitlement-gated.
  assert.equal(
    resolveNextSessionAction({ canRunLocally: false }),
    resolveNextSessionAction({ canRunLocally: true }),
  );
  assert.equal(NEXT_SESSION_UPLOAD_HREF.startsWith("/#"), true);
});
