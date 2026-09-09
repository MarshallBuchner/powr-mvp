import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured yet." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assessments")
    .select("id, created_at, goal, file_name, duration, overall_score, analysis")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load assessment", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }

  return NextResponse.json({ assessment: data });
}
