import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const ZIP_PATH = path.join(
  process.cwd(),
  "storage/recruit/POWR-Recruit-Toolkit.zip",
);

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
}

async function canAccess(sessionId: string | null) {
  if (!sessionId) return false;
  if (sessionId === "preview") return true;

  const stripe = getStripeClient();
  if (!stripe) return false;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === "paid" || session.status === "complete";
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  try {
    const allowed = await canAccess(sessionId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Purchase required to download." },
        { status: 401 },
      );
    }

    if (!existsSync(ZIP_PATH)) {
      return NextResponse.json(
        { error: "Toolkit package is missing on the server." },
        { status: 404 },
      );
    }

    const stat = statSync(ZIP_PATH);
    const stream = createReadStream(ZIP_PATH);
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(stat.size),
        "Content-Disposition":
          'attachment; filename="POWR-Recruit-Toolkit.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Recruit download failed", error);
    return NextResponse.json(
      { error: "Unable to download toolkit right now." },
      { status: 500 },
    );
  }
}
