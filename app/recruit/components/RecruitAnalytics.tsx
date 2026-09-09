"use client";

import { useEffect } from "react";
import { trackRecruitEvent } from "../lib/analytics";

export default function RecruitAnalytics() {
  useEffect(() => {
    trackRecruitEvent("recruit_view");

    let fired = false;
    function onScroll() {
      if (fired) return;
      const doc = document.documentElement;
      const scrolled =
        (window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1);
      if (scrolled >= 0.5) {
        fired = true;
        trackRecruitEvent("recruit_scroll_50");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
