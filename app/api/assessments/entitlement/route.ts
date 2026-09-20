import { NextRequest, NextResponse } from "next/server";
import { type EntitlementState } from "@/lib/assessmentBilling";
import {
  readEntitlementCookie,
  writeEntitlementCookie,
} from "@/lib/entitlementCookie";
import { isFounderUnlimited } from "@/lib/founderAccess";
import {
  entitlementResponse,
  mergeDeviceIntoProfile,
  readProfileEntitlements,
} from "@/lib/profileEntitlements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getAuthedUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { supabase, user } : null;
  } catch (error) {
    console.error("POWR entitlement auth lookup failed", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const device = readEntitlementCookie(request);
  const authed = await getAuthedUser();

  if (authed) {
    try {
      const state = await readProfileEntitlements(
        authed.supabase,
        authed.user.id,
        authed.user.email,
      );
      const unlimited = isFounderUnlimited(authed.user.email);
      const response = NextResponse.json(
        entitlementResponse(state, "profile", { unlimited }),
      );
      return writeEntitlementCookie(response, {
        ...state,
        unlockedSessionIds: device.unlockedSessionIds,
      });
    } catch (error) {
      console.error("POWR profile entitlement read failed", error);
      return NextResponse.json(
        { error: "Could not load assessment balance." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(entitlementResponse(device, "device"));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<EntitlementState> & {
    merge?: boolean;
  };
  const deviceIncoming: EntitlementState = {
    freeUsed: Math.max(0, Number(body.freeUsed) || 0),
    credits: Math.max(0, Number(body.credits) || 0),
    unlockedSessionIds: Array.isArray(body.unlockedSessionIds)
      ? body.unlockedSessionIds.filter((id): id is string => typeof id === "string")
      : [],
  };

  const cookie = readEntitlementCookie(request);
  const deviceMerged: EntitlementState = {
    freeUsed: Math.max(cookie.freeUsed, deviceIncoming.freeUsed),
    credits: Math.max(cookie.credits, deviceIncoming.credits),
    unlockedSessionIds: Array.from(
      new Set([...cookie.unlockedSessionIds, ...deviceIncoming.unlockedSessionIds]),
    ),
  };

  const authed = await getAuthedUser();

  if (authed) {
    try {
      const profile = await mergeDeviceIntoProfile(authed.supabase, deviceMerged);
      const unlimited = isFounderUnlimited(authed.user.email);
      const response = NextResponse.json(
        entitlementResponse(profile, "profile", { unlimited }),
      );
      return writeEntitlementCookie(response, {
        ...profile,
        unlockedSessionIds: deviceMerged.unlockedSessionIds,
      });
    } catch (error) {
      console.error("POWR profile entitlement merge failed", error);
      return NextResponse.json(
        { error: "Could not sync assessment balance." },
        { status: 500 },
      );
    }
  }

  const response = NextResponse.json(
    entitlementResponse(deviceMerged, "device"),
  );
  return writeEntitlementCookie(response, deviceMerged);
}
