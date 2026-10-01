"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PACK_PRICE_CAD,
} from "@/lib/assessmentBilling";
import {
  buildCheckoutPath,
  clearCheckoutReturnPath,
  readCheckoutReturnPath,
} from "@/lib/checkoutIntent";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

type VerifyResult = {
  paid?: boolean;
  preview?: boolean;
  creditsGranted?: number;
  remaining?: number;
  awaitingWebhook?: boolean;
  source?: "profile" | "device";
  entitlements?: {
    freeUsed: number;
    credits: number;
    unlockedSessionIds: string[];
  };
  reason?: string;
};

type UnlockStatus =
  | "loading"
  | "success"
  | "pending"
  | "error"
  | "cancelled"
  | "failed";

function UnlockClient() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "upgrade";
  const sessionId = searchParams.get("session_id");
  const checkoutState = searchParams.get("checkout");

  const mode = useMemo(() => {
    if (checkoutState === "cancelled") return "cancelled" as const;
    if (checkoutState === "failed") return "failed" as const;
    // Legacy preview unlock is disabled — never treat it as a purchase.
    if (
      searchParams.has("preview") ||
      sessionId === "preview" ||
      !sessionId
    ) {
      return "failed" as const;
    }
    return "verify" as const;
  }, [checkoutState, searchParams, sessionId]);

  const [verifyStatus, setVerifyStatus] = useState<
    "loading" | "success" | "pending" | "error"
  >("loading");
  const [remaining, setRemaining] = useState(0);
  const [creditsGranted, setCreditsGranted] = useState(ASSESSMENT_PACK_CREDITS);
  const reportReturnPath = useSyncExternalStore(
    () => () => {},
    () => readCheckoutReturnPath(),
    () => null,
  );

  useEffect(() => {
    if (mode !== "verify" || !sessionId) return;

    let cancelled = false;

    void (async () => {
      try {
        let data: VerifyResult = {};
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const res = await fetch(
            `/api/assessments/verify?session_id=${encodeURIComponent(sessionId)}`,
            { cache: "no-store" },
          );
          data = (await res.json()) as VerifyResult;
          if (cancelled) return;
          if (!res.ok || !data.paid) {
            setVerifyStatus("error");
            return;
          }
          if (!data.awaitingWebhook) break;
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
          if (cancelled) return;
        }
        if (cancelled) return;
        if (data.awaitingWebhook) {
          setVerifyStatus("pending");
          return;
        }
        setCreditsGranted(data.creditsGranted || ASSESSMENT_PACK_CREDITS);
        setRemaining(data.remaining || 0);
        setVerifyStatus("success");
        track("assessment_pack_unlocked", {
          preview: false,
          credits: data.creditsGranted || ASSESSMENT_PACK_CREDITS,
          source: data.source || "device",
        });
      } catch (error) {
        if (cancelled) return;
        console.error("POWR unlock verify failed", error);
        setVerifyStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, sessionId]);

  const status: UnlockStatus = mode === "verify" ? verifyStatus : mode;
  const retryHref = buildCheckoutPath(source);

  return (
    <main className="app-shell unlock-page">
      <p className="eyebrow">POWR ASSESSMENTS</p>
      {status === "loading" ? (
        <>
          <h1>Confirming your pack…</h1>
          <p className="section-description">Hang tight while we unlock assessments.</p>
        </>
      ) : null}

      {status === "success" ? (
        <>
          <h1>You&apos;re unlocked.</h1>
          <p className="section-description">
            Added {creditsGranted} skating assessments
            {remaining ? ` · ${remaining} total remaining` : ""}. One-time pack
            — no subscription.
          </p>
          <div className="unlock-actions">
            <Link href="/#start-assessment" className="primary-button">
              Analyze another clip →
            </Link>
            {reportReturnPath ? (
              <Link
                href={reportReturnPath}
                className="secondary-button unlock-secondary"
                onClick={() => clearCheckoutReturnPath()}
              >
                Back to your report
              </Link>
            ) : (
              <Link
                href="/assessments"
                className="secondary-button unlock-secondary"
              >
                My assessments
              </Link>
            )}
          </div>
        </>
      ) : null}

      {status === "pending" ? (
        <>
          <h1>Payment received. Adding your credits…</h1>
          <p className="section-description">
            Your payment is confirmed. Please refresh this page shortly to check your credits.
            You do not need to purchase again.
          </p>
        </>
      ) : null}

      {status === "cancelled" ? (
        <>
          <h1>Checkout cancelled</h1>
          <p className="section-description">
            No charge was completed. Your assessment balance is unchanged.
          </p>
          <p className="section-description">
            You can retry anytime — {ASSESSMENT_PACK_CREDITS} assessments for{" "}
            {ASSESSMENT_PACK_PRICE_CAD}, one-time.
          </p>
          <div className="unlock-actions">
            <Link href={retryHref} className="primary-button">
              Retry checkout →
            </Link>
            {reportReturnPath ? (
              <Link
                href={reportReturnPath}
                className="secondary-button unlock-secondary"
              >
                Back to your report
              </Link>
            ) : (
              <Link
                href="/#start-assessment"
                className="secondary-button unlock-secondary"
              >
                Back to assessment
              </Link>
            )}
          </div>
        </>
      ) : null}

      {status === "failed" ? (
        <>
          <h1>Checkout didn&apos;t start</h1>
          <p className="section-description">
            No charge was completed. This usually means checkout couldn&apos;t be
            opened — not that a payment failed.
          </p>
          <p className="section-description">
            Try again, or email{" "}
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> if it keeps happening.
          </p>
          <div className="unlock-actions">
            <Link href={retryHref} className="primary-button">
              Retry checkout →
            </Link>
            <Link
              href="/#start-assessment"
              className="secondary-button unlock-secondary"
            >
              Back to assessment
            </Link>
          </div>
        </>
      ) : null}

      {status === "error" ? (
        <>
          <h1>Couldn&apos;t confirm payment</h1>
          <p className="section-description">
            If you were charged, email{" "}
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> with your receipt
            before purchasing again. You can also refresh this page to re-check
            credit delivery.
          </p>
          <div className="unlock-actions">
            <Link href={retryHref} className="primary-button">
              Retry checkout →
            </Link>
            <Link
              href="/#start-assessment"
              className="secondary-button unlock-secondary"
            >
              Back to assessment
            </Link>
          </div>
        </>
      ) : null}
    </main>
  );
}

export default function UnlockPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell unlock-page">
          <p className="eyebrow">POWR ASSESSMENTS</p>
          <h1>Confirming your pack…</h1>
        </main>
      }
    >
      <UnlockClient />
    </Suspense>
  );
}
