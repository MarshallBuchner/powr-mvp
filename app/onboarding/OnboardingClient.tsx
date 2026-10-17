"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import type { AccountConsentStatus } from "@/lib/accountConsent";
import type { AgeBand } from "@/lib/consent";
import { ageGateMessage } from "@/lib/consent";

export default function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/#start-assessment";
  const { configured, loading, user } = useAuth();

  const [statusLoading, setStatusLoading] = useState(true);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [acceptAnalysis, setAcceptAnalysis] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<AccountConsentStatus | null>(null);

  useEffect(() => {
    if (!configured || loading) return;
    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/onboarding?next=${encodeURIComponent(next)}`)}`,
      );
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/account/consent", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setStatusLoading(false);
          return;
        }
        const data = (await res.json()) as AccountConsentStatus;
        if (cancelled) return;
        setExisting(data);
        if (data.ageBand) setAgeBand(data.ageBand);
        if (data.onboardingComplete) {
          router.replace(next.startsWith("/") ? next : "/");
          return;
        }
        setAcceptLegal(!data.needsTermsReprompt && !data.needsPrivacyReprompt);
        setAcceptAnalysis(Boolean(data.analysisConsentAt));
        setMarketingConsent(data.canMeasureAds);
      } catch {
        // Keep form available if status load fails.
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, router, next]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const blocked = ageGateMessage(ageBand);
    if (blocked) {
      setError(blocked);
      return;
    }
    if (!ageBand || ageBand === "under13") {
      setError("Confirm your age eligibility to continue.");
      return;
    }
    if (!acceptLegal) {
      setError("Accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    if (!acceptAnalysis) {
      setError("Confirm analysis consent to continue.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageBand,
          acceptLegal: true,
          acceptAnalysis: true,
          marketingConsent: ageBand === "adult" && marketingConsent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not save your preferences.",
        );
        return;
      }
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Could not save your preferences. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <main className="app-shell">
        <p className="eyebrow">ACCOUNT SETUP</p>
        <h1>Accounts are almost ready</h1>
        <p>
          <Link href="/">← Back to POWR</Link>
        </p>
      </main>
    );
  }

  if (loading || statusLoading) {
    return (
      <main className="app-shell">
        <p className="eyebrow">ACCOUNT SETUP</p>
        <h1>Loading…</h1>
      </main>
    );
  }

  const isReprompt = Boolean(
    existing &&
      (existing.needsTermsReprompt || existing.needsPrivacyReprompt) &&
      existing.ageConfirmedAt,
  );

  return (
    <main className="app-shell">
      <p className="eyebrow">ACCOUNT SETUP</p>
      <h1>{isReprompt ? "Updated terms" : "Before you start"}</h1>
      <p className="section-description">
        {isReprompt
          ? "Please review and accept the current Terms and Privacy Policy to continue using POWR."
          : "Confirm eligibility and consent once for your account. You will not need to repeat this on every upload."}
      </p>

      <form className="login-form consent-onboarding-form" onSubmit={onSubmit}>
        <fieldset className="consent-fieldset">
          <legend>Eligibility &amp; legal</legend>

          <label className="consent-label">
            <span className="consent-label-title">Age eligibility</span>
            <select
              value={ageBand ?? ""}
              onChange={(e) => {
                const nextBand = (e.target.value || null) as AgeBand | null;
                setAgeBand(nextBand);
                if (nextBand !== "adult") setMarketingConsent(false);
              }}
              aria-required="true"
              disabled={Boolean(existing?.ageConfirmedAt && existing.ageBand)}
            >
              <option value="" disabled>
                Select one…
              </option>
              <option value="adult">I am 18 or older</option>
              <option value="teen">
                I am 13–17 and have parent/guardian permission to use POWR
              </option>
              <option value="under13">I am under 13</option>
            </select>
          </label>
          {ageBand === "under13" ? (
            <p className="consent-blocked" role="alert">
              {ageGateMessage("under13")}
            </p>
          ) : null}

          <label className="consent-check">
            <input
              type="checkbox"
              checked={acceptLegal}
              onChange={(e) => setAcceptLegal(e.target.checked)}
              disabled={ageBand === "under13"}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </fieldset>

        <fieldset className="consent-fieldset">
          <legend>Video analysis</legend>
          <p className="consent-lead">
            Analysis samples a few compressed frames from your clip (and may use
            on-device pose estimates) to build a skating development report.
            Those frames are sent to third-party processors such as OpenAI. Your
            full video file stays on this device and is not stored by POWR.
            OpenAI API/business data is not used to train OpenAI models by
            default. Saved reports keep analysis text and scores — not the clip.
          </p>
          <label className="consent-check">
            <input
              type="checkbox"
              checked={acceptAnalysis}
              onChange={(e) => setAcceptAnalysis(e.target.checked)}
              disabled={ageBand === "under13"}
            />
            <span>
              I understand and consent to analysis of sampled frames for my
              assessments.
            </span>
          </label>
        </fieldset>

        {ageBand === "adult" ? (
          <fieldset className="consent-fieldset">
            <legend>Optional advertising</legend>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
              />
              <span>
                Help measure POWR ads (optional, off by default). When a report
                opens successfully, share a completion event plus IP, browser
                info, and any Meta ad click ID with Meta. Video, scores, and
                coaching reports are never shared. Change this anytime in{" "}
                <Link href="/privacy/settings">Privacy settings</Link>.
              </span>
            </label>
          </fieldset>
        ) : null}

        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="primary-button"
          type="submit"
          disabled={
            saving ||
            ageBand === "under13" ||
            !ageBand ||
            !acceptLegal ||
            !acceptAnalysis
          }
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>

      <p style={{ marginTop: 24 }}>
        <Link href="/">← Back to POWR</Link>
        {" · "}
        <Link href="/privacy/settings">Privacy settings</Link>
      </p>
    </main>
  );
}
