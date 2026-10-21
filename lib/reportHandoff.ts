// Same rule as lib/labLifecycle.ts isSafeSharePath (kept local: node test runner has no TS path resolution).
const SHARE_PATH_RE = /^\/r\/(?:s\/[a-f0-9]{32,96}|view)$/i;
function isSafeSharePath(value: unknown): value is string {
  return typeof value === "string" && SHARE_PATH_RE.test(value);
}

export type HandoffShare = { path: string; mode: string; stashed?: boolean };

/**
 * Prefer the share link /api/analyze already persisted (no extra request, no
 * second token). Otherwise fall back to the provided creator (memoised by the
 * caller via createShareOnce so the fallback button reuses it).
 */
export async function resolveHandoffShare(
  request: { sharePath?: string },
  createShare: () => Promise<HandoffShare>,
): Promise<HandoffShare> {
  if (isSafeSharePath(request.sharePath)) {
    return { path: request.sharePath, mode: "token" };
  }
  return createShare();
}
