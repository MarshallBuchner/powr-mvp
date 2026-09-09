"use client";

import { useEffect, useState } from "react";
import { PRIMARY_CTA } from "../lib/content";
import CheckoutButton from "./CheckoutButton";

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
      <CheckoutButton
        source="sticky"
        className="recruit-btn recruit-btn-primary"
      >
        {PRIMARY_CTA}
      </CheckoutButton>
    </div>
  );
}
