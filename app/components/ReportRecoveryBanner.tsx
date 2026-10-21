"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearLifecycle,
  getOrCreateDeviceKey,
  getRecoveryState,
  readLifecycle,
  readNavigationType,
  type RecoveryState,
} from "@/lib/labLifecycle";
import { sendLabBeacon } from "@/lib/labTelemetryClient";

/**
 * Homepage recovery: if the last live assessment completed (share link saved)
 * or was interrupted mid-request (e.g. iOS killed the tab), offer the report.
 * The interrupted lookup is replay-only: it never analyzes or charges.
 */
export default function ReportRecoveryBanner() {
  const router = useRouter();
  const [state, setState] = useState<RecoveryState>({ kind: "none" });
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const marker = readLifecycle();
    const recovery = getRecoveryState(marker);
    const navType = readNavigationType();
    sendLabBeacon(
      recovery.kind === "interrupted" ? "boot_after_interrupted_lab" : "boot",
      marker,
      { navType },
    );
    void Promise.resolve().then(() => setState(recovery));
  }, []);

  if (state.kind === "none") return null;

  async function checkInterrupted(attemptId: string) {
    setChecking(true);
    setMessage("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attemptId },
        body: JSON.stringify({ attemptId, deviceKey: getOrCreateDeviceKey(), replayOnly: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && typeof data.sharePath === "string") {
        router.push(data.sharePath);
        return;
      }
      if (res.status === 409 && data.error === "analysis_in_progress") {
        setMessage("Your assessment is still finishing. Try again in a few seconds.");
        return;
      }
      setMessage(
        "We couldn't find a saved report for that attempt. If your assessment count dropped, contact support and we'll make it right.",
      );
    } catch {
      setMessage("Couldn't reach POWR. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  function dismiss() {
    clearLifecycle();
    setState({ kind: "none" });
  }

  return (
    <aside className="report-recovery-banner" role="status">
      {state.kind === "completed" ? (
        <>
          <strong>Your last report is ready.</strong>
          <button type="button" className="primary-button" onClick={() => router.push(state.sharePath)}>
            Open your last report →
          </button>
        </>
      ) : (
        <>
          <strong>Your last assessment was interrupted.</strong>
          <button
            type="button"
            className="primary-button"
            disabled={checking}
            onClick={() => void checkInterrupted(state.attemptId)}
          >
            {checking ? "Checking…" : "Check for my report — no new charge"}
          </button>
        </>
      )}
      <button type="button" className="secondary-button" onClick={dismiss}>
        Dismiss
      </button>
      {message ? <p>{message}</p> : null}
    </aside>
  );
}
