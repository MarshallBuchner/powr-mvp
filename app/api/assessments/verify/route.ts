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
import {
  entitlementResponse,
  grantPackCreditsToProfile,
  readProfileEntitlements,
} from "@/lib/profileEntitlements";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
}

/**
 * Confirm payment status for the unlock page.
 * Authed purchases: credits come from the Stripe webhook (source of truth).
 * This route only reads profile balance (and may wait briefly for webhook).
 * Guest/preview: keep legacy cookie grant for local/dev preview only.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const preview = request.nextUrl.searchParams.get("preview");

  if (preview === "1" || sessionId === "preview") {
    // Dev/preview path only — not used for live webhook-backed purchases.
    let authedUserId: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        authedUserId = user?.id ?? null;

        if (authedUserId && isServiceRoleConfigured()) {
          const admin = createServiceClient();
          const granted = await grantPackCreditsToProfile(
            admin,
            authedUserId,
            "preview",
            ASSESSMENT_PACK_CREDITS,
          );
          return NextResponse.json({
            paid: true,
            preview: true,
            creditsGranted: granted.creditsGranted,
            ...entitlementResponse(granted.state, "profile"),
            entitlements: granted.state,
            source: "profile",
          });
        }
      } catch (error) {
        console.error("POWR preview profile grant failed", error);
      }
    }

    const current = readEntitlementCookie(request);
    const next = grantPackCredits(current, "preview", ASSESSMENT_PACK_CREDITS);
    const response = NextResponse.json({
      paid: true,
      preview: true,
      creditsGranted: ASSESSMENT_PACK_CREDITS,
      remaining: remainingAssessments(next),
      canRun: canRunAssessment(next),
      entitlements: next,
      source: "device",
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

    const credits =
      Number(session.metadata?.credits) || ASSESSMENT_PACK_CREDITS;
    const metaUserId =
      session.metadata?.user_id || session.client_reference_id || null;

    // Authed purchase: webhook is SoT. Read profile (poll-friendly).
    if (metaUserId && isSupabaseConfigured()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const state = await readProfileEntitlements(
          supabase,
          user.id,
          user.email,
        );
        return NextResponse.json({
          paid: true,
          preview: false,
          email: session.customer_details?.email ?? null,
          amountTotal: session.amount_total,
          currency: session.currency,
          creditsGranted: credits,
          ...entitlementResponse(state, "profile"),
          entitlements: state,
          ref: session.metadata?.ref || null,
          source: "profile",
        });
      }
    }

    // Legacy guest cookie grant (sessions without user_id).
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
      source: "device",
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
