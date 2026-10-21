import type { Metadata } from "next";
import Link from "next/link";
import UpgradePanel from "../components/UpgradePanel";

export const metadata: Metadata = {
  title: "Track Your Skating Progress | POWR Pricing",
  description:
    "Assess, train, reassess, and see what’s changed. Five skating assessments for $19 CAD. One-time purchase, no subscription. Your first assessment is free.",
};

const progression = [
  ["Assess", "Start with a clear picture of your skating and the priorities to work on."],
  ["Train", "Bring your feedback and recommended drills into focused practice."],
  ["Reassess", "Come back in two weeks with a similar clip to see what’s changed."],
  ["Track", "Save your reports to review your scores, feedback, and development over time."],
];

export default function PricingPage() {
  return (
    <main className="app-shell pricing-page">
      <header className="pricing-intro">
        <p className="eyebrow">POWR · YOUR NEXT CHAPTER</p>
        <h1>Five assessments. One goal: measurable improvement.</h1>
        <p className="section-description">
          One report gives you a baseline. Focused practice and regular reassessments
          help you see where your skating is changing — and what to work on next.
        </p>
      </header>

      <section aria-labelledby="pricing-progression-title">
        <h2 id="pricing-progression-title">A plan for your next few weeks</h2>
        <ol className="pricing-progression">
          {progression.map(([title, description], index) => (
            <li key={title}>
              <span className="pricing-step-number" aria-hidden="true">0{index + 1}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <UpgradePanel source="pricing" remaining={0} variant="pricing" />
      <p className="pricing-account-note">
        Purchases use your POWR account so your assessments stay with you.
        Already have assessments? <Link href="/#start-assessment">Use your next one</Link>.
      </p>

      <section className="pricing-free" aria-labelledby="pricing-free-title">
        <p className="eyebrow">START WITH YOUR FIRST REPORT</p>
        <h2 id="pricing-free-title">Your first assessment is free. The full report is yours.</h2>
        <p>No signup or payment required to see your first report. Create a free account whenever you want to save it.</p>
        <Link href="/#start-assessment" className="secondary-button">Try my free assessment →</Link>
      </section>
      <p className="pricing-footnote">POWR provides AI-assisted development feedback. Scores are estimates, and improvement depends on your practice and clip quality.</p>
    </main>
  );
}
