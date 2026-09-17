import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PRODUCT_ID,
  canRunAssessment,
  grantPackCredits,
  remainingAssessments,
} from "@/lib/assessmentBilling";
import {
  readEntitlementCookie,
  writeEntitlementCookie,
} from "@/lib/entitlementCookie";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const preview = request.nextUrl.searchParams.get("preview");

  if (preview === "1" || sessionId === "preview") {
    const current = readEntitlementCookie(request);
    const next = grantPackCredits(current, "preview", ASSESSMENT_PACK_CREDITS);
    const response = NextResponse.json({
      paid: true,
      preview: true,
      creditsGranted: ASSESSMENT_PACK_CREDITS,
      remaining: remainingAssessments(next),
      canRun: canRunAssessment(next),
      entitlements: next,
    });
    return writeEntitlementCookie(response, next);
  }

  if (!sessionId) {
    return NextResponse.json({
      paid: false,
      preview: false,
      reason: "missing_session",
    });
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

    if (!paid) {
      return NextResponse.json({
        paid: false,
        preview: false,
        reason: "unpaid",
      });
    }

    if (
      session.metadata?.product &&
      session.metadata.product !== ASSESSMENT_PRODUCT_ID
    ) {
      return NextResponse.json({
        paid: false,
        preview: false,
        reason: "wrong_product",
      });
    }

    const credits = Number(session.metadata?.credits) || ASSESSMENT_PACK_CREDITS;
    const current = readEntitlementCookie(request);
    const next = grantPackCredits(current, sessionId, credits);

    const response = NextResponse.json({
      paid: true,
      preview: false,
      email: session.customer_details?.email ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
      creditsGranted: credits,
      remaining: remainingAssessments(next),
      canRun: canRunAssessment(next),
      entitlements: next,
      ref: session.metadata?.ref || null,
    });
    return writeEntitlementCookie(response, next);
  } catch (error) {
    console.error("Failed to verify assessment checkout session", error);
    return NextResponse.json(
      { paid: false, preview: false, reason: "invalid_session" },
      { status: 400 },
    );
  }
}
