import { Suspense } from "react";
import type { Metadata } from "next";
import LiveShareReport from "./LiveShareReport";

export const metadata: Metadata = {
  title: "POWR Skating Assessment",
  description:
    "A shared POWR skating assessment with scores, coaching notes, and development drills.",
};

export default function LiveSharePage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <p className="eyebrow">POWR</p>
          <h1>Loading assessment…</h1>
        </main>
      }
    >
      <LiveShareReport />
    </Suspense>
  );
}
