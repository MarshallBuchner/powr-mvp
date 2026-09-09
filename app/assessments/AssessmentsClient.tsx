"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import {
  PENDING_ASSESSMENT_KEY,
  type PendingAssessmentPayload,
} from "@/app/components/assessmentStorage";

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

  useEffect(() => {
    if (!configured || loading) return;
    if (!user) return;

    async function load() {
      setStatus("loading");
      try {
        // If user came from Save → login, flush pending assessment first.
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
        Come back anytime to review scores, coaching notes, and drills. Recruit
        toolkit purchases stay separate — no account needed there.
      </p>
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
            <li key={row.id}>
              <Link href={`/r/${row.id}`}>
                <strong>{row.file_name}</strong>
                <span>
                  {row.goal}
                  {row.overall_score != null ? ` · ${row.overall_score}` : ""}
                </span>
                <em>{new Date(row.created_at).toLocaleString()}</em>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
