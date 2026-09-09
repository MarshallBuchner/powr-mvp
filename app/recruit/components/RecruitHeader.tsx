"use client";

import Link from "next/link";
import { PRIMARY_CTA } from "../lib/content";
import { beginCheckout, CHECKOUT_PREVIEW_PATH } from "../lib/checkout";

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

        <Link
          href={CHECKOUT_PREVIEW_PATH}
          className="recruit-btn recruit-btn-primary recruit-header-cta"
          onClick={() => beginCheckout("header")}
        >
          {PRIMARY_CTA}
        </Link>
      </div>
    </header>
  );
}
