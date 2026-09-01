"use client";

import { useRouter } from "next/navigation";
import ReportScreen from "./ReportScreen";
import type { AnalysisRequest } from "./types";

export default function SharedReportView({
  request,
}: {
  request: AnalysisRequest;
}) {
  const router = useRouter();

  return (
    <ReportScreen
      request={request}
      onRestart={() => router.push("/")}
    />
  );
}
