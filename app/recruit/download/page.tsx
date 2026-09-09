import { Suspense } from "react";
import DownloadClient from "./DownloadClient";

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <main className="recruit-page">
          <p className="recruit-eyebrow">DOWNLOAD</p>
          <h1>YOUR POWR RECRUIT TOOLKIT</h1>
          <p className="recruit-lead">Loading download access...</p>
        </main>
      }
    >
      <DownloadClient />
    </Suspense>
  );
}
