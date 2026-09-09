"use client";

import Link from "next/link";
import { PRIMARY_CTA } from "../lib/content";
import { handleCheckout } from "../lib/checkout";
import { trackRecruitEvent } from "../lib/analytics";

type Props = {
  compact?: boolean;
};

export default function RecruitHeader({ compact = false }: Props) {
  return (
    <header className={`recruit-header${compact ? " is-compact" : ""}`}>
      <div className="recruit-header-inner">
        <Link href="/recruit" className="recruit-logo" aria-label="POWR Recruit">
          <span className="recruit-logo-powr">POWR</span>
          <span className="recruit-logo-recruit">Recruit</span>
        </Link>

        <nav className="recruit-nav" aria-label="Recruit navigation">
          <a href="#whats-inside">What&apos;s inside</a>
          <a href="#offer">Offer</a>
          <a href="#faq">FAQ</a>
          <Link href="/recruit/sample-profile">Sample profile</Link>
        </nav>

        <button
          type="button"
          className="recruit-btn recruit-btn-primary recruit-header-cta"
          onClick={() => {
            trackRecruitEvent("recruit_cta_click", { source: "header" });
            void handleCheckout("header");
          }}
        >
          {PRIMARY_CTA}
        </button>
      </div>
    </header>
  );
}
