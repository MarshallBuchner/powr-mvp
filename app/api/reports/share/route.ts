import { NextRequest, NextResponse } from "next/server";
import type { RealAnalysis } from "@/app/components/types";
import {
  createShareToken,
  guestShareExpiresAt,
  isShareTokenFormat,
} from "@/lib/reportTokens";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type CreateBody = {
  goal?: string;
  fileName?: string;
  duration?: number | null;
  analysis?: RealAnalysis;
  assessmentId?: string | null;
};

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Secure report sharing is not configured (Supabase service role required).",
      },
      { status: 503 },
    );
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const goal = typeof body.goal === "string" ? body.goal.trim() : "";
  const fileName =
    typeof body.fileName === "string" ? body.fileName.trim() : "";
  const analysis = body.analysis;

  if (!goal || !fileName || !analysis || typeof analysis !== "object") {
    return NextResponse.json(
      { error: "goal, fileName, and analysis are required." },
      { status: 400 },
    );
  }

  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  const admin = createServiceClient();
  const shareToken = createShareToken();
  const assessmentId =
    typeof body.assessmentId === "string" && body.assessmentId
      ? body.assessmentId
      : null;

  // If linking to a saved assessment, require ownership.
  if (assessmentId) {
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const { data: owned, error: ownedError } = await admin
      .from("assessments")
      .select("id")
      .eq("id", assessmentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (ownedError || !owned) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }
  }

  const expiresAt = user && assessmentId ? null : guestShareExpiresAt().toISOString();

  const { data, error } = await admin
    .from("shared_reports")
    .insert({
      share_token: shareToken,
      expires_at: expiresAt,
      owner_user_id: user?.id ?? null,
      assessment_id: assessmentId,
      goal,
      file_name: fileName,
      duration: body.duration ?? null,
      analysis,
    })
    .select("share_token, expires_at")
    .single();

  if (error || !data) {
    console.error("POWR create share failed", error);
    return NextResponse.json(
      { error: "Could not create share link." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    token: data.share_token,
    path: `/r/s/${data.share_token}`,
    expiresAt: data.expires_at,
  });
}

/** Revoke a share token you own (or delete guest token if you know it — owner only). */
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured yet." },
      { status: 503 },
    );
  }

  const token = new URL(request.url).searchParams.get("token") || "";
  if (!isShareTokenFormat(token)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("shared_reports")
    .update({ revoked_at: new Date().toISOString() })
    .eq("share_token", token)
    .eq("owner_user_id", user.id)
    .is("revoked_at", null)
    .select("share_token")
    .maybeSingle();

  if (error) {
    console.error("POWR revoke share failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Share not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
