"use client";

import { faqItems } from "../lib/content";

export default function FAQ() {
  return (
    <section className="recruit-section" id="faq">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">FAQ</p>
        <h2>STRAIGHT ANSWERS.</h2>
      </div>
      <div className="recruit-faq">
        {faqItems.map((item) => (
          <details key={item.q} className="recruit-faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
