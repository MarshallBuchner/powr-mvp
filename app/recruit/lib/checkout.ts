import { trackRecruitEvent } from "./analytics";

export const CHECKOUT_PREVIEW_PATH = "/recruit/thank-you?preview=1";

/**
 * Checkout abstraction for POWR Recruit ($39 CAD).
 *
 * TODO: Wire to Stripe Checkout / Lemon Squeezy / Gumroad.
 * Until then, route users to the thank-you page so the delivery UX can be validated.
 */
export function beginCheckout(source: string = "cta") {
  trackRecruitEvent("recruit_checkout_click", { source });
  trackRecruitEvent("recruit_cta_click", { source });

  // TODO(payment): Replace preview navigation with real checkout session creation.
  // Example (Stripe):
  // const res = await fetch("/api/recruit/checkout", { method: "POST" });
  // const { url } = await res.json();
  // window.location.assign(url);
}

export async function handleCheckout(source: string = "cta") {
  beginCheckout(source);

  if (typeof window !== "undefined") {
    window.location.assign(CHECKOUT_PREVIEW_PATH);
  }
}
