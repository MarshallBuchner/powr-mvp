import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";

test("POWR does not ship a first-party service worker asset", () => {
  const publicFiles = fs.existsSync("public")
    ? fs.readdirSync("public", { recursive: true }).map(String)
    : [];
  const swLike = publicFiles.filter((name) =>
    /(^|\/)(sw|service-worker|serviceworker)(\.|$)/i.test(name),
  );
  assert.deepEqual(swLike, []);

  const nextConfig = fs.readFileSync("next.config.ts", "utf8");
  assert.equal(nextConfig.includes("serviceWorker"), false);
  assert.match(nextConfig, /no-store/);
});

test("ClientRuntimeHygiene unregisters service workers when present", () => {
  const source = fs.readFileSync("app/components/ClientRuntimeHygiene.tsx", "utf8");
  assert.match(source, /serviceWorker\.getRegistrations/);
  assert.match(source, /unregister/);
  assert.match(source, /caches\.keys/);
});
