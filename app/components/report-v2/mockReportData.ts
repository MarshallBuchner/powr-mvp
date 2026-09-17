import type { RealAnalysis } from "../types";
import { sampleAnalysis } from "../sampleAnalysis";

export type ReportV2Drill = {
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
};

export type ReportV2Priority = {
  title: string;
  detail: string;
};

export type ReportV2ProgressPoint = {
  label: string;
  score: number;
};

export type ReportV2Model = {
  playerLabel: string;
  goal: string;
  coachName: string;
  analysis: RealAnalysis;
  categories: { name: string; score: number }[];
  priorities: ReportV2Priority[];
  drills: ReportV2Drill[];
  progress: ReportV2ProgressPoint[];
  deltaVsLast: number | null;
};

/** Design-brief mock used by /r/v2 — does not affect live reports. */
export const mockReportV2: ReportV2Model = {
  playerLabel: "Your skating profile",
  goal: "Overall skating",
  coachName: "POWR Coach",
  analysis: {
    ...sampleAnalysis,
    overallScore: 78,
    summary:
      "You have a strong foundation and great power. Focus on stride extension and upper body stability to reach the next level.",
    strengths: [
      "Strong forward intent out of the stance",
      "Solid power through mid-stride",
      "Good balance once up to speed",
    ],
    priorityImprovement: "Increase stride extension on your first three strides.",
    whyItMatters:
      "Longer, stronger pushes create more ice coverage and faster acceleration without extra steps.",
    movementMetrics: [
      {
        title: "Acceleration",
        score: 82,
        explanation: "Quick first steps with room to stay lower longer.",
        observations: [
          { type: "good", text: "Explosive first push" },
          { type: "improve", text: "Hold knee bend through stride 2–3" },
        ],
        whyItMatters: "Acceleration decides separation in races to the puck.",
      },
      {
        title: "Stride Power",
        score: 75,
        explanation: "Power is there; finish the push through the toe.",
        observations: [
          { type: "good", text: "Strong mid-stride drive" },
          { type: "improve", text: "Extend fully before recovery" },
        ],
        whyItMatters: "Full extension turns effort into speed.",
      },
      {
        title: "Edge Control",
        score: 71,
        explanation: "Edges are stable; add more bite on outside edges.",
        observations: [
          { type: "good", text: "Clean inside-edge pushes" },
          { type: "improve", text: "Commit weight over the push skate" },
        ],
        whyItMatters: "Edge bite improves cuts and escapes.",
      },
      {
        title: "Balance & Stability",
        score: 80,
        explanation: "Chest stays quiet; keep it stacked over the skates.",
        observations: [
          { type: "good", text: "Controlled upper body" },
          { type: "improve", text: "Avoid rising early in the stride" },
        ],
        whyItMatters: "Stability keeps power going into the ice.",
      },
      {
        title: "Efficiency",
        score: 76,
        explanation: "Good rhythm with a little wasted upright motion.",
        observations: [
          { type: "good", text: "Consistent cadence" },
          { type: "improve", text: "Reduce vertical bounce" },
        ],
        whyItMatters: "Efficiency saves energy for late shifts.",
      },
    ],
  },
  categories: [
    { name: "Acceleration", score: 82 },
    { name: "Stride Power", score: 75 },
    { name: "Edge Control", score: 71 },
    { name: "Balance & Stability", score: 80 },
    { name: "Efficiency", score: 76 },
  ],
  priorities: [
    {
      title: "Increase Stride Extension",
      detail: "Get more reach and power in each stride.",
    },
    {
      title: "Improve Knee Bend",
      detail: "Get lower for better power and stability.",
    },
    {
      title: "Upper Body Stability",
      detail: "Keep your chest over your skates through your stride.",
    },
  ],
  drills: [
    {
      title: "Power Push",
      description: "Build explosive power and longer strides.",
      duration: "10 min",
      difficulty: "Intermediate",
      category: "Skating",
    },
    {
      title: "Deep Knee Drive",
      description: "Improve knee bend and edge engagement.",
      duration: "8 min",
      difficulty: "Beginner",
      category: "Skating",
    },
    {
      title: "Balance Under Pressure",
      description: "Stay stable through contact and quick transitions.",
      duration: "10 min",
      difficulty: "Intermediate",
      category: "Skating",
    },
  ],
  progress: [
    { label: "Week 0", score: 56 },
    { label: "Week 4", score: 64 },
    { label: "Week 8", score: 71 },
    { label: "Week 12", score: 78 },
  ],
  deltaVsLast: 12,
};

export function reportV2FromAnalysis(
  analysis: RealAnalysis,
  goal = "Overall skating",
): ReportV2Model {
  return {
    playerLabel: "Your skating profile",
    goal,
    coachName: "POWR Coach",
    analysis,
    categories: analysis.movementMetrics.map((m) => ({
      name: m.title,
      score: m.score,
    })),
    priorities: [
      {
        title: analysis.priorityImprovement,
        detail: analysis.whyItMatters,
      },
      ...analysis.movementMetrics
        .filter((m) => m.score < 80)
        .slice(0, 2)
        .map((m) => ({
          title: m.title,
          detail:
            m.observations.find((o) => o.type === "improve")?.text ||
            m.explanation,
        })),
    ].slice(0, 3),
    drills: analysis.drills.map((d, i) => ({
      title: d.title,
      description: d.description,
      duration: d.duration,
      difficulty: (["Beginner", "Intermediate", "Advanced"] as const)[
        Math.min(i, 2)
      ],
      category: "Skating",
    })),
    progress: [
      { label: "Now", score: analysis.overallScore },
    ],
    deltaVsLast: null,
  };
}
