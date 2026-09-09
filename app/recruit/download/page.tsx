"use client";

import Link from "next/link";
import { useEffect } from "react";
import RecruitHeader from "../components/RecruitHeader";
import RecruitFooter from "../components/RecruitFooter";
import { downloadFiles, toolkitZipPath } from "../lib/content";
import { trackRecruitEvent } from "../lib/analytics";

/**
 * Delivery page for POWR Recruit toolkit files.
 * TODO(payment): verify purchase entitlement before exposing real file URLs.
 */
export default function DownloadPage() {
  useEffect(() => {
    trackRecruitEvent("recruit_download", { surface: "page_view" });
  }, []);

  return (
    <>
      <RecruitHeader compact />
      <main className="recruit-page">
        <p className="recruit-eyebrow">DOWNLOAD</p>
        <h1>YOUR POWR RECRUIT TOOLKIT</h1>
        <p className="recruit-lead">
          This launch bundle currently includes nine practical toolkit files:
          written guides/templates in Markdown plus a recruiting tracker CSV.
          The current ZIP is a real downloadable starter package and can later
          be upgraded to polished PDF/XLSX deliverables.
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
            <a
              href={toolkitZipPath}
              className="recruit-btn recruit-btn-primary"
              download
              onClick={() =>
                trackRecruitEvent("recruit_download", { action: "zip_click" })
              }
            >
              Download ZIP now
            </a>
            <Link href="/recruit" className="recruit-btn recruit-btn-secondary">
              Back to landing
            </Link>
          </div>
        </div>
      </main>
      <RecruitFooter />
    </>
  );
}
