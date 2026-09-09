"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RecruitHeader from "../components/RecruitHeader";
import RecruitFooter from "../components/RecruitFooter";
import { downloadFiles, toolkitZipPath } from "../lib/content";
import { trackRecruitEvent } from "../lib/analytics";

type VerifyState =
  | { status: "loading" }
  | { status: "ready"; paid: boolean; preview: boolean; reason?: string }
  | { status: "error"; message: string };

export default function DownloadClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verify, setVerify] = useState<VerifyState>({ status: "loading" });

  useEffect(() => {
    trackRecruitEvent("recruit_download", { surface: "page_view" });

    async function run() {
      try {
        const query = sessionId
          ? `?session_id=${encodeURIComponent(sessionId)}`
          : "";
        const res = await fetch(`/api/recruit/verify${query}`);
        const data = (await res.json()) as {
          paid?: boolean;
          preview?: boolean;
          reason?: string;
        };
        setVerify({
          status: "ready",
          paid: Boolean(data.paid),
          preview: Boolean(data.preview),
          reason: data.reason,
        });
      } catch {
        setVerify({
          status: "error",
          message: "Could not verify purchase status.",
        });
      }
    }

    void run();
  }, [sessionId]);

  const canDownload =
    verify.status === "ready" && (verify.paid || verify.preview);

  return (
    <>
      <RecruitHeader compact />
      <main className="recruit-page">
        <p className="recruit-eyebrow">DOWNLOAD</p>
        <h1>YOUR POWR RECRUIT TOOLKIT</h1>
        <p className="recruit-lead">
          Buyers download a ZIP with designed PDF guides/templates, an Excel
          recruiting tracker, and editable source files. Use them to build a
          player profile, write a bio, structure a highlight reel, contact
          coaches professionally, and track every opportunity.
        </p>

        <div className="recruit-page-card">
          <p className="recruit-panel-title">Package contents</p>
          <ul className="recruit-download-list">
            {downloadFiles.map((file) => (
              <li key={file.name}>
                <span>{file.label}</span>
                <em>{file.name}</em>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 12 }}>
            {canDownload ? (
              <a
                href={`${toolkitZipPath}?session_id=${encodeURIComponent(sessionId || "preview")}`}
                className="recruit-btn recruit-btn-primary"
                onClick={() =>
                  trackRecruitEvent("recruit_download", { action: "zip_click" })
                }
              >
                Download ZIP now
              </a>
            ) : (
              <Link href="/recruit#offer" className="recruit-btn recruit-btn-primary">
                {verify.status === "loading"
                  ? "Checking access..."
                  : "Get access — $39 CAD"}
              </Link>
            )}
            <Link href="/recruit" className="recruit-btn recruit-btn-secondary">
              Back to landing
            </Link>
          </div>

          {verify.status === "ready" && !canDownload ? (
            <p className="recruit-guarantee">
              Purchase required for download. If you already paid, reopen this
              page from your thank-you link so the session can be verified.
            </p>
          ) : null}
          {verify.status === "error" ? (
            <p className="recruit-guarantee">{verify.message}</p>
          ) : null}
        </div>
      </main>
      <RecruitFooter />
    </>
  );
}
