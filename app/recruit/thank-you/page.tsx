"use client";

import Link from "next/link";
import { useEffect } from "react";
import RecruitHeader from "../components/RecruitHeader";
import RecruitFooter from "../components/RecruitFooter";
import { trackRecruitEvent } from "../lib/analytics";

export default function ThankYouPage() {
  useEffect(() => {
    trackRecruitEvent("recruit_purchase", { preview: true });
  }, []);

  return (
    <>
      <RecruitHeader compact />
      <main className="recruit-page">
        <p className="recruit-eyebrow">YOU&apos;RE IN</p>
        <h1>THANKS — YOUR TOOLKIT IS READY.</h1>
        <p className="recruit-lead">
          Next step: download your POWR Recruit files and start with the START
          HERE guide. Build your profile first, then organize outreach and
          tracking.
        </p>

        <div className="recruit-page-card">
          <p className="recruit-panel-title">What happens next</p>
          <ol className="recruit-step-list">
            <li>
              <span>01</span>
              <p>Open the download page and save your toolkit files.</p>
            </li>
            <li>
              <span>02</span>
              <p>Follow the START HERE order of use (about 30–60 minutes).</p>
            </li>
            <li>
              <span>03</span>
              <p>Update your tracker as you contact programs.</p>
            </li>
          </ol>

          <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/recruit/download" className="recruit-btn recruit-btn-primary">
              Download toolkit
            </Link>
            <Link href="/" className="recruit-btn recruit-btn-secondary">
              Explore POWR assessment
            </Link>
          </div>
        </div>

        <div className="recruit-upsell">
          <h2>Optional: Recruiting Reel Review (+$30 CAD)</h2>
          <p>
            Want a second set of eyes on your recruiting tape? Get structured
            feedback on clip order, clarity, player identification, pacing, and
            overall presentation.
          </p>
          <button
            type="button"
            className="recruit-btn recruit-btn-secondary"
            onClick={() =>
              trackRecruitEvent("recruit_upsell_click", { offer: "reel_review" })
            }
          >
            Coming soon — notify me
          </button>
        </div>
      </main>
      <RecruitFooter />
    </>
  );
}
