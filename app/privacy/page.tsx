import type { Metadata } from "next";
import Link from "next/link";
import {
  OPERATOR_IDENTITY,
  SITE_CANONICAL_URL,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from "@/lib/support";

export const metadata: Metadata = {
  title: "Privacy Policy | POWR",
  description:
    "How POWR handles skating videos, analysis frames, accounts, and saved assessments.",
};

export default function PrivacyPage() {
  return (
    <main className="app-shell legal-page">
      <p className="eyebrow">POWR LEGAL</p>
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: September 27, 2026</p>
      <p className="legal-lead">
        This policy explains how {OPERATOR_IDENTITY} (“POWR”, “we”, “us”) handles
        information when you use {SITE_CANONICAL_URL} and POWR skating assessment
        services. It is written to match how the product works today.
      </p>
      <p className="legal-lead">
        Privacy questions and requests:{" "}
        <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
      </p>

      <section className="legal-section">
        <h2>Quick summary</h2>
        <ul>
          <li>
            Your <strong>full skating video file stays on your device</strong>.
            POWR does not upload it to our storage or save it with your account.
          </li>
          <li>
            To build a report, POWR sends a small set of{" "}
            <strong>compressed still frames</strong> to our analysis provider
            (currently OpenAI). On-device pose estimates may also be computed in
            your browser.
          </li>
          <li>
            OpenAI API/business data is{" "}
            <strong>not used to train OpenAI models by default</strong> unless a
            customer explicitly opts in. We do not use your video to train POWR’s
            own models.
          </li>
          <li>
            If you save a report, we store{" "}
            <strong>analysis text and scores</strong> (not the video clip).
            Reports are private by default; share links use opaque tokens.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Who we are</h2>
        <p>{OPERATOR_IDENTITY}</p>
        <p>
          Contact: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        </p>
      </section>

      <section className="legal-section">
        <h2>Data we collect and why</h2>
        <ul>
          <li>
            <strong>Video file (on device):</strong> selected so you can preview
            the clip and so the browser can sample frames. Not uploaded to POWR
            storage.
          </li>
          <li>
            <strong>Sampled frames:</strong> sent to generate your assessment.
            Needed to evaluate visible skating mechanics.
          </li>
          <li>
            <strong>Pose landmarks (optional, on device):</strong> computed in
            the browser for Analysis Lab overlay. Not required for scoring to
            complete; failures degrade gracefully.
          </li>
          <li>
            <strong>Assessment inputs:</strong> focus/goal, file name, duration —
            to run and label your report.
          </li>
          <li>
            <strong>Analysis results:</strong> scores, notes, drills — to show
            your report and, if you save, to store history.
          </li>
          <li>
            <strong>Account data:</strong> email and auth identifiers via
            Supabase for sign-in, saved reports, and entitlement balance.
          </li>
          <li>
            <strong>Payment metadata:</strong> processed by Stripe to fulfill
            assessment credit purchases (we do not store full card numbers).
          </li>
          <li>
            <strong>Device entitlement keys:</strong> cookie/local storage for
            guest free/paid credits until merged into an account.
          </li>
          <li>
            <strong>Usage analytics:</strong> product events via Vercel Analytics
            to understand feature usage (not a copy of your video).
          </li>
          <li>
            <strong>Support messages:</strong> whatever you send to{" "}
            {SUPPORT_EMAIL} so we can help.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Skating videos and frames</h2>
        <p>
          When you choose a video, the file remains on your device for preview
          and local frame sampling. We do not upload the original video file to
          POWR servers or object storage, and we do not attach the video blob to
          a saved assessment.
        </p>
        <p>
          During analysis, POWR samples a handful of compressed JPEG frames and
          sends them to our analysis API (OpenAI) to produce your report. We set
          API options intended to avoid storing responses for model training
          where the provider supports that control. Provider policies may still
          apply to transient processing.
        </p>
      </section>

      <section className="legal-section">
        <h2>Saved assessments and sharing</h2>
        <p>
          If you save a report, POWR stores report data such as goal, file name,
          duration, analysis JSON, and overall score, tied to your account.
          Saved assessments are <strong>private by default</strong> and viewable
          by the signed-in owner at <code>/r/[id]</code>.
        </p>
        <p>
          Sharing creates an opaque tokenized link (<code>/r/s/[token]</code>).
          Anyone with an active link can view that report until it expires or is
          revoked. Guest share drafts may expire automatically. Do not treat a
          share link as private.
        </p>
        <p>
          Older legacy links that embedded analysis data in the URL may still
          open for compatibility; new reports do not use that method.
        </p>
      </section>

      <section className="legal-section">
        <h2>Service providers and cross-border processing</h2>
        <p>Depending on the feature you use, information may be processed by:</p>
        <ul>
          <li>
            <strong>Vercel</strong> — hosting and analytics
          </li>
          <li>
            <strong>Supabase</strong> — authentication and database
          </li>
          <li>
            <strong>OpenAI</strong> — frame analysis for skating assessments
          </li>
          <li>
            <strong>Stripe</strong> — payments
          </li>
        </ul>
        <p>
          These providers may process data in the United States or other
          countries. If you use POWR from Canada or elsewhere, your information
          may be processed across borders subject to those providers’ safeguards
          and applicable law.
        </p>
      </section>

      <section className="legal-section">
        <h2>Retention and deletion</h2>
        <p>
          Video files are not retained by POWR because they are not uploaded.
          Analysis frames are sent for processing and are not saved as assessment
          attachments.
        </p>
        <p>
          Saved assessment rows remain until you delete them (signed-in delete
          via My assessments / API) or request deletion at{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>. Share links can be
          revoked by the owner when signed in. Guest share drafts expire after a
          limited period.
        </p>
        <p>
          If your authentication account is deleted in our auth provider, related
          profile and assessment rows configured with cascade delete are removed
          with that account. Self-serve full account deletion in the POWR UI may
          still require support assistance.
        </p>
        <p>
          Browser-only data (pending save payloads, evidence thumbnails, guest
          entitlement keys) can be cleared by clearing site data in your browser.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your rights and choices</h2>
        <p>
          Subject to applicable law (including Canadian privacy law where it
          applies), you may request access, correction, deletion, or withdrawal
          of consent for processing that relies on consent. Contact{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>. You may also complain to
          your local privacy regulator if you believe we have not handled a
          request appropriately.
        </p>
      </section>

      <section className="legal-section">
        <h2>Children</h2>
        <p>
          POWR is not directed at children under 13. We do not knowingly allow
          under-13 self-service use. Ages 13–17 require parent/guardian
          permission. We avoid collecting unnecessary youth profile data beyond
          the eligibility acknowledgement needed to use the Service.
        </p>
      </section>

      <section className="legal-section">
        <h2>Changes</h2>
        <p>
          We may update this page as features change. The “Last updated” date
          will change when we do.
        </p>
      </section>

      <p className="legal-back">
        <Link href="/">← Back to POWR</Link>
        {" · "}
        <Link href="/terms">Terms of Service</Link>
      </p>
    </main>
  );
}
