"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import type { AccountConsentStatus } from "@/lib/accountConsent";
import {
  clearGuestMarketingConsent,
  guestConsentComplete,
  readGuestConsent,
  writeGuestConsent,
  type GuestConsentRecord,
} from "@/lib/guestConsent";

export default function PrivacySettingsClient() {
  const { configured, loading, user } = useAuth();
  const [status, setStatus] = useState<AccountConsentStatus | null>(null);
  const [guest, setGuest] = useState<GuestConsentRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setGuest(readGuestConsent());
      setStatus(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/account/consent", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as AccountConsentStatus;
        if (!cancelled) setStatus(data);
      } catch {
        // Non-blocking.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  async function setMarketing(enabled: boolean) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (!user) {
        if (enabled) {
          const current = readGuestConsent();
          if (current.ageBand !== "adult") {
            setError(
              "Optional advertising measurement is only available when age eligibility is 18 or older.",
            );
            return;
          }
          const next = writeGuestConsent({ marketingConsent: true });
          setGuest(next);
          setMessage("Advertising measurement enabled on this device.");
        } else {
          const next = clearGuestMarketingConsent();
          setGuest(next);
          setMessage("Advertising measurement turned off on this device.");
        }
        return;
      }

      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketingOnly: true,
          marketingConsent: enabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not update preference.",
        );
        return;
      }
      setStatus(data as AccountConsentStatus);
      setMessage(
        enabled
          ? "Advertising measurement enabled."
          : "Advertising measurement withdrawn.",
      );
    } catch {
      setError("Could not update preference. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const marketingOn = user
    ? Boolean(status?.canMeasureAds)
    : Boolean(guest?.marketingConsent && guest.ageBand === "adult");

  const adultEligible = user
    ? status?.ageBand === "adult"
    : guest?.ageBand === "adult";

  return (
    <main className="app-shell legal-page">
      <p className="eyebrow">PRIVACY</p>
      <h1>Privacy settings</h1>
      <p className="legal-lead">
        Manage optional advertising measurement. Analysis consent and age
        eligibility for signed-in accounts are set during{" "}
        <Link href="/onboarding">account setup</Link>.
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <section className="legal-section">
          <h2>Account status</h2>
          {user && status ? (
            <ul className="privacy-details">
              <li>
                Age band:{" "}
                <strong>{status.ageBand ?? "not confirmed"}</strong>
              </li>
              <li>
                Onboarding:{" "}
                <strong>
                  {status.onboardingComplete ? "complete" : "incomplete"}
                </strong>
                {!status.onboardingComplete ? (
                  <>
                    {" "}
                    — <Link href="/onboarding">Finish setup</Link>
                  </>
                ) : null}
              </li>
              <li>
                Analysis consent:{" "}
                <strong>
                  {status.analysisConsentAt
                    ? new Date(status.analysisConsentAt).toLocaleString()
                    : "not recorded"}
                </strong>
              </li>
            </ul>
          ) : !user ? (
            <ul className="privacy-details">
              <li>
                Guest on this device:{" "}
                <strong>
                  {guest && guestConsentComplete(guest)
                    ? "eligibility saved locally"
                    : "not yet confirmed"}
                </strong>
              </li>
              <li>
                Sign in to store consent on your account:{" "}
                <Link href="/login?next=/privacy/settings">Sign in</Link>
              </li>
            </ul>
          ) : (
            <p>
              {!configured
                ? "Accounts are not configured in this environment."
                : "Could not load account consent."}
            </p>
          )}
        </section>
      )}

      <section className="legal-section">
        <h2>Optional advertising measurement</h2>
        <p>
          Off by default. Adults only. Never sends your video, frames, skating
          scores, or coaching report to Meta. Details in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        {!adultEligible ? (
          <p className="consent-blocked">
            Available only when age eligibility is confirmed as 18 or older.
          </p>
        ) : (
          <div className="privacy-settings-actions">
            <p>
              Status:{" "}
              <strong>{marketingOn ? "Enabled" : "Off"}</strong>
            </p>
            {marketingOn ? (
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => void setMarketing(false)}
              >
                {busy ? "Updating…" : "Withdraw consent"}
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={() => void setMarketing(true)}
              >
                {busy ? "Updating…" : "Enable advertising measurement"}
              </button>
            )}
          </div>
        )}
        {message ? <p className="login-message">{message}</p> : null}
        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <p className="legal-back">
        <Link href="/">← Back to POWR</Link>
        {" · "}
        <Link href="/privacy">Privacy Policy</Link>
      </p>
    </main>
  );
}
