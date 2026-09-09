import { trustItems } from "../lib/content";
import CheckoutButton from "./CheckoutButton";

export default function RecruitHero() {
  return (
    <section className="recruit-hero" aria-labelledby="recruit-hero-heading">
      <div className="recruit-hero-media" aria-hidden="true">
        <div className="recruit-hero-atmosphere" />
        <div className="recruit-hero-rink" />
        <div className="recruit-hero-grain" />
      </div>

      <div className="recruit-hero-content recruit-hero-grid">
        <div className="recruit-hero-copy-block">
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
            <CheckoutButton source="hero" className="recruit-btn recruit-btn-primary">
              GET POWR RECRUIT — $39 CAD
            </CheckoutButton>
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

        <div className="recruit-hero-visual">
          <div className="recruit-hero-note recruit-note-left">Your kid wants to play at the next level...</div>
          <div className="recruit-hero-note recruit-note-right">Same game. Bigger opportunities.</div>

          <div className="recruit-device-card recruit-device-desktop">
            <div className="recruit-device-top">
              <span>POWR Recruit</span>
              <span>The hockey recruiting toolkit</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/recruit/01a086b4-f40a-7723-8d6c-9f1222065a68.jpg"
              alt="POWR Recruit product mockup"
              className="recruit-device-image"
            />
          </div>

          <div className="recruit-device-card recruit-device-mobile">
            <div className="recruit-mobile-frame">
              <div className="recruit-mobile-top">
                <span />
                <span />
                <span />
              </div>
              <p className="recruit-mobile-brand">POWR Recruit</p>
              <p className="recruit-mobile-headline">Same player. Better presentation.</p>
              <ul className="recruit-mobile-points">
                <li>Player profile</li>
                <li>Coach templates</li>
                <li>Recruiting tracker</li>
                <li>Roadmap</li>
              </ul>
              <div className="recruit-mobile-cta">$39 CAD one-time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
