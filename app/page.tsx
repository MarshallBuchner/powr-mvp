"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Hero from "./components/Hero";
import UploadCard from "./components/UploadCard";
import AnalysisScreen from "./components/AnalysisScreen";
import type { AnalysisRequest } from "./components/types";
import SampleAssessment from "./components/SampleAssessment";
import HowPowrWorks from "./components/HowPowrWorks";
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
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [screen]);

  function handleAnalyze(request: AnalysisRequest) {
    analysisRequestRef.current = request;
    setAnalysisRequest(request);
    setScreen("analysis");
  }

  function handleAnalysisComplete() {
    const request = analysisRequestRef.current;

    if (!request) {
      return;
    }

    router.push(getSharePath(request));
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
        onComplete={handleAnalysisComplete}
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
          Explore a sample skating assessment and see how POWR turns video
          into scores, coaching insights, and personalized drills.
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

      <p className="recruit-home-note">
        Also new:{" "}
        <Link href="/recruit">POWR Recruit — recruiting toolkit →</Link>
      </p>

      <footer className="site-footer">
        <Link href="/">POWR</Link>
        <Link href="/#start-assessment">Skating assessment</Link>
        <Link href="/recruit">Recruit toolkit</Link>
        <Link href="/assessments">My assessments</Link>
      </footer>
    </main>
  );
}
