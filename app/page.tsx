"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AnalysisScreen from "./components/AnalysisScreen";
import Hero from "./components/Hero";
import HowPowrWorks from "./components/HowPowrWorks";
import SampleAssessment from "./components/SampleAssessment";
import UploadCard from "./components/UploadCard";
import type { AnalysisRequest } from "./components/types";
import {
  createSampleRequest,
  getSharePath,
} from "./components/shareReport";

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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

  function handleAnalysisComplete() {
    const request = analysisRequestRef.current;
    if (!request?.analysis) return;
    router.push(getSharePath(request));
  }

  function handleAnalysisBack() {
    setAnalysisRequest(null);
    setScreen("upload");
  }

  function handleRestart() {
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
      <Hero onViewSample={handleSampleAssessment} />

      <section className="sample-assessment">
        <p className="eyebrow">SEE POWR IN ACTION</p>

        <h2>Not ready to upload your video yet?</h2>

        <p>
          Explore a sample skating assessment and see how POWR turns video into
          scores, coaching insights, and personalized drills.
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
