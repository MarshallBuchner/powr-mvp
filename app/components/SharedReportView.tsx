"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import ReportScreen from "./ReportScreen";
import ReportV2Flow from "./report-v2/ReportV2Flow";
import { reportV2FromAnalysis } from "./report-v2/mockReportData";
import { parseReportV2Step } from "./report-v2/reportV2Steps";
import { readStashedEvidenceFrames } from "./evidenceStorage";
import { isSampleReport } from "./shareReport";
import {
  getLocalRemainingAssessments,
  localCanRunAssessment,
} from "./assessmentEntitlements";
import type { AnalysisEvidenceMoment, AnalysisRequest } from "./types";

function SharedReportViewInner({
  request,
}: {
  request: AnalysisRequest;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSample = isSampleReport(request);
  const initialStep = parseReportV2Step(searchParams.get("step"));

  const [evidenceMoments, setEvidenceMoments] = useState<
    AnalysisEvidenceMoment[]
  >(request.evidenceMoments ?? []);

  useEffect(() => {
    if (request.evidenceMoments?.length) {
      setEvidenceMoments(request.evidenceMoments);
      return;
    }
    const stashed = readStashedEvidenceFrames();
    if (stashed.length) {
      setEvidenceMoments(stashed);
    }
  }, [request.evidenceMoments]);

  useEffect(() => {
    if (!request.analysis || isSample) return;
    track("report_viewed", { goal: request.goal, ui: "v2" });
    if (!localCanRunAssessment()) {
      track("upgrade_viewed", { source: "report_v2" });
    }
    // Touch remaining so entitlement cookie/local stay warm for UpgradePanel.
    void getLocalRemainingAssessments();
  }, [request.analysis, request.goal, isSample]);

  const preservedQuery = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("step");
    return params.toString();
  }, [searchParams]);

  if (!request.analysis) {
    return (
      <ReportScreen
        request={request}
        onRestart={() => router.push("/")}
      />
    );
  }

  const model = reportV2FromAnalysis(request.analysis, {
    goal: request.goal,
    duration: request.duration,
    evidenceMoments,
    assessedOn: isSample ? "Sample" : "Today",
  });

  return (
    <ReportV2Flow
      model={model}
      demoMode={false}
      isSample={isSample}
      initialStep={initialStep}
      basePath={pathname || "/r"}
      searchParams={preservedQuery}
      onRestart={() => router.push("/#start-assessment")}
    />
  );
}

export default function SharedReportView({
  request,
}: {
  request: AnalysisRequest;
}) {
  return (
    <Suspense
      fallback={
        <main className="rv2-shell">
          <p className="rv2-demo-note" style={{ padding: 24 }}>
            Loading your report…
          </p>
        </main>
      }
    >
      <SharedReportViewInner request={request} />
    </Suspense>
  );
}
