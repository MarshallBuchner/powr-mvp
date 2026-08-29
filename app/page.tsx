"use client";

import { useEffect, useState } from "react";
import Hero from "./components/Hero";
import UploadCard from "./components/UploadCard";
import AnalysisScreen from "./components/AnalysisScreen";
import ReportScreen from "./components/ReportScreen";
import type { AnalysisRequest } from "./components/types";
import { sampleAnalysis } from "./components/sampleAnalysis";
import SampleAssessment from "./components/SampleAssessment";
import HowPowrWorks from "./components/HowPowrWorks";


type Screen = "upload" | "sample" | "analysis" | "report";

export default function Home() {
  const [analysisRequest, setAnalysisRequest] =
    useState<AnalysisRequest | null>(null);

  const [screen, setScreen] = useState<Screen>("upload");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [screen]);

  function handleAnalyze(request: AnalysisRequest) {
    setAnalysisRequest(request);
    setScreen("analysis");
  }

  function handleAnalysisComplete() {
    setScreen("report");
  }

  function handleRestart() {
    setAnalysisRequest(null);
    setScreen("upload");
  }

  function handleSampleAssessment() {
    setScreen("sample");
  }
  
  function handleSampleAnalyze() {
    const sampleFile = new File([""], "sample-skating.mp4", {
      type: "video/mp4",
    });
  
    setAnalysisRequest({
      file: sampleFile,
      fileName: "POWR Sample Skating Assessment",
      videoUrl: "/sample-skating.mp4",
      goal: "Acceleration",
      duration: 13,
      analysis: sampleAnalysis,
    });
  
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

  if (screen === "report" && analysisRequest) {
    return (
      <ReportScreen
        request={analysisRequest}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <main className="app-shell">
      <Hero />
  
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
    </main>
  );
}