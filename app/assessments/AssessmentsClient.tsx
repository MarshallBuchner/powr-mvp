"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { fetchEntitlementBalance } from "@/app/components/assessmentEntitlements";
import {
  PENDING_ASSESSMENT_KEY,
  type PendingAssessmentPayload,
} from "@/app/components/assessmentStorage";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

type AssessmentRow = {
  id: string;
  created_at: string;
  goal: string;
  file_name: string;
  duration: number | null;
  overall_score: number | null;
};

export default function AssessmentsClient() {
  const { configured, loading, user } = useAuth();
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "saving">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [foundingAthlete, setFoundingAthlete] = useState(false);
  const [foundingMonthRemaining, setFoundingMonthRemaining] = useState<
    number | null
  >(null);
  const [foundingExpiresAt, setFoundingExpiresAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!user) {
      setFoundingAthlete(false);
      setFoundingMonthRemaining(null);
      setFoundingExpiresAt(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const balance = await fetchEntitlementBalance();
      if (!cancelled && balance) {
        setFoundingAthlete(Boolean(balance.foundingAthlete));
        setFoundingMonthRemaining(
          typeof balance.foundingMonthRemaining === "number"
            ? balance.foundingMonthRemaining
            : null,
        );
        setFoundingExpiresAt(balance.foundingExpiresAt ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!configured || loading) return;
    if (!user) return;

    async function load() {
      setStatus("loading");
      try {
        const pendingRaw = sessionStorage.getItem(PENDING_ASSESSMENT_KEY);
        if (pendingRaw) {
          setStatus("saving");
          const pending = JSON.parse(pendingRaw) as PendingAssessmentPayload;
          const saveRes = await fetch("/api/assessments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pending),
          });
          if (saveRes.ok) {
            sessionStorage.removeItem(PENDING_ASSESSMENT_KEY);
            setMessage("Assessment saved to your account.");
          }
        }

        const res = await fetch("/api/assessments");
        if (!res.ok) {
          throw new Error("Could not load assessments");
        }
        const data = (await res.json()) as { assessments: AssessmentRow[] };
        setRows(data.assessments ?? []);
        setStatus("idle");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("Could not load your saved assessments.");
      }
    }

    void load();
  }, [configured, loading, user]);

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Delete this saved assessment? This cannot be undone.",
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      setRows((current) => current.filter((row) => row.id !== id));
      setMessage("Assessment deleted.");
    } catch {
      setMessage(
        `Could not delete that assessment. Email ${SUPPORT_EMAIL} if it keeps failing.`,
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (!configured) {
    return (
      <main className="app-shell">
        <p className="eyebrow">MY ASSESSMENTS</p>
        <h1>Accounts not configured yet</h1>
        <p>
          Connect Supabase env vars and run <code>supabase/schema.sql</code> to
          enable saved assessments.
        </p>
        <Link href="/">← Back home</Link>
      </main>
    );
  }

  if (!loading && !user) {
    return (
      <main className="app-shell">
        <p className="eyebrow">MY ASSESSMENTS</p>
        <h1>Sign in to see saved reports</h1>
        <p>
          Create a free POWR account to keep skating assessments and come back
          later.
        </p>
        <p>
          <Link className="primary-button" href="/login?next=/assessments">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <p className="eyebrow">MY ASSESSMENTS</p>
      <h1>Your saved skating reports</h1>
      <p>
        Saved assessments are private by default. Open a report while signed in,
        or create a share link from the report if you want others to view it.
        Need help? <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
      </p>
      {foundingAthlete ? (
        <section className="founding-athlete-card" aria-label="Founding Athlete">
          <p className="founding-athlete-eyebrow">POWR FOUNDING ATHLETE</p>
          <h2>Complimentary access active</h2>
          <p>
            {foundingMonthRemaining != null
              ? `${foundingMonthRemaining} assessment${foundingMonthRemaining === 1 ? "" : "s"} remaining this month`
              : "Monthly complimentary assessments available"}
            {foundingExpiresAt
              ? ` · Access through ${new Date(foundingExpiresAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}`
              : ""}
          </p>
          {foundingMonthRemaining === 0 ? (
            <p className="founding-athlete-renew">
              Complimentary assessments renew next month (no rollover).
            </p>
          ) : null}
        </section>
      ) : null}
      {message ? <p className="login-message">{message}</p> : null}
      {status === "loading" || status === "saving" ? (
        <p>{status === "saving" ? "Saving assessment…" : "Loading…"}</p>
      ) : null}
      {status === "error" ? <p className="login-error">{message}</p> : null}

      {rows.length === 0 && status === "idle" ? (
        <div className="assessment-empty">
          <p>No saved assessments yet.</p>
          <Link href="/#start-assessment">Run your first skating assessment →</Link>
        </div>
      ) : (
        <ul className="assessment-list">
          {rows.map((row) => (
            <li key={row.id} className="assessment-list-item">
              <Link href={`/r/${row.id}`}>
                <strong>{row.file_name}</strong>
                <span>
                  {row.goal}
                  {row.overall_score != null ? ` · ${row.overall_score}` : ""}
                </span>
                <em>{new Date(row.created_at).toLocaleString()}</em>
              </Link>
              <button
                type="button"
                className="text-button assessment-delete"
                disabled={deletingId === row.id}
                onClick={() => void handleDelete(row.id)}
              >
                {deletingId === row.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
