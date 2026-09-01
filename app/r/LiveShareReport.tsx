"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SharedReportView from "../components/SharedReportView";
import { decodeLiveSharePayload } from "../components/shareReport";

export default function LiveShareReport() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("d");
  const request = encoded ? decodeLiveSharePayload(encoded) : null;

  if (!request) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>This assessment link is missing or expired.</h1>
        <p>
          Ask your teammate to share the report again, or start a new
          skating assessment.
        </p>
        <Link
          className="primary-button"
          href="/"
          style={{ width: "auto", padding: "0 22px", textDecoration: "none" }}
        >
          Open POWR
        </Link>
      </main>
    );
  }

  return <SharedReportView request={request} />;
}
