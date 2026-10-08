/**
 * "Upload Your Next Session" CTA helpers.
 *
 * Observed on the same iPhone:
 * - Chrome: works
 * - Safari Private Browsing: works
 * - Regular Safari: fails
 *
 * That pattern points at session/cache state, not a universally broken handler:
 * 1) Separate WebKit localStorage can leave regular Safari with empty credits
 *    while Private is a clean profile (old handler no-op'd on empty credits).
 * 2) Regular Safari can retain a cached HTML shell / JS chunk from before the
 *    fix; Private always fetches fresh. There is no first-party service worker
 *    in this repo — HTTP cache + bfcache are the likely shell retainers.
 *
 * Mitigation: real <a href="/#start-assessment"> with no preventDefault, HTML
 * Cache-Control: no-store on document routes, and best-effort SW unregister.
 */

export const NEXT_SESSION_UPLOAD_HREF = "/#start-assessment";
export const NEXT_SESSION_UPLOAD_PATH = "/";
export const NEXT_SESSION_UPLOAD_HASH = "start-assessment";

export type NextSessionAction = "restart";

/**
 * Always restart / return to upload. Kept as a pure function so regression
 * tests lock the intended behavior (never "scroll-upgrade-and-bail").
 */
export function resolveNextSessionAction(context?: {
  isSample?: boolean;
  demoMode?: boolean;
  canRunLocally?: boolean;
  upgradeTargetPresent?: boolean;
}): NextSessionAction {
  void context;
  return "restart";
}

export function buildNextSessionUploadUrl(origin?: string): string {
  if (!origin) return NEXT_SESSION_UPLOAD_HREF;
  try {
    const url = new URL(NEXT_SESSION_UPLOAD_PATH, origin);
    url.hash = NEXT_SESSION_UPLOAD_HASH;
    return `${url.pathname}${url.hash}`;
  } catch {
    return NEXT_SESSION_UPLOAD_HREF;
  }
}

/**
 * Hard navigation to the homepage upload anchor.
 * Tries multiple strategies for iOS Safari quirks.
 */
export function navigateToNextSessionUpload(): void {
  if (typeof window === "undefined") return;

  const target = buildNextSessionUploadUrl(window.location.origin);

  try {
    // Absolute same-origin URL is the most reliable cross-route signal on iOS.
    window.location.href = new URL(target, window.location.origin).toString();
    return;
  } catch {
    // fall through
  }

  try {
    window.location.assign(target);
    return;
  } catch {
    // fall through
  }

  window.location.hash = NEXT_SESSION_UPLOAD_HASH;
  if (window.location.pathname !== NEXT_SESSION_UPLOAD_PATH) {
    window.location.pathname = NEXT_SESSION_UPLOAD_PATH;
  }
}

/** Scroll homepage upload into view after a hash landing (Safari is flaky). */
export function scrollToNextSessionUploadAnchor(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(NEXT_SESSION_UPLOAD_HASH);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
