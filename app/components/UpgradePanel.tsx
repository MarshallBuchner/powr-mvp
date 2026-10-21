"use client";

import { useState } from "react";
import Link from "next/link";
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
  variant?: "default" | "progress" | "pricing";
};

export default function UpgradePanel({
  source,
  remaining,
  compact = false,
  variant = "default",
}: Props) {
  const [loading, setLoading] = useState(false);
  const isProgressOffer = variant !== "default";
  const offerHeading = variant === "pricing"
    ? "Make your next assessment count."
    : "Your first assessment is just the beginning.";

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

      const data = (await response.json()) as {
        url?: string;
        error?: string;
        loginUrl?: string;
      };

      if (response.status === 401 || data.error === "sign_in_required") {
        window.location.assign(
          data.loginUrl || "/login?next=%2F%23start-assessment",
        );
        return;
      }

      window.location.assign(data.url || "/unlock?preview=1");
    } catch (error) {
      console.error("POWR assessment checkout failed", error);
      window.location.assign("/unlock?preview=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`upgrade-panel${compact ? " is-compact" : ""}${isProgressOffer ? " upgrade-panel-progress" : ""}`}>
      <p className="upgrade-eyebrow">
        {isProgressOffer ? "BUILD ON YOUR BASELINE" : "UNLOCK MORE ASSESSMENTS"}
      </p>
      <h3>
        {isProgressOffer
          ? offerHeading
          : remaining > 0
          ? `${remaining} assessment${remaining === 1 ? "" : "s"} left`
          : "You’ve used your free assessment"}
      </h3>
      {isProgressOffer ? (
        <>
          <p>
            {variant === "pricing"
              ? "Turn your feedback into focused practice, then reassess to see what’s changed."
              : "You now know where your skating stands. The next step is measuring how much you improve."}
          </p>
          {variant === "progress" ? (
            <p>Train with your feedback, come back in two weeks, and see what&apos;s changed.</p>
          ) : null}
          <p className="upgrade-pack-details">
            <strong>{ASSESSMENT_PACK_CREDITS} assessments. {ASSESSMENT_PACK_PRICE_CAD}.</strong>
            <span>One-time purchase. No subscription.</span>
          </p>
        </>
      ) : (
        <p>
          Keep training with a one-time pack of {ASSESSMENT_PACK_CREDITS} skating
          assessments for {ASSESSMENT_PACK_PRICE_CAD}. No subscription.
        </p>
      )}
      <button
        type="button"
        className="primary-button"
        onClick={() => void startCheckout()}
        disabled={loading}
      >
        {loading
          ? "Opening checkout..."
          : isProgressOffer
            ? "Track My Progress →"
            : `Get ${ASSESSMENT_PACK_CREDITS} assessments — ${ASSESSMENT_PACK_PRICE_CAD}`}
      </button>
      {variant === "progress" ? (
        <Link href="/pricing" className="upgrade-details-link">See how the assessment pack works</Link>
      ) : null}
    </div>
  );
}
