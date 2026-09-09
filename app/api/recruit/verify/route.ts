import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({
      paid: false,
      preview: false,
      reason: "missing_session",
    });
  }

  if (sessionId === "preview") {
    return NextResponse.json({ paid: true, preview: true });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({
      paid: false,
      preview: false,
      reason: "stripe_unconfigured",
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" || session.status === "complete";

    return NextResponse.json({
      paid,
      preview: false,
      email: session.customer_details?.email ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error("Failed to verify recruit checkout session", error);
    return NextResponse.json(
      { paid: false, preview: false, reason: "invalid_session" },
      { status: 400 },
    );
  }
}
