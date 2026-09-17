import type { RealAnalysis } from "../types";
import { sampleAnalysis } from "../sampleAnalysis";

export type ReportV2Drill = {
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: "Skating" | "Strength" | "On-Ice" | "Off-Ice";
  image: string;
};

export type ReportV2Priority = {
  title: string;
  detail: string;
  image: string;
  tone: "critical" | "focus" | "steady";
};

export type ReportV2ProgressPoint = {
  label: string;
  score: number;
};

export type ReportV2Model = {
  playerLabel: string;
  goal: string;
  assessedOn: string;
  coachName: string;
  coachTitle: string;
  coachImage: string;
  heroImage: string;
  analysis: RealAnalysis;
  categories: { name: string; score: number; icon: string }[];
  comparison: {
    youImage: string;
    proImage: string;
    youAngle: string;
    proAngle: string;
    duration: string;
  };
  priorities: ReportV2Priority[];
  drills: ReportV2Drill[];
  progress: ReportV2ProgressPoint[];
  deltaVsLast: number | null;
};

/** Design-brief mock used by /r/v2 — does not affect live reports. */
export const mockReportV2: ReportV2Model = {
  playerLabel: "Your skating profile",
  goal: "Overall skating",
  assessedOn: "Mar 8, 2025",
  coachName: "Coach Jamie",
  coachTitle: "POWR Coach",
  coachImage: "/report-v2/report-v2-coach.jpg",
  heroImage: "/report-v2/report-v2-hero.jpg",
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
    { name: "Acceleration", score: 82, icon: "⚡" },
    { name: "Stride Power", score: 75, icon: "↗" },
    { name: "Edge Control", score: 71, icon: "◎" },
    { name: "Balance & Stability", score: 80, icon: "◇" },
    { name: "Efficiency", score: 76, icon: "⟳" },
  ],
  comparison: {
    youImage: "/report-v2/report-v2-skate-you.jpg",
    proImage: "/report-v2/report-v2-skate-pro.jpg",
    youAngle: "142°",
    proAngle: "126°",
    duration: "0:38",
  },
  priorities: [
    {
      title: "Increase Stride Extension",
      detail: "Get more reach and power in each stride.",
      image: "/report-v2/report-v2-priority-stride.jpg",
      tone: "critical",
    },
    {
      title: "Improve Knee Bend",
      detail: "Get lower for better power and stability.",
      image: "/report-v2/report-v2-priority-knee.jpg",
      tone: "focus",
    },
    {
      title: "Upper Body Stability",
      detail: "Keep your chest over your skates through your stride.",
      image: "/report-v2/report-v2-priority-stability.jpg",
      tone: "steady",
    },
  ],
  drills: [
    {
      title: "Power Push",
      description: "Build explosive power and longer strides.",
      duration: "10 MIN",
      difficulty: "Intermediate",
      category: "Skating",
      image: "/report-v2/report-v2-drill-power.jpg",
    },
    {
      title: "Deep Knee Drive",
      description: "Improve knee bend and edge engagement.",
      duration: "8 MIN",
      difficulty: "Beginner",
      category: "On-Ice",
      image: "/report-v2/report-v2-drill-knee.jpg",
    },
    {
      title: "Balance Under Pressure",
      description: "Stay stable through contact and quick transitions.",
      duration: "10 MIN",
      difficulty: "Intermediate",
      category: "Strength",
      image: "/report-v2/report-v2-drill-balance.jpg",
    },
    {
      title: "Off-Ice Lateral Bounds",
      description: "Train single-leg power and landing control.",
      duration: "12 MIN",
      difficulty: "Advanced",
      category: "Off-Ice",
      image: "/report-v2/report-v2-drill-balance.jpg",
    },
  ],
  progress: [
    { label: "Jan 15", score: 56 },
    { label: "Feb 5", score: 64 },
    { label: "Feb 20", score: 71 },
    { label: "Mar 8", score: 78 },
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
    assessedOn: "Today",
    coachName: "POWR Coach",
    coachTitle: "AI Coach",
    coachImage: "/report-v2/report-v2-coach.jpg",
    heroImage: "/report-v2/report-v2-hero.jpg",
    analysis,
    categories: analysis.movementMetrics.map((m) => ({
      name: m.title,
      score: m.score,
      icon: "•",
    })),
    comparison: {
      youImage: "/report-v2/report-v2-skate-you.jpg",
      proImage: "/report-v2/report-v2-skate-pro.jpg",
      youAngle: "—",
      proAngle: "—",
      duration: "0:00",
    },
    priorities: [
      {
        title: analysis.priorityImprovement,
        detail: analysis.whyItMatters,
        image: "/report-v2/report-v2-priority-stride.jpg",
        tone: "critical" as const,
      },
      ...analysis.movementMetrics
        .filter((m) => m.score < 80)
        .slice(0, 2)
        .map((m, i) => ({
          title: m.title,
          detail:
            m.observations.find((o) => o.type === "improve")?.text ||
            m.explanation,
          image:
            i === 0
              ? "/report-v2/report-v2-priority-knee.jpg"
              : "/report-v2/report-v2-priority-stability.jpg",
          tone: (i === 0 ? "focus" : "steady") as "focus" | "steady",
        })),
    ].slice(0, 3),
    drills: analysis.drills.map((d, i) => ({
      title: d.title,
      description: d.description,
      duration: d.duration,
      difficulty: (["Beginner", "Intermediate", "Advanced"] as const)[
        Math.min(i, 2)
      ],
      category: "Skating" as const,
      image: "/report-v2/report-v2-drill-power.jpg",
    })),
    progress: [{ label: "Now", score: analysis.overallScore }],
    deltaVsLast: null,
  };
}
