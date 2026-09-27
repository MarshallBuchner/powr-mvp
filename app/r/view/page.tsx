"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import SharedReportView from "@/app/components/SharedReportView";
import { readLastReport } from "@/app/components/reportSession";

function subscribe() {
  return () => {};
}

function getSessionReport() {
  return readLastReport();
}

function getServerSnapshot() {
  return null;
}

/** Session-only report view used when tokenized sharing is unavailable. */
export default function SessionReportPage() {
  const request = useSyncExternalStore(
    subscribe,
    getSessionReport,
    getServerSnapshot,
  );

  if (request === undefined || request === null) {
    // First client paint may still be hydrating; treat null as missing.
    if (typeof window === "undefined") {
      return (
        <main className="app-shell">
          <p className="eyebrow">POWR</p>
          <h1>Loading assessment…</h1>
        </main>
      );
    }
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Assessment not found</h1>
        <p>
          This local report view only works in the same browser session right
          after analysis.
        </p>
        <p>
          <Link href="/#start-assessment">← Start assessment</Link>
        </p>
      </main>
    );
  }

  return <SharedReportView request={request} />;
}
