"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

const RESEND_COOLDOWN_SEC = 45;
const OTP_MIN_LEN = 4;
const OTP_MAX_LEN = 10;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function isValidOtpLength(token: string) {
  return token.length >= OTP_MIN_LEN && token.length <= OTP_MAX_LEN;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/assessments";
  const error = searchParams.get("error");
  const reason = searchParams.get("reason");
  const { configured, sendSignInCode, verifySignInCode, user } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const heading = useMemo(() => {
    if (user) return "You're signed in";
    if (step === "code") return "Check your email";
    return "Sign in to POWR";
  }, [user, step]);

  async function sendCode(targetEmail: string) {
    setSending(true);
    setMessage("");
    setErrorMessage("");
    const result = await sendSignInCode(targetEmail);
    setSending(false);
    if (result.error) {
      setErrorMessage(result.error);
      return false;
    }
    setStep("code");
    setCooldown(RESEND_COOLDOWN_SEC);
    setMessage("Code sent. Enter the sign-in code from your email.");
    return true;
  }

  async function onSendEmail(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    await sendCode(trimmed);
  }

  async function onVerifyCode(event: FormEvent) {
    event.preventDefault();
    const token = digitsOnly(code);
    if (!isValidOtpLength(token)) {
      setErrorMessage("Enter the sign-in code from your email.");
      return;
    }
    setVerifying(true);
    setMessage("");
    setErrorMessage("");
    const result = await verifySignInCode(email.trim(), token);
    setVerifying(false);
    if (result.error) {
      setErrorMessage(result.error);
      return;
    }
    setMessage("Signed in. Redirecting…");
    router.replace(next.startsWith("/") ? next : "/assessments");
    router.refresh();
  }

  async function onResend() {
    if (cooldown > 0 || sending) return;
    const ok = await sendCode(email.trim());
    if (ok) setCode("");
  }

  function onDifferentEmail() {
    setStep("email");
    setCode("");
    setMessage("");
    setErrorMessage("");
    setCooldown(0);
  }

  if (!configured) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR ACCOUNTS</p>
        <h1>Accounts are almost ready</h1>
        <p>
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then run{" "}
          <code>supabase/schema.sql</code> in your Supabase project.
        </p>
        <p>
          <Link href="/">← Back to POWR</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <p className="eyebrow">POWR ACCOUNT</p>
      <h1>{heading}</h1>

      {user ? (
        <p>
          Signed in as <strong>{user.email}</strong>.{" "}
          <Link href={next}>Continue →</Link>
        </p>
      ) : step === "email" ? (
        <>
          <p>Enter your email and we&apos;ll send you a sign-in code.</p>
          <form onSubmit={onSendEmail} className="login-form">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              disabled={sending}
            />
            <button
              className="primary-button"
              type="submit"
              disabled={sending || !email.trim()}
            >
              {sending ? "Sending…" : "Send sign-in code"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p>
            We sent a sign-in code to <strong>{email.trim()}</strong>.
          </p>
          <form onSubmit={onVerifyCode} className="login-form">
            <label htmlFor="otp-code">Sign-in code</label>
            <input
              id="otp-code"
              className="login-otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              required
              maxLength={OTP_MAX_LEN}
              value={code}
              onChange={(e) =>
                setCode(digitsOnly(e.target.value).slice(0, OTP_MAX_LEN))
              }
              placeholder="Enter code"
              disabled={verifying}
              aria-describedby="otp-hint"
            />
            <p id="otp-hint" className="login-hint">
              Open your email app, copy the code, and paste it here.
            </p>
            <button
              className="primary-button"
              type="submit"
              disabled={verifying || !isValidOtpLength(digitsOnly(code))}
            >
              {verifying ? "Verifying…" : "Verify code"}
            </button>
            <div className="login-secondary-actions">
              <button
                type="button"
                className="login-text-button"
                onClick={onResend}
                disabled={sending || cooldown > 0}
              >
                {sending
                  ? "Sending…"
                  : cooldown > 0
                    ? `Resend code (${cooldown}s)`
                    : "Resend code"}
              </button>
              <button
                type="button"
                className="login-text-button"
                onClick={onDifferentEmail}
                disabled={sending || verifying}
              >
                Use a different email
              </button>
            </div>
          </form>
        </>
      )}

      {message ? <p className="login-message">{message}</p> : null}
      {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
      {error && !errorMessage && !message && !user ? (
        <p className="login-error">
          Sign-in failed{reason ? `: ${reason}` : "."} Request a new code.
        </p>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link href="/">← Continue as guest</Link>
      </p>
    </main>
  );
}
