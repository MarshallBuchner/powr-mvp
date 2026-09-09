"use client";

import { PRIMARY_CTA, trustItems } from "../lib/content";
import { handleCheckout } from "../lib/checkout";
import { trackRecruitEvent } from "../lib/analytics";

export default function RecruitHero() {
  return (
    <section className="recruit-hero" aria-labelledby="recruit-hero-heading">
      <div className="recruit-hero-media" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="recruit-hero-photo"
          src="/recruit/01a086b4-f428-74b6-b1ab-5e4badd8a8b6.jpg"
          alt=""
        />
        <div className="recruit-hero-veil" />
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
          <button
            type="button"
            className="recruit-btn recruit-btn-primary"
            onClick={() => {
              trackRecruitEvent("recruit_cta_click", { source: "hero" });
              void handleCheckout("hero");
            }}
          >
            {PRIMARY_CTA}
          </button>
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
