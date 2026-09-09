import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { RealAnalysis } from "@/app/components/types";

type CreateBody = {
  goal?: string;
  fileName?: string;
  duration?: number | null;
  analysis?: RealAnalysis;
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("assessments")
    .select("id, created_at, goal, file_name, duration, overall_score, analysis")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list assessments", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assessments: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateBody;

  if (!body.goal || !body.fileName || !body.analysis) {
    return NextResponse.json(
      { error: "goal, fileName, and analysis are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      goal: body.goal,
      file_name: body.fileName,
      duration: body.duration ?? null,
      analysis: body.analysis,
      overall_score: body.analysis.overallScore ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save assessment", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
