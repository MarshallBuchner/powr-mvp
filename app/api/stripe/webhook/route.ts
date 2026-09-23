import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PRODUCT_ID,
} from "@/lib/assessmentBilling";
import { grantPackCreditsToProfile } from "@/lib/profileEntitlements";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
}

async function grantFromCheckoutSession(session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.user_id || session.client_reference_id || null;
  if (!userId) {
    return { skipped: true, reason: "missing_user_id" as const };
  }

  if (session.metadata?.product !== ASSESSMENT_PRODUCT_ID) {
    return { skipped: true, reason: "wrong_product" as const };
  }

  const paid = session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!paid) {
    return { skipped: true, reason: "unpaid" as const };
  }

  if (!isServiceRoleConfigured()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for Stripe webhooks");
  }

  const credits = ASSESSMENT_PACK_CREDITS;
  const admin = createServiceClient();
  const granted = await grantPackCreditsToProfile(
    admin,
    userId,
    session.id,
    credits,
  );

  return {
    skipped: false,
    alreadyGranted: granted.alreadyGranted,
    creditsGranted: granted.creditsGranted,
    userId,
    remaining: granted.state.credits,
  };
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("POWR Stripe webhook signature failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await grantFromCheckoutSession(session);
      return NextResponse.json({ received: true, ...result });
    }

    return NextResponse.json({ received: true, ignored: event.type });
  } catch (error) {
    console.error("POWR Stripe webhook handler failed", error);
    return NextResponse.json({ error: "webhook_handler_failed" }, { status: 500 });
  }
}
