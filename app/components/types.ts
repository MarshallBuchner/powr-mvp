export type AnalysisEvidenceMoment = {
  timeLabel: string;
  caption: string;
  /** Same-session thumbnail only — not encoded into share URLs */
  dataUrl?: string;
};

export type AnalysisRequest = {
  file?: File;
  fileName: string;
  videoUrl: string;
  goal: string;
  duration: number | null;
  analysis?: RealAnalysis;
  evidenceMoments?: AnalysisEvidenceMoment[];
};

export type RealMovementObservation = {
  type: "good" | "improve";
  text: string;
};

export type RealMovementMetric = {
  title: string;
  score: number;
  explanation: string;
  observations: RealMovementObservation[];
  whyItMatters: string;
};

export type RealDrill = {
  title: string;
  description: string;
  duration: string;
};

export type RealAnalysis = {
  overallScore: number;
  summary: string;
  strengths: string[];
  priorityImprovement: string;
  whyItMatters: string;

  movementMetrics: RealMovementMetric[];

  drills: RealDrill[];

  confidence: {
    score: number;
    label: "Low" | "Moderate" | "High";
    reason: string;
  };
};