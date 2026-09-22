import type { Metadata } from "next";
import Link from "next/link";

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
      <p className="legal-updated">Last updated: September 22, 2026</p>
      <p className="legal-lead">
        This policy explains how POWR (“we”, “us”) handles information when you
        use trainwithpowr.com and related POWR products, including skating
        assessments and POWR Recruit. It is written to match how the product
        works today — not as a marketing promise.
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
            <strong>compressed still frames</strong> to our analysis provider.
          </li>
          <li>
            If you save a report, we store{" "}
            <strong>analysis text and scores</strong> (not the video clip).
          </li>
          <li>
            Share links can make a saved report viewable by anyone who has the
            link.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Skating videos</h2>
        <p>
          When you choose a video for assessment, the file remains on your
          device for preview and local frame sampling. We do not upload the
          original video file to POWR servers or Supabase storage, and we do not
          attach the video blob to a saved assessment.
        </p>
        <p>
          Because the video is never stored by POWR, there is no separate
          “delete video” control in the product.
        </p>
      </section>

      <section className="legal-section">
        <h2>Analysis frames</h2>
        <p>
          During analysis, POWR samples a handful of compressed JPEG frames from
          your clip on your device, then sends those frames to our analysis API.
          Today that analysis is performed using OpenAI’s models. Frames are used
          to generate your skating assessment.
        </p>
        <p>
          We do not store those frames in our database with your account. Some
          evidence thumbnails may be kept temporarily in your browser’s{" "}
          <code>sessionStorage</code> so the report can show what was evaluated
          during the current session.
        </p>
        <p>
          We do <strong>not</strong> use your skating video to train POWR’s own
          models. Frames are processed by a third-party AI provider to produce
          your report; that provider’s handling of data is governed by its own
          terms and policies. We do not publish a separate AI-training retention
          schedule beyond what is described here.
        </p>
      </section>

      <section className="legal-section">
        <h2>Saved assessments</h2>
        <p>
          If you create an account and save a report (or save while signed in),
          POWR stores report data such as:
        </p>
        <ul>
          <li>Assessment focus / goal</li>
          <li>Original file name and duration (if available)</li>
          <li>Analysis JSON (scores, notes, drill suggestions, and related text)</li>
          <li>Overall score</li>
          <li>Account identifiers needed to associate the report with you</li>
        </ul>
        <p>
          Saved assessments are listed in <Link href="/assessments">My assessments</Link>{" "}
          and can be opened at a stable link like <code>/r/[id]</code>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Sharing and public links</h2>
        <p>
          Guest or unsaved reports may be shared as a URL that encodes the
          analysis payload in the link itself (<code>/r?d=…</code>). Anyone with
          that URL can view the report content in the link.
        </p>
        <p>
          Saved report links (<code>/r/[id]</code>) are designed so anyone with
          the link can open the assessment JSON for that id. Treat share links
          like anything you would only send to people you trust.
        </p>
      </section>

      <section className="legal-section">
        <h2>Accounts and authentication</h2>
        <p>
          Optional accounts use email one-time passcodes through Supabase Auth.
          When you sign in, we may store your email and profile fields needed for
          sign-in, assessment history, and entitlement balance (including free and
          purchased assessment credits).
        </p>
        <p>
          Guests can still run assessments. Guest entitlement state may be stored
          in a browser cookie and/or local storage on your device until you sign
          in and merge it into your account.
        </p>
      </section>

      <section className="legal-section">
        <h2>Payments</h2>
        <p>
          Paid assessment packs and POWR Recruit purchases are processed by
          Stripe. We receive payment-related metadata needed to fulfill an order
          (for example, granting assessment credits or unlocking a download). We
          do not store full payment card numbers on POWR servers.
        </p>
      </section>

      <section className="legal-section">
        <h2>POWR Recruit</h2>
        <p>
          POWR Recruit is a separate purchase/download flow and does not require
          a POWR assessment account. Checkout is handled by Stripe. Recruit pages
          do not upload skating videos for AI assessment as part of the toolkit
          purchase itself.
        </p>
      </section>

      <section className="legal-section">
        <h2>Analytics</h2>
        <p>
          We use Vercel Analytics for product usage events (for example, when
          someone starts an assessment or opens a report). These events help us
          understand product usage. They are not a copy of your skating video.
        </p>
      </section>

      <section className="legal-section">
        <h2>Service providers</h2>
        <p>Depending on the feature you use, information may be processed by:</p>
        <ul>
          <li>
            <strong>Vercel</strong> — hosting and analytics
          </li>
          <li>
            <strong>Supabase</strong> — authentication and assessment/profile
            database
          </li>
          <li>
            <strong>OpenAI</strong> — frame analysis for skating assessments
          </li>
          <li>
            <strong>Stripe</strong> — payments and checkout
          </li>
        </ul>
        <p>
          Those providers process data under their own terms when you use the
          related features.
        </p>
      </section>

      <section className="legal-section">
        <h2>Retention and deletion</h2>
        <p>
          Video files are not retained by POWR because they are not uploaded to
          our storage. Analysis frames are sent for processing and are not saved
          as assessment records.
        </p>
        <p>
          Saved assessment rows remain in your account history until removed.
          In-app deletion of saved reports is not available yet. If you want a
          saved report removed, contact us using the support options published on{" "}
          <a href="https://trainwithpowr.com">trainwithpowr.com</a> and include
          the report link or assessment id when possible.
        </p>
        <p>
          If your authentication account is deleted in our auth provider, related
          profile and assessment rows configured with cascade delete are removed
          with that account. Self-serve account deletion in the POWR UI is not
          available yet.
        </p>
        <p>
          Browser-only data (pending save payloads, evidence thumbnails, guest
          entitlement keys) can be cleared by signing out where applicable,
          completing or abandoning the session, or clearing site data in your
          browser.
        </p>
      </section>

      <section className="legal-section">
        <h2>Children</h2>
        <p>
          POWR is built for hockey player development and is often used by
          families and older athletes. It is not directed at children under 13,
          and we do not knowingly collect personal information from children
          under 13. If you believe a child under 13 has provided personal
          information, contact us so we can help delete it.
        </p>
      </section>

      <section className="legal-section">
        <h2>Changes to this policy</h2>
        <p>
          As POWR adds features (for example, in-app deletion or different
          storage), we may update this page. The “Last updated” date at the top
          will change when we do. Continued use of POWR after an update means
          you accept the revised policy.
        </p>
      </section>

      <section className="legal-section">
        <h2>Contact</h2>
        <p>
          Privacy questions and deletion requests: use the support options
          published on{" "}
          <a href="https://trainwithpowr.com">trainwithpowr.com</a>, or reply
          through the channel you already use with the POWR team. Please include
          enough detail for us to find the relevant account or report.
        </p>
      </section>

      <p className="legal-back">
        <Link href="/">← Back to POWR</Link>
        {" · "}
        <Link href="/#start-assessment">Start assessment</Link>
      </p>
    </main>
  );
}
