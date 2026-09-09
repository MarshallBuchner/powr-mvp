"use client";

import { productCards } from "../lib/content";

export default function WhatsInside() {
  return (
    <section id="whats-inside" className="recruit-section">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">WHAT&apos;S INSIDE</p>
        <h2>EVERYTHING YOU NEED TO PRESENT YOURSELF PROPERLY.</h2>
      </div>

      <div className="recruit-product-grid">
        {productCards.map((card) => (
          <article key={card.id} className="recruit-product-card">
            <div className="recruit-product-top">
              <span className="recruit-included">Included</span>
              <div className="recruit-product-icon" aria-hidden="true">
                <span />
              </div>
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <div className="recruit-mini-preview" aria-hidden="true">
              {card.preview.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
