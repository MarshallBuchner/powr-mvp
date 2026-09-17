"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PACK_PRICE_CAD,
} from "@/lib/assessmentBilling";
import { readCreatorRef } from "./assessmentEntitlements";

type Props = {
  source: string;
  remaining: number;
  compact?: boolean;
};

export default function UpgradePanel({ source, remaining, compact = false }: Props) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (loading) return;
    setLoading(true);
    track("upgrade_clicked", { source, remaining });

    try {
      const response = await fetch("/api/assessments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          ref: readCreatorRef(),
        }),
      });

      const data = (await response.json()) as { url?: string };
      window.location.assign(data.url || "/unlock?preview=1");
    } catch (error) {
      console.error("POWR assessment checkout failed", error);
      window.location.assign("/unlock?preview=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`upgrade-panel${compact ? " is-compact" : ""}`}>
      <p className="upgrade-eyebrow">UNLOCK MORE ASSESSMENTS</p>
      <h3>
        {remaining > 0
          ? `${remaining} assessment${remaining === 1 ? "" : "s"} left`
          : "You’ve used your free assessment"}
      </h3>
      <p>
        Keep training with a one-time pack of {ASSESSMENT_PACK_CREDITS} skating
        assessments for {ASSESSMENT_PACK_PRICE_CAD}. No subscription.
      </p>
      <button
        type="button"
        className="primary-button"
        onClick={() => void startCheckout()}
        disabled={loading}
      >
        {loading
          ? "Opening checkout..."
          : `Get ${ASSESSMENT_PACK_CREDITS} assessments — ${ASSESSMENT_PACK_PRICE_CAD}`}
      </button>
    </div>
  );
}
