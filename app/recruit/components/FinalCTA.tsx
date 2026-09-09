"use client";

import Link from "next/link";
import { PRIMARY_CTA } from "../lib/content";
import { beginCheckout, CHECKOUT_PREVIEW_PATH } from "../lib/checkout";

export default function FinalCTA() {
  return (
    <section className="recruit-section recruit-final" id="final-cta">
      <p className="recruit-eyebrow">READY</p>
      <h2>GOOD PLAYERS DESERVE A PROFESSIONAL PLAN.</h2>
      <p className="recruit-lead">
        Get organized. Present yourself better. Make it easier for coaches to
        evaluate you.
      </p>
      <Link
        href={CHECKOUT_PREVIEW_PATH}
        className="recruit-btn recruit-btn-primary"
        onClick={() => beginCheckout("final")}
      >
        {PRIMARY_CTA}
      </Link>
    </section>
  );
}
