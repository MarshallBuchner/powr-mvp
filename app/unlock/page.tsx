"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import { ASSESSMENT_PACK_CREDITS } from "@/lib/assessmentBilling";

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

function UnlockClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">(
    "loading",
  );
  const [remaining, setRemaining] = useState(0);
  const [creditsGranted, setCreditsGranted] = useState(ASSESSMENT_PACK_CREDITS);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const preview = searchParams.get("preview");
    const query = preview
      ? "preview=1"
      : sessionId
        ? `session_id=${encodeURIComponent(sessionId)}`
        : "";

    void (async () => {
      try {
        if (!query) {
          setStatus("error");
          return;
        }
        let data: VerifyResult = {};
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const res = await fetch(`/api/assessments/verify?${query}`, { cache: "no-store" });
          data = (await res.json()) as VerifyResult;
          if (!res.ok || !data.paid) {
            setStatus("error");
            return;
          }
          if (!data.awaitingWebhook) break;
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
        }
        if (data.awaitingWebhook) {
          setStatus("pending");
          return;
        }
        setCreditsGranted(data.creditsGranted || ASSESSMENT_PACK_CREDITS);
        setRemaining(data.remaining || 0);
        setStatus("success");
        track("assessment_pack_unlocked", {
          preview: Boolean(data.preview),
          credits: data.creditsGranted || ASSESSMENT_PACK_CREDITS,
          source: data.source || "device",
        });
      } catch (error) {
        console.error("POWR unlock verify failed", error);
        setStatus("error");
      }
    })();
  }, [searchParams]);

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
            <Link href="/assessments" className="secondary-button unlock-secondary">
              My assessments
            </Link>
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

      {status === "error" ? (
        <>
          <h1>Couldn&apos;t confirm payment</h1>
          <p className="section-description">
            If you were charged, email support with your receipt. Please refresh this page or contact support before purchasing again.
          </p>
          <div className="unlock-actions">
            <Link href="/#start-assessment" className="primary-button">
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
