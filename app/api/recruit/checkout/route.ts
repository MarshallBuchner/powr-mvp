import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const previewUrl = "/recruit/thank-you?preview=1";
const PRODUCT_NAME = "POWR Recruit — The Complete Hockey Recruiting Toolkit";
const UNIT_AMOUNT_CENTS = 3900; // $39.00 CAD

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

    if (!stripe) {
      return NextResponse.json({
        url: `${baseUrl}${previewUrl}`,
        provider: "preview",
        configured: false,
        message:
          "Add STRIPE_SECRET_KEY to enable live Stripe Checkout. Optional: STRIPE_RECRUIT_PRICE_ID.",
      });
    }

    const configuredPriceId =
      process.env.STRIPE_RECRUIT_PRICE_ID ||
      process.env.NEXT_PUBLIC_STRIPE_RECRUIT_PRICE_ID;

    const lineItems = configuredPriceId
      ? [{ price: configuredPriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "cad",
              unit_amount: UNIT_AMOUNT_CENTS,
              product_data: {
                name: PRODUCT_NAME,
                description:
                  "Digital hockey recruiting toolkit with PDF guides and Excel tracker.",
                metadata: {
                  product: "powr_recruit",
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
      usedInlinePrice: !configuredPriceId,
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
