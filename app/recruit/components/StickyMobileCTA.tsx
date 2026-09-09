"use client";

import { useEffect, useState } from "react";
import { PRIMARY_CTA } from "../lib/content";
import { handleCheckout } from "../lib/checkout";

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.55);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`recruit-sticky-cta${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        className="recruit-btn recruit-btn-primary"
        tabIndex={visible ? 0 : -1}
        onClick={() => void handleCheckout("sticky")}
      >
        {PRIMARY_CTA}
      </button>
    </div>
  );
}
