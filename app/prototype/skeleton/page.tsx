import type { Metadata } from "next";
import Link from "next/link";
import SkeletonOverlayDemo from "@/app/components/prototype/SkeletonOverlayDemo";

export const metadata: Metadata = {
  title: "Skeleton Overlay Prototype | POWR",
  description:
    "Upload a hockey clip to preview live pose tracking — POWR concept prototype.",
  robots: { index: false, follow: false },
};

export default function SkeletonPrototypePage() {
  return (
    <main className="skel-page">
      <p className="skel-back">
        <Link href="/">← Back to POWR</Link>
      </p>
      <SkeletonOverlayDemo />
    </main>
  );
}
