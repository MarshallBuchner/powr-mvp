import { NextRequest, NextResponse } from "next/server";
import {
  TELEMETRY_MAX_BYTES,
  createRateLimiter,
  sanitizeTelemetry,
  uaFamily,
} from "@/lib/labTelemetry";

const allow = createRateLimiter();

/** Lab lifecycle beacons. Logs allowlisted fields only (no PII, frames, or URLs). */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!allow(ip)) return new NextResponse(null, { status: 429 });

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > TELEMETRY_MAX_BYTES) return new NextResponse(null, { status: 413 });
  let text = "";
  try {
    text = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (text.length > TELEMETRY_MAX_BYTES) return new NextResponse(null, { status: 413 });

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const event = sanitizeTelemetry(parsed);
  if (!event) return new NextResponse(null, { status: 400 });

  console.info("[POWR:lab]", {
    ...event,
    ua: uaFamily(request.headers.get("user-agent")),
  });
  return new NextResponse(null, { status: 204 });
}
