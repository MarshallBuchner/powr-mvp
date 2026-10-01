"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { readCreatorRef } from "@/app/components/assessmentEntitlements";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PACK_PRICE_CAD,
} from "@/lib/assessmentBilling";
import {
  buildCheckoutLoginUrl,
  unlockFailedPath,
} from "@/lib/checkoutIntent";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "upgrade";
  const { configured, loading, user } = useAuth();
  const [message, setMessage] = useState("Preparing secure checkout…");
  const startedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!configured) return;

    if (!user) {
      router.replace(buildCheckoutLoginUrl(source));
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        setMessage("Opening Stripe Checkout…");
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
          router.replace(data.loginUrl || buildCheckoutLoginUrl(source));
          return;
        }

        if (!response.ok || !data.url) {
          window.location.assign(unlockFailedPath(source));
          return;
        }

        window.location.assign(data.url);
      } catch (err) {
        console.error("POWR checkout resume failed", err);
        window.location.assign(unlockFailedPath(source));
      }
    })();
  }, [configured, loading, user, router, source]);

  if (!loading && !configured) {
    return (
      <main className="app-shell unlock-page">
        <p className="eyebrow">POWR CHECKOUT</p>
        <h1>Checkout unavailable</h1>
        <p className="section-description">
          Purchases are not configured in this environment.
        </p>
        <p className="section-description">
          Need help? <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        </p>
        <div className="unlock-actions">
          <Link href="/#start-assessment" className="primary-button">
            Back to assessment
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell unlock-page">
      <p className="eyebrow">POWR CHECKOUT</p>
      <h1>Continue to purchase</h1>
      <p className="section-description">
        {ASSESSMENT_PACK_CREDITS} assessments for {ASSESSMENT_PACK_PRICE_CAD} —
        one-time, no subscription.
      </p>
      <p className="section-description">{message}</p>
      {!user && !loading ? (
        <div className="unlock-actions">
          <Link
            href={buildCheckoutLoginUrl(source)}
            className="primary-button"
          >
            Sign in to continue →
          </Link>
        </div>
      ) : null}
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell unlock-page">
          <p className="eyebrow">POWR CHECKOUT</p>
          <h1>Preparing checkout…</h1>
        </main>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
