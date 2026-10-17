import { NextRequest, NextResponse } from "next/server";
import {
  MEASUREMENT_COOKIE, sendAssessmentCompletion, verifyMeasurementReceipt,
} from "@/lib/metaMeasurement";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 1024) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  let eventId: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 1024) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    eventId = JSON.parse(raw).eventId;
  }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const receipt = verifyMeasurementReceipt(request.cookies.get(MEASUREMENT_COOKIE)?.value);
  if (!receipt || receipt.id !== eventId) return NextResponse.json({ measured: false });
  const measured = await sendAssessmentCompletion(receipt, {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  }).catch(() => false);
  const response = NextResponse.json({ measured }, { status: measured ? 200 : 503 });
  response.headers.set("Cache-Control", "no-store");
  if (measured) response.cookies.set(MEASUREMENT_COOKIE, "", {
    path: "/api/marketing/complete", httpOnly: true, secure: true, sameSite: "strict", maxAge: 0,
  });
  return response;
}
