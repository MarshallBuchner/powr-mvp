/**
 * "Upload Your Next Session" CTA helpers.
 *
 * Entitlement / upgrade gating belongs on the upload flow (UploadCard), not on
 * this button. Swallowing the tap to scroll to a possibly-missing upgrade panel
 * made the CTA appear broken on iPhone after a completed assessment.
 */

export const NEXT_SESSION_UPLOAD_HREF = "/#start-assessment";

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
  // Context is accepted for call-site clarity / future flags; restart is mandatory.
  void context;
  return "restart";
}

/**
 * Hard navigation to the homepage upload anchor.
 * `router.push("/#…")` is unreliable on iOS Safari / Next App Router for
 * cross-route hash targets; assign() loads `/` and honors the hash.
 */
export function navigateToNextSessionUpload(): void {
  if (typeof window === "undefined") return;
  window.location.assign(NEXT_SESSION_UPLOAD_HREF);
}
