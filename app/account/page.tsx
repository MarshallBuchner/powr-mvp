"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { fetchEntitlementBalance, type EntitlementBalance } from "../components/assessmentEntitlements";

export default function AccountPage() {
  const { loading, user, email, signOut } = useAuth();
  const userId = user?.id;
  const [balance, setBalance] = useState<{ userId: string; value: EntitlementBalance } | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void fetchEntitlementBalance().then((value) => {
      if (!cancelled && value?.source === "profile") setBalance({ userId, value });
    });
    return () => { cancelled = true; };
  }, [userId]);

  const currentBalance = balance?.userId === userId ? balance?.value : null;

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      await signOut();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) return <main className="app-shell"><p role="status">Loading account…</p></main>;
  if (!user) return (
    <main className="app-shell">
      <h1>Sign in to your account</h1>
      <Link href="/login?next=/account" className="primary-button">Sign in</Link>
    </main>
  );

  return (
    <main className="app-shell account-page">
      <h1>Account</h1>
      <p className="account-email">{email}</p>
      {currentBalance?.unlimited === true ? <p>Founder access — unlimited assessments</p> :
        currentBalance?.foundingAthlete ? <p>Founding Athlete · {currentBalance.foundingMonthRemaining ?? 0} assessments left this month</p> :
        currentBalance ? <p>{currentBalance.remaining} assessments remaining</p> : null}
      {currentBalance?.foundingAthlete && currentBalance.foundingExpiresAt ? (
        <p>Complimentary access through {new Date(currentBalance.foundingExpiresAt).toLocaleDateString()}</p>
      ) : null}
      <nav aria-label="Account settings">
        <Link href="/assessments">My Assessments</Link>
        <Link href="/privacy/settings">Privacy settings</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
      <button type="button" className="account-bar-button" disabled={signingOut} onClick={() => void handleSignOut()}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
