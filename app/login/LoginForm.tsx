"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/assessments";
  const error = searchParams.get("error");
  const reason = searchParams.get("reason");
  const { configured, requestMagicLink, user } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const heading = useMemo(() => {
    if (user) return "You're signed in";
    return "Save your skating assessments";
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const result = await requestMagicLink(email, next);
    if (result.error) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for a magic link to sign in.");
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
      <p>
        Sign in with email to save skating assessments and come back later. Your
        first assessment can still be free — save after you see the report.
      </p>

      {user ? (
        <p>
          Signed in as <strong>{user.email}</strong>.{" "}
          <Link href={next}>Continue →</Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="login-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
          <button className="primary-button" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Email me a magic link"}
          </button>
        </form>
      )}

      {message ? <p className="login-message">{message}</p> : null}
      {error ? (
        <p className="login-error">
          Sign-in failed{reason ? `: ${reason}` : "."} Request a new link.
        </p>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link href="/">← Continue as guest</Link>
      </p>
    </main>
  );
}
