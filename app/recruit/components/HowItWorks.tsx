import { howItWorks } from "../lib/content";

export default function HowItWorks() {
  return (
    <section className="recruit-section" id="how-it-works">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">HOW IT WORKS</p>
        <h2>A CLEAR SYSTEM FROM DAY ONE.</h2>
      </div>
      <ol className="recruit-how-grid">
        {howItWorks.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
