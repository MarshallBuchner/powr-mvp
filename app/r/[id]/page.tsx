import type { Metadata } from "next";
import SharedReportView from "@/app/components/SharedReportView";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AnalysisRequest, RealAnalysis } from "@/app/components/types";
import Link from "next/link";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "POWR Skating Assessment",
  description:
    "A saved POWR skating assessment with scores, coaching notes, and development drills.",
};

export default async function SavedReportPage({ params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Assessment unavailable</h1>
        <p>Accounts/storage are not configured on this environment.</p>
        <Link href="/">← Home</Link>
      </main>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, goal, file_name, duration, analysis")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Assessment not found</h1>
        <Link href="/assessments">← My assessments</Link>
      </main>
    );
  }

  const request: AnalysisRequest = {
    fileName: data.file_name,
    videoUrl: "",
    goal: data.goal,
    duration: data.duration,
    analysis: data.analysis as RealAnalysis,
  };

  return <SharedReportView request={request} />;
}
