import assert from "node:assert/strict";
import { test } from "node:test";
import { createShareOnce } from "./shareOnce.ts";
import { resolveHandoffShare } from "./reportHandoff.ts";

test("auto-navigation and fallback button share ONE link (concurrent + sequential)", async () => {
  let calls = 0;
  const get = createShareOnce(async () => { calls++; await new Promise((r) => setTimeout(r, 10)); return { path: `/r/s/${"b".repeat(48)}`, mode: "token" }; });
  const [a, b] = await Promise.all([get(), get()]);
  const c = await get();
  assert.equal(calls, 1);
  assert.equal(a.path, b.path);
  assert.equal(c.path, a.path);
});

test("interrupted navigation: a failed share attempt can be retried (no re-analysis)", async () => {
  let calls = 0;
  const get = createShareOnce(async () => { calls++; if (calls === 1) throw new TypeError("Load failed"); return { path: "/r/view", mode: "session" }; });
  await assert.rejects(get());
  assert.equal((await get()).path, "/r/view");
  assert.equal(calls, 2);
});

test("server-persisted share path is used directly — no share request", async () => {
  let calls = 0;
  const share = await resolveHandoffShare({ sharePath: `/r/s/${"c".repeat(48)}` }, async () => { calls++; return { path: "/x", mode: "token" }; });
  assert.equal(share.path, `/r/s/${"c".repeat(48)}`);
  assert.equal(calls, 0);
  const fallback = await resolveHandoffShare({ sharePath: "javascript:alert(1)" }, async () => { calls++; return { path: "/r/view", mode: "session", stashed: true }; });
  assert.equal(fallback.path, "/r/view");
  assert.equal(calls, 1);
});
