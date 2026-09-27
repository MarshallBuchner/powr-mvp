import type { Metadata } from "next";
import Link from "next/link";
import SharedReportView from "@/app/components/SharedReportView";
import type { AnalysisRequest, RealAnalysis } from "@/app/components/types";
import { isShareTokenFormat } from "@/lib/reportTokens";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

type Params = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Shared POWR Assessment",
  description: "A shared POWR skating assessment report.",
  robots: { index: false, follow: false },
};

export default async function TokenSharePage({ params }: Params) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw || "").trim();

  if (!isShareTokenFormat(token)) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Invalid share link</h1>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </main>
    );
  }

  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Share link unavailable</h1>
        <p>
          Secure sharing is not configured in this environment. Contact{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
        </p>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </main>
    );
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("shared_reports")
    .select(
      "goal, file_name, duration, analysis, expires_at, revoked_at",
    )
    .eq("share_token", token)
    .maybeSingle();

  if (error || !data || data.revoked_at) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Report not found</h1>
        <p>This share link may have been revoked or never existed.</p>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </main>
    );
  }

  const expiresAtMs = data.expires_at
    ? new Date(data.expires_at).getTime()
    : null;
  /* eslint-disable-next-line react-hooks/purity -- server request-time expiry */
  if (expiresAtMs != null && expiresAtMs < Date.now()) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Share link expired</h1>
        <p>Ask the report owner for a new link if you still need access.</p>
        <p>
          <Link href="/">← Home</Link>
        </p>
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
