"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PACK_PRICE_CAD,
} from "@/lib/assessmentBilling";
import {
  fetchEntitlementBalance,
  localGrantPack,
  syncEntitlementCookie,
  writeLocalEntitlements,
} from "../components/assessmentEntitlements";

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

async function waitForProfileCredits(expectedMinCredits: number) {
  for (let i = 0; i < 12; i += 1) {
    const balance = await fetchEntitlementBalance();
    if (balance && balance.credits >= expectedMinCredits) {
      return balance;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  return fetchEntitlementBalance();
}

function UnlockClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
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

    if (!query) {
      setStatus("error");
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/assessments/verify?${query}`);
        const data = (await res.json()) as VerifyResult;

        if (!data.paid) {
          setStatus("error");
          return;
        }

        let remainingBalance = data.remaining || 0;

        if (data.source === "profile") {
          // Webhook is source of truth — poll briefly if credits not visible yet.
          const balance = await waitForProfileCredits(1);
          if (balance) {
            remainingBalance = balance.remaining;
          }
        } else if (data.entitlements) {
          writeLocalEntitlements(data.entitlements);
          await syncEntitlementCookie(data.entitlements);
          remainingBalance = data.remaining || 0;
        } else if (sessionId || preview) {
          localGrantPack(sessionId || "preview", data.creditsGranted);
        }

        setCreditsGranted(data.creditsGranted || ASSESSMENT_PACK_CREDITS);
        setRemaining(remainingBalance);
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

      {status === "error" ? (
        <>
          <h1>Couldn&apos;t confirm payment</h1>
          <p className="section-description">
            If you were charged, email support with your receipt. You can also
            retry checkout for the {ASSESSMENT_PACK_CREDITS}-pack (
            {ASSESSMENT_PACK_PRICE_CAD}).
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
