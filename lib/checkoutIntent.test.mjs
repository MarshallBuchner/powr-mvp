import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCheckoutLoginUrl,
  buildCheckoutPath,
  unlockCancelledPath,
  unlockFailedPath,
} from "./checkoutIntent.ts";

describe("checkout intent URLs", () => {
  it("builds a checkout resume path with source", () => {
    assert.equal(buildCheckoutPath("report"), "/checkout?source=report");
    assert.equal(buildCheckoutPath(), "/checkout?source=upgrade");
  });

  it("sends guests to login with next=/checkout (not homepage)", () => {
    const url = buildCheckoutLoginUrl("upload_card");
    assert.equal(url.startsWith("/login?next="), true);
    const next = decodeURIComponent(url.split("next=")[1] || "");
    assert.equal(next, "/checkout?source=upload_card");
    assert.equal(next.includes("#start-assessment"), false);
  });

  it("uses dedicated unlock states for cancel/fail (not preview)", () => {
    assert.equal(
      unlockCancelledPath("report"),
      "/unlock?checkout=cancelled&source=report",
    );
    assert.equal(
      unlockFailedPath("upgrade"),
      "/unlock?checkout=failed&source=upgrade",
    );
    assert.equal(unlockFailedPath().includes("preview"), false);
  });
});
