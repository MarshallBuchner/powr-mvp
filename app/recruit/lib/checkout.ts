import { trackRecruitEvent } from "./analytics";

export const CHECKOUT_PREVIEW_PATH = "/recruit/thank-you?preview=1";

/**
 * Checkout instrumentation for POWR Recruit ($39 CAD).
 * Real provider sessions are created by /api/recruit/checkout.
 */
export function beginCheckout(source: string = "cta") {
  trackRecruitEvent("recruit_checkout_click", { source });
  trackRecruitEvent("recruit_cta_click", { source });
}
