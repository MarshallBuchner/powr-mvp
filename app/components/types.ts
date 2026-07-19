export type AnalysisRequest = {
  file: File;
  fileName: string;
  videoUrl: string;
  goal: string;
  duration: number | null;
};