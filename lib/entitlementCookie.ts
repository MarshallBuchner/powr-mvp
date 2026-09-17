import { NextRequest, NextResponse } from "next/server";
import {
  ENTITLEMENT_COOKIE,
  type EntitlementState,
  defaultEntitlements,
  parseEntitlementJson,
} from "@/lib/assessmentBilling";

export function readEntitlementCookie(request: NextRequest): EntitlementState {
  return parseEntitlementJson(request.cookies.get(ENTITLEMENT_COOKIE)?.value);
}

export function entitlementCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export function writeEntitlementCookie(
  response: NextResponse,
  state: EntitlementState,
) {
  response.cookies.set(
    ENTITLEMENT_COOKIE,
    JSON.stringify(state ?? defaultEntitlements()),
    entitlementCookieOptions(),
  );
  return response;
}
