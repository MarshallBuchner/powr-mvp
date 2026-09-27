import type { Metadata } from "next";
import Link from "next/link";
import {
  OPERATOR_IDENTITY,
  SITE_CANONICAL_URL,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from "@/lib/support";

export const metadata: Metadata = {
  title: "Terms of Service | POWR",
  description:
    "Terms of Service for POWR skating assessments and related services.",
};

export default function TermsPage() {
  return (
    <main className="app-shell legal-page">
      <p className="eyebrow">POWR LEGAL</p>
      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated: September 27, 2026</p>
      <p className="legal-lead">
        These Terms govern your use of {SITE_CANONICAL_URL} and POWR skating
        assessment services (the “Service”). {OPERATOR_IDENTITY} By using POWR,
        you agree to these Terms and our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <section className="legal-section">
        <h2>1. Eligibility and age</h2>
        <p>
          You must be at least 13 years old to use POWR. If you are 13–17, you
          may use the Service only with permission from a parent or legal
          guardian who agrees to these Terms. Children under 13 may not create
          accounts or run self-service assessments.
        </p>
        <p>
          We do not provide a separate in-product parent authorization workflow
          yet. If you are under 13, do not use POWR. If you are a parent or
          guardian and believe a child under 13 has used POWR, contact{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Accounts</h2>
        <p>
          Accounts are optional for a first assessment and required to save
          history across devices. You are responsible for the email address you
          use to sign in and for activity under your account. Keep access to your
          email secure.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Upload unlawful, harmful, or infringing content</li>
          <li>Attempt to reverse engineer, overload, or disrupt the Service</li>
          <li>Misrepresent assessment results as medical or scouting advice</li>
          <li>Use the Service to harass others or violate applicable law</li>
          <li>
            Bypass payment, entitlement, age, or consent controls
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>4. Your content and license</h2>
        <p>
          You retain ownership of videos and other content you upload or provide.
          You grant POWR a limited license to process sampled frames and related
          data as needed to deliver the assessment you request, operate the
          Service, and comply with law. We do not claim ownership of your
          skating video file.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. AI-assisted assessments — limitations</h2>
        <p>
          POWR provides AI-assisted skating development feedback based on limited
          visual evidence (sampled frames and, when available, on-device pose
          estimates). Results are estimates for training and education. They are
          not:
        </p>
        <ul>
          <li>Medical advice or injury diagnosis/prevention</li>
          <li>Guaranteed performance improvement</li>
          <li>Official scouting, recruiting, or tryout evaluations</li>
          <li>A substitute for a qualified coach</li>
        </ul>
        <p>
          Accuracy can be affected by camera angle, lighting, clip length,
          occlusion, distance, video quality, and model confidence. Beta
          features may change as we improve the product.
        </p>
      </section>

      <section className="legal-section">
        <h2>6. Service availability</h2>
        <p>
          We aim to keep POWR available, but we do not guarantee uninterrupted
          or error-free operation. Features may be modified, paused, or
          discontinued. Maintenance, third-party outages (for example hosting,
          auth, AI, or payments), or force majeure may affect availability.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Payments, packs, and founder access</h2>
        <p>
          Paid assessment packs (currently advertised as a one-time purchase of
          assessment credits, such as 5 assessments for $19 CAD) are processed by
          Stripe. Prices and pack sizes may change; the checkout page controls
          the price you pay. Taxes may apply.
        </p>
        <p>
          Credits are consumed when an assessment analysis is successfully
          started under our entitlement rules. Founder or promotional unlimited
          access, if granted, is discretionary and may be revoked if misused.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Failed assessments and refunds</h2>
        <p>
          If an assessment fails because of a POWR system error after a credit
          was consumed, contact{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> with details (time, email,
          and receipt if purchased). We may, at our discretion, restore a credit
          or provide a comparable remedy. Refunds for digital assessment packs
          are generally not guaranteed once credits are delivered, except where
          required by law or when we determine a purchase failed to unlock
          access.
        </p>
      </section>

      <section className="legal-section">
        <h2>9. Sharing and privacy</h2>
        <p>
          Saved assessments are private by default. If you create a share link,
          anyone with that link can view the report until it expires or you
          revoke it. Do not share reports you are not comfortable making
          accessible to link holders. See the Privacy Policy for data details.
        </p>
      </section>

      <section className="legal-section">
        <h2>10. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM
          EXTENT PERMITTED BY LAW, WE DISCLAIM WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. AI OUTPUT MAY
          BE INCOMPLETE OR INCORRECT.
        </p>
      </section>

      <section className="legal-section">
        <h2>11. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, POWR AND ITS OPERATOR WILL NOT
          BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR FOR LOST PROFITS, LOST DATA, OR TRAINING OUTCOMES. OUR
          TOTAL LIABILITY FOR CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE
          GREATER OF (A) THE AMOUNT YOU PAID TO POWR FOR ASSESSMENT CREDITS IN
          THE 12 MONTHS BEFORE THE CLAIM OR (B) CAD $50.
        </p>
      </section>

      <section className="legal-section">
        <h2>12. Termination</h2>
        <p>
          You may stop using POWR at any time. We may suspend or terminate access
          if you violate these Terms, create risk for the Service or other users,
          or if required by law. Provisions that should survive (including
          ownership, disclaimers, and liability limits) will survive termination.
        </p>
      </section>

      <section className="legal-section">
        <h2>13. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of the Province of Alberta and the
          federal laws of Canada applicable there, without regard to conflict of
          law rules. Courts in Alberta will have exclusive jurisdiction, except
          where consumer protection law gives you mandatory rights in another
          forum.
        </p>
        <p>
          <strong>Note:</strong> Governing law and venue should be confirmed by
          counsel for your operating jurisdiction.
        </p>
      </section>

      <section className="legal-section">
        <h2>14. Changes</h2>
        <p>
          We may update these Terms as the product evolves. The “Last updated”
          date will change when we do. Continued use after an update means you
          accept the revised Terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>15. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        </p>
      </section>

      <p className="legal-back">
        <Link href="/">← Back to POWR</Link>
        {" · "}
        <Link href="/privacy">Privacy Policy</Link>
      </p>
    </main>
  );
}
