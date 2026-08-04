"use client";

import { useEffect, useState } from "react";

import Hero from "./components/Hero";
import UploadCard from "./components/UploadCard";
import AnalysisScreen from "./components/AnalysisScreen";
import ReportScreen from "./components/ReportScreen";

import type { AnalysisRequest } from "./components/types";

type Screen = "upload" | "analysis" | "report";

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
      <UploadCard onAnalyze={handleAnalyze} />
    </main>
  );
}