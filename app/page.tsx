"use client";

import Hero from "./components/Hero";
import UploadCard from "./components/UploadCard";
import type { AnalysisRequest } from "./components/types";

export default function Home() {
  function handleAnalyze(request: AnalysisRequest) {
    console.log("Analysis request:", request);

    alert(
      `Ready to analyze ${request.fileName} with focus on ${request.goal}.`,
    );
  }

  return (
    <main className="app-shell">
      <Hero />
      <UploadCard onAnalyze={handleAnalyze} />
    </main>
  );
}