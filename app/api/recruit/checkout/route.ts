import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const previewUrl = "/recruit/thank-you?preview=1";

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
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-08-26.dahlia",
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const baseUrl = getBaseUrl(request);
    const body = (await request.json().catch(() => ({}))) as { source?: string };
    const source = body.source || "cta";
    const priceId =
      process.env.STRIPE_RECRUIT_PRICE_ID ||
      process.env.NEXT_PUBLIC_STRIPE_RECRUIT_PRICE_ID;

    if (!stripe || !priceId) {
      return NextResponse.json({
        url: `${baseUrl}${previewUrl}`,
        provider: "preview",
        configured: false,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${baseUrl}/recruit/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/recruit?checkout=cancelled`,
      metadata: {
        product: "powr_recruit",
        source,
      },
      custom_text: {
        submit: {
          message:
            "POWR Recruit is a one-time purchase with instant digital delivery.",
        },
      },
    });

    return NextResponse.json({
      url: session.url,
      provider: "stripe",
      configured: true,
    });
  } catch (error) {
    console.error("Failed to create recruit checkout session", error);
    return NextResponse.json(
      {
        error: "Unable to start checkout right now.",
      },
      { status: 500 },
    );
  }
}
