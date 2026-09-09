"use client";

import Link from "next/link";
import { useEffect } from "react";
import RecruitHeader from "../components/RecruitHeader";
import RecruitFooter from "../components/RecruitFooter";
import { downloadFiles } from "../lib/content";
import { trackRecruitEvent } from "../lib/analytics";

/**
 * Delivery page for POWR Recruit toolkit files.
 * Gating/payment verification can be added later without redesigning this UI.
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
          Files will ship as <strong>POWR-Recruit-Toolkit.zip</strong>. Until
          checkout is wired, this page shows the package contents and download
          structure.
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
            <button
              type="button"
              className="recruit-btn recruit-btn-primary"
              onClick={() =>
                trackRecruitEvent("recruit_download", { action: "zip_click" })
              }
            >
              {/* TODO(payment): point to hosted zip after purchase verification */}
              Download ZIP (coming soon)
            </button>
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
