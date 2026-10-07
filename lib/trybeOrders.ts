import type Stripe from "stripe";

export const TRYBE_STORE_ID = "d5550a2c-9d65-441b-890e-cc82414e4434";
export const TRYBE_VISITOR_COOKIE = `ugc_vid_${TRYBE_STORE_ID}`;

export function validTrybeVisitorId(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value : null;
}

// Call only after Stripe signature verification. No customer email, report or
// video data is sent. Keep this disabled until the pixel and program are ready.
export async function reportTrybeOrder(
  session: Stripe.Checkout.Session,
  paidAt: number,
  options: { enabled?: boolean; apiKey?: string; fetcher?: typeof fetch } = {},
) {
  const enabled = options.enabled ?? process.env.TRYBE_ORDERS_ENABLED === "true";
  if (!enabled) return "disabled";
  if (!session.livemode || session.mode !== "payment" || session.payment_status !== "paid" ||
      session.metadata?.product !== "powr_assessment_pack" || session.currency !== "cad" ||
      !Number.isSafeInteger(session.amount_total) || (session.amount_total ?? 0) <= 0) return "ineligible";
  const vid = validTrybeVisitorId(session.metadata?.trybe_vid);
  if (!vid) return "unattributed";
  const apiKey = options.apiKey ?? process.env.TRYBE_ORDERS_API_KEY;
  if (!apiKey) throw new Error("Trybe Orders API key is not configured");
  const response = await (options.fetcher ?? fetch)("https://jointrybe.com/attribution/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      apiKey,
      orderId: session.id,
      value: session.amount_total! / 100,
      currency: "CAD",
      vid,
      orderTime: new Date(paidAt * 1000).toISOString(),
      items: [{ productId: "powr_assessment_pack", productName: "POWR Skating Assessment Pack — 5 assessments", quantity: 1, price: session.amount_total! / 100 }],
    }),
  });
  const result = await response.json().catch(() => null);
  if (response.status === 409 && result?.error === "Duplicate order") return "duplicate";
  if (!response.ok || result?.success !== true) {
    // Never log the response body: it could contain request credentials/data.
    throw new Error(`Trybe order delivery failed (${response.status})`);
  }
  return "queued";
}
