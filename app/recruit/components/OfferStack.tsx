"use client";

import { useEffect, useRef } from "react";
import { offerIncludes, PRIMARY_CTA, PRICE } from "../lib/content";
import { handleCheckout } from "../lib/checkout";
import { trackRecruitEvent } from "../lib/analytics";

export default function OfferStack() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          trackRecruitEvent("recruit_offer_view");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="recruit-section" id="offer" ref={ref}>
      <div className="recruit-offer">
        <div>
          <p className="recruit-eyebrow">THE OFFER</p>
          <h2>THE COMPLETE POWR RECRUIT TOOLKIT</h2>
          <p className="recruit-price">{PRICE}</p>
          <p className="recruit-micro offer-micro">
            One-time purchase • Instant access • Lifetime access to your files
          </p>
          <button
            type="button"
            className="recruit-btn recruit-btn-primary"
            onClick={() => void handleCheckout("offer")}
          >
            {PRIMARY_CTA}
          </button>
          <p className="recruit-guarantee">
            Use it for 14 days. If it isn&apos;t useful, request a refund.
          </p>
        </div>
        <ul className="recruit-offer-list">
          {offerIncludes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
