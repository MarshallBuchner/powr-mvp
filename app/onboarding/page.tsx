import { Suspense } from "react";
import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  title: "Account setup | POWR",
  description:
    "Confirm age eligibility, legal terms, and analysis consent for your POWR account.",
};

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <p className="eyebrow">ACCOUNT SETUP</p>
          <h1>Loading…</h1>
        </main>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}
