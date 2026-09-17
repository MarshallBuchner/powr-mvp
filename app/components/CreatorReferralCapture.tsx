"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureCreatorRef, syncEntitlementCookie, readLocalEntitlements } from "./assessmentEntitlements";
import { track } from "@vercel/analytics";

export default function CreatorReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref =
      searchParams.get("ref") ||
      searchParams.get("creator") ||
      searchParams.get("via");

    if (ref) {
      captureCreatorRef(ref);
      track("creator_ref_captured", { ref: ref.slice(0, 64) });
    }

    void syncEntitlementCookie(readLocalEntitlements());
  }, [searchParams]);

  return null;
}
