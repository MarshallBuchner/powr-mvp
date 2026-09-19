import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  ASSESSMENT_PACK_AMOUNT_CENTS,
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PRODUCT_ID,
  ASSESSMENT_PRODUCT_NAME,
} from "@/lib/assessmentBilling";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const previewUrl = "/unlock?preview=1";

function getBaseUrl(request: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const host = request.headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: "2026-08-26.dahlia",
  });
}

async function getAuthedUserId() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const baseUrl = getBaseUrl(request);
    const body = (await request.json().catch(() => ({}))) as {
      source?: string;
      ref?: string | null;
    };
    const source = body.source || "upgrade";
    const ref = (body.ref || "").slice(0, 64);
    const userId = await getAuthedUserId();

    if (!stripe) {
      return NextResponse.json({
        url: `${baseUrl}${previewUrl}`,
        provider: "preview",
        configured: false,
        message:
          "Add STRIPE_SECRET_KEY to enable live Stripe Checkout. Optional: STRIPE_ASSESSMENT_PRICE_ID.",
      });
    }

    // Live pack purchase requires an account so webhook can credit the profile.
    if (!userId) {
      return NextResponse.json(
        {
          error: "sign_in_required",
          message: "Sign in to purchase assessment credits for your account.",
          loginUrl: `/login?next=${encodeURIComponent("/#start-assessment")}`,
        },
        { status: 401 },
      );
    }

    const configuredPriceId =
      process.env.STRIPE_ASSESSMENT_PRICE_ID ||
      process.env.NEXT_PUBLIC_STRIPE_ASSESSMENT_PRICE_ID;

    const lineItems = configuredPriceId
      ? [{ price: configuredPriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "cad",
              unit_amount: ASSESSMENT_PACK_AMOUNT_CENTS,
              product_data: {
                name: ASSESSMENT_PRODUCT_NAME,
                description: `${ASSESSMENT_PACK_CREDITS} AI skating assessments. One-time purchase.`,
                metadata: {
                  product: ASSESSMENT_PRODUCT_ID,
                  credits: String(ASSESSMENT_PACK_CREDITS),
                },
              },
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: userId,
      success_url: `${baseUrl}/unlock?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#start-assessment`,
      metadata: {
        product: ASSESSMENT_PRODUCT_ID,
        credits: String(ASSESSMENT_PACK_CREDITS),
        source,
        ref,
        user_id: userId,
      },
      custom_text: {
        submit: {
          message: `One-time pack of ${ASSESSMENT_PACK_CREDITS} POWR skating assessments.`,
        },
      },
    });

    return NextResponse.json({
      url: session.url,
      provider: "stripe",
      configured: true,
      usedInlinePrice: !configuredPriceId,
    });
  } catch (error) {
    console.error("Failed to create assessment checkout session", error);
    return NextResponse.json(
      { error: "Unable to start checkout right now." },
      { status: 500 },
    );
  }
}
