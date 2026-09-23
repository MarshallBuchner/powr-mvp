import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ASSESSMENT_PACK_CREDITS, ASSESSMENT_PRODUCT_ID } from "@/lib/assessmentBilling";
import { entitlementResponse, readProfileEntitlements } from "@/lib/profileEntitlements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// This route only confirms ownership/payment and reads the webhook's grant.
// Neither a preview URL nor a browser redirect can grant paid credits.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (request.nextUrl.searchParams.has("preview") || sessionId === "preview") {
    return NextResponse.json({ paid: false, reason: "preview_disabled" }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ paid: false, reason: "missing_session" }, { status: 400 });
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isSupabaseConfigured()) {
    return NextResponse.json({ paid: false, reason: "billing_unconfigured" }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ paid: false, reason: "sign_in_required" }, { status: 401 });
    }
    const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const owner = session.metadata?.user_id || session.client_reference_id;
    if (owner !== user.id || session.metadata?.product !== ASSESSMENT_PRODUCT_ID) {
      return NextResponse.json({ paid: false, reason: "invalid_session" }, { status: 403 });
    }
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return NextResponse.json({ paid: false, reason: "unpaid" });
    }
    const { data: grant, error } = await supabase
      .from("assessment_credit_grants")
      .select("credits")
      .eq("stripe_session_id", session.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    const state = await readProfileEntitlements(supabase, user.id, user.email);
    return NextResponse.json({
      paid: true,
      preview: false,
      awaitingWebhook: !grant,
      creditsGranted: grant ? grant.credits : 0,
      packCredits: ASSESSMENT_PACK_CREDITS,
      amountTotal: session.amount_total,
      currency: session.currency,
      ...entitlementResponse(state, "profile"),
      entitlements: state,
      ref: session.metadata?.ref || null,
    });
  } catch (error) {
    console.error("Failed to verify assessment checkout session", error);
    return NextResponse.json({ paid: false, reason: "verification_failed" }, { status: 400 });
  }
}
