import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in | POWR",
  description: "Save skating assessments and come back later with a POWR account.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <p className="eyebrow">POWR ACCOUNT</p>
          <h1>Loading…</h1>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
