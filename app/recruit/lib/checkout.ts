import { trackRecruitEvent } from "./analytics";

/**
 * Checkout abstraction for POWR Recruit ($39 CAD).
 *
 * TODO: Wire to Stripe Checkout / Lemon Squeezy / Gumroad.
 * Until then, route users to the thank-you page so the delivery UX can be validated.
 */
export async function handleCheckout(source: string = "cta") {
  trackRecruitEvent("recruit_checkout_click", { source });
  trackRecruitEvent("recruit_cta_click", { source });

  // TODO(payment): Replace this redirect with real checkout session creation.
  // Example (Stripe):
  // const res = await fetch("/api/recruit/checkout", { method: "POST" });
  // const { url } = await res.json();
  // window.location.href = url;

  if (typeof window !== "undefined") {
    window.location.href = "/recruit/thank-you?preview=1";
  }
}
