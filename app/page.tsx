"use client";

import { useRouter } from "next/navigation";
import { armCompletionMeasurement } from "@/lib/metaMeasurementClient";
import { useEffect, useRef, useState } from "react";
import AnalysisScreen from "./components/AnalysisScreen";
import Hero from "./components/Hero";
import HowPowrWorks from "./components/HowPowrWorks";
import SampleAssessment from "./components/SampleAssessment";
import UploadCard from "./components/UploadCard";
import type { AnalysisRequest } from "./components/types";
import {
  createReportSharePath,
  createSampleRequest,
} from "./components/shareReport";
import { stashLastReport } from "./components/reportSession";
import { releaseAnalysisVideoUrl } from "@/lib/previewObjectUrl";
import ReportRecoveryBanner from "./components/ReportRecoveryBanner";
import { readLifecycle, readNavigationType, writeLifecycle } from "@/lib/labLifecycle";
import { sendLabBeacon } from "@/lib/labTelemetryClient";
import { createShareOnce } from "@/lib/shareOnce";
import { resolveHandoffShare } from "@/lib/reportHandoff";
import {
  NEXT_SESSION_UPLOAD_HASH,
  scrollToNextSessionUploadAnchor,
} from "./components/nextSessionNavigation";

type Screen = "upload" | "sample" | "analysis";

export default function Home() {
  const router = useRouter();
  const [analysisRequest, setAnalysisRequest] =
    useState<AnalysisRequest | null>(null);
  const analysisRequestRef = useRef<AnalysisRequest | null>(null);
  const [screen, setScreen] = useState<Screen>("upload");

  useEffect(() => {
    analysisRequestRef.current = analysisRequest;
  }, [analysisRequest]);

  // The uploaded clip's blob URL is owned here once the Analysis Lab opens.
  useEffect(() => {
    return () => releaseAnalysisVideoUrl(analysisRequestRef.current?.videoUrl);
  }, []);

  // One share link per analysis: auto-navigation and the fallback button reuse it.
  const shareOnceRef = useRef<{
    key: AnalysisRequest | null;
    get: () => ReturnType<typeof createReportSharePath>;
  } | null>(null);

  // Lifecycle beacons distinguish an iOS tab kill (pagehide → fresh "reload"
  // boot) from an in-app reset. No PII; see lib/labTelemetry.ts allowlist.
  useEffect(() => {
    const onPageHide = () => sendLabBeacon("pagehide", readLifecycle());
    const onVisibility = () =>
      sendLabBeacon(
        document.visibilityState === "hidden" ? "visibility_hidden" : "visibility_visible",
        readLifecycle(),
      );
    const onPageShow = (e: PageTransitionEvent) =>
      sendLabBeacon("pageshow", readLifecycle(), {
        persisted: e.persisted,
        navType: readNavigationType(),
      });
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screen]);

  // iOS Safari often lands on `/#start-assessment` without scrolling to the
  // upload card (hash target exists only after client render).
  useEffect(() => {
    if (screen !== "upload") return;
    if (window.location.hash.replace(/^#/, "") !== NEXT_SESSION_UPLOAD_HASH) {
      return;
    }
    const timer = window.setTimeout(() => {
      scrollToNextSessionUploadAnchor();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [screen]);

  /** Opens Analysis Lab immediately (API may still be pending). */
  function handleAnalyze(request: AnalysisRequest) {
    analysisRequestRef.current = request;
    setAnalysisRequest(request);
    setScreen("analysis");
  }

  function handleAnalysisReady(request: AnalysisRequest) {
    analysisRequestRef.current = request;
    setAnalysisRequest(request);
  }

  async function handleAnalysisComplete() {
    const request = analysisRequestRef.current;
    if (!request?.analysis) {
      throw new Error("Analysis payload missing — cannot open report.");
    }
    // The billed analysis is already complete. Preserve it for report-only retries.
    // Tokenized share comes first: Safari sessionStorage may be full or disabled.
    if (!shareOnceRef.current || shareOnceRef.current.key !== request) {
      const target = request;
      shareOnceRef.current = {
        key: target,
        get: createShareOnce(() => createReportSharePath(target)),
      };
    }
    const share = await resolveHandoffShare(request, shareOnceRef.current.get);
    if (share.mode === "session" && share.stashed !== true) {
      throw new Error(
        "Your assessment is complete, but this browser could not save the report. Tap Open Report to retry — you will not be charged again.",
      );
    }
    // Best-effort fallback only; never block a working tokenized report.
    if (share.mode !== "session") stashLastReport(request);
    armCompletionMeasurement(request.marketingEventId, share.path);
    if (request.attemptId) {
      sendLabBeacon(
        "stage",
        writeLifecycle(request.attemptId, "navigate", {
          sharePath: share.path.startsWith("/r/s/") ? share.path : undefined,
        }),
      );
    }
    router.push(share.path);
  }

  function handleAnalysisBack() {
    releaseAnalysisVideoUrl(analysisRequestRef.current?.videoUrl);
    analysisRequestRef.current = null;
    setAnalysisRequest(null);
    setScreen("upload");
  }

  function handleRestart() {
    releaseAnalysisVideoUrl(analysisRequestRef.current?.videoUrl);
    analysisRequestRef.current = null;
    setAnalysisRequest(null);
    setScreen("upload");
  }

  function handleSampleAssessment() {
    setScreen("sample");
  }

  function handleSampleAnalyze() {
    const request = createSampleRequest();
    analysisRequestRef.current = request;
    setAnalysisRequest(request);
    setScreen("analysis");
  }

  if (screen === "sample") {
    return (
      <SampleAssessment
        onAnalyze={handleSampleAnalyze}
        onBack={handleRestart}
      />
    );
  }

  if (screen === "analysis" && analysisRequest) {
    return (
      <AnalysisScreen
        request={analysisRequest}
        onReady={handleAnalysisReady}
        onComplete={handleAnalysisComplete}
        onBack={handleAnalysisBack}
      />
    );
  }

  return (
    <main className="app-shell">
      <ReportRecoveryBanner />
      <Hero onViewSample={handleSampleAssessment} />

      <section className="sample-assessment">
        <p className="eyebrow">SEE POWR IN ACTION</p>

        <h2>Not ready to upload your video yet?</h2>

        <p>
          Explore a pre-generated sample report to see how POWR turns skating
          video into scores, coaching notes, and drills — without running a live
          assessment on your own clip.
        </p>

        <button
          className="secondary-button"
          type="button"
          onClick={handleSampleAssessment}
        >
          View Sample Assessment →
        </button>
      </section>

      <HowPowrWorks />

      <UploadCard onAnalyze={handleAnalyze} />
    </main>
  );
}
