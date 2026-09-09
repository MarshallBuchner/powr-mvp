type RecruitEvent =
  | "recruit_view"
  | "recruit_cta_click"
  | "recruit_scroll_50"
  | "recruit_offer_view"
  | "recruit_checkout_click"
  | "recruit_purchase"
  | "recruit_download"
  | "recruit_upsell_click";

type EventPayload = Record<string, string | number | boolean | undefined>;

/**
 * Analytics hooks for POWR Recruit.
 * Wires into Vercel Analytics when available; no-ops safely otherwise.
 */
export function trackRecruitEvent(
  event: RecruitEvent,
  payload: EventPayload = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    void import("@vercel/analytics/react").then((mod) => {
      if (typeof mod.track === "function") {
        mod.track(event, payload);
      }
    });
  } catch {
    // Analytics should never block UX.
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[recruit analytics]", event, payload);
  }
}
