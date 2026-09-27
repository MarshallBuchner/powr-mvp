"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SharedReportView from "../components/SharedReportView";
import { decodeLiveSharePayload } from "../components/shareReport";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

/**
 * Legacy `/r?d=…` links (analysis embedded in the URL).
 * Still readable for older shares; new reports use `/r/s/[token]`.
 */
export default function LiveShareReport() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("d");
  const request = encoded ? decodeLiveSharePayload(encoded) : null;

  if (!request) {
    return (
      <main className="app-shell">
        <p className="eyebrow">POWR</p>
        <h1>Assessment not found</h1>
        <p>
          This legacy share link is invalid or incomplete. New reports use
          private tokenized links. Need help?{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        </p>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </main>
    );
  }

  return (
    <>
      <div className="legacy-share-banner" role="note">
        This is a legacy share link. New POWR reports use private tokenized
        links and are not embedded in the URL.
      </div>
      <SharedReportView request={request} />
    </>
  );
}
