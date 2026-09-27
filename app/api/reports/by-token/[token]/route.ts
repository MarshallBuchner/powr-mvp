import { NextResponse } from "next/server";
import { isShareTokenFormat } from "@/lib/reportTokens";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Secure report sharing is not configured." },
      { status: 503 },
    );
  }

  const { token: raw } = await params;
  const token = decodeURIComponent(raw || "").trim();
  if (!isShareTokenFormat(token)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("shared_reports")
    .select(
      "share_token, goal, file_name, duration, analysis, expires_at, revoked_at",
    )
    .eq("share_token", token)
    .maybeSingle();

  if (error) {
    console.error("POWR load share failed", error);
    return NextResponse.json({ error: "Could not load report." }, { status: 500 });
  }

  if (!data || data.revoked_at) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This share link has expired." }, { status: 410 });
  }

  return NextResponse.json({
    report: {
      goal: data.goal,
      fileName: data.file_name,
      duration: data.duration,
      analysis: data.analysis,
      expiresAt: data.expires_at,
    },
  });
}
