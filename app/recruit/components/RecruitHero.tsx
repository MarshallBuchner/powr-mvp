"use client";

import Link from "next/link";
import { PRIMARY_CTA, trustItems } from "../lib/content";
import { beginCheckout, CHECKOUT_PREVIEW_PATH } from "../lib/checkout";

export default function RecruitHero() {
  return (
    <section className="recruit-hero" aria-labelledby="recruit-hero-heading">
      <div className="recruit-hero-media" aria-hidden="true">
        <div className="recruit-hero-atmosphere" />
        <div className="recruit-hero-rink" />
        <div className="recruit-hero-grain" />
      </div>

      <div className="recruit-hero-content">
        <p className="recruit-brand-mark">
          <span>POWR</span> Recruit
        </p>
        <p className="recruit-eyebrow">
          PREPARE • PRESENT • GET NOTICED • PLAY HIGHER
        </p>

        <h1 id="recruit-hero-heading">
          STOP SENDING COACHES RANDOM CLIPS
          <span>AND HOPING THEY NOTICE.</span>
        </h1>

        <p className="recruit-hero-sub">
          POWR Recruit gives hockey players and parents the tools to build a
          professional player profile, organize recruiting outreach, create a
          stronger highlight reel, and track every opportunity.
        </p>

        <div className="recruit-hero-actions">
          <Link
            href={CHECKOUT_PREVIEW_PATH}
            className="recruit-btn recruit-btn-primary"
            onClick={() => beginCheckout("hero")}
          >
            {PRIMARY_CTA}
          </Link>
          <a className="recruit-btn recruit-btn-secondary" href="#whats-inside">
            SEE WHAT&apos;S INSIDE
          </a>
        </div>

        <p className="recruit-micro">
          One-time purchase • Instant access • No subscription
        </p>

        <ul className="recruit-trust-inline">
          {trustItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
