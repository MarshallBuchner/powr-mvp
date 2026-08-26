import type { RealAnalysis } from "./types";

export const sampleAnalysis: RealAnalysis = {
  overallScore: 82,

  summary:
    "Strong overall acceleration mechanics with good forward intent and solid stride power. The biggest opportunity is staying lower through the first few strides to generate more force into the ice and build speed faster.",

  strengths: [
    "Strong forward body angle during acceleration",
    "Good full-stride extension once up to speed",
    "Controlled upper-body movement",
  ],

  priorityImprovement:
    "Stay lower through the first three acceleration strides.",

  whyItMatters:
    "A deeper knee bend allows you to apply more force into the ice and produce stronger, more explosive first steps.",

  movementMetrics: [
    {
      title: "Knee Flexion",
      score: 76,
      explanation:
        "Your skating position is generally strong, but you become slightly upright during the first few acceleration strides.",
      observations: [
        {
          type: "good",
          text: "Good athletic posture once up to speed.",
        },
        {
          type: "improve",
          text: "Stay more compressed during the first three strides.",
        },
      ],
      whyItMatters:
        "Greater knee flexion helps create stronger pushes and improves acceleration.",
    },
    {
      title: "Stride Extension",
      score: 88,
      explanation:
        "You demonstrate strong extension through the hip, knee and ankle during your power phase.",
      observations: [
        {
          type: "good",
          text: "Strong extension through the majority of the stride.",
        },
        {
          type: "improve",
          text: "Reach full extension slightly earlier during acceleration.",
        },
      ],
      whyItMatters:
        "Complete extension helps maximize the amount of force transferred into each stride.",
    },
    {
      title: "Body Position",
      score: 84,
      explanation:
        "Your upper body stays controlled with a useful forward lean during acceleration.",
      observations: [
        {
          type: "good",
          text: "Good forward intent without excessive upper-body movement.",
        },
        {
          type: "improve",
          text: "Maintain the forward angle as speed increases.",
        },
      ],
      whyItMatters:
        "Efficient body positioning helps direct more of your force toward forward acceleration.",
    },
  ],

  drills: [
    {
      title: "3-Step Explosion",
      description:
        "Start from a low athletic stance and focus on three powerful, aggressive strides while staying compressed.",
      duration: "3 sets × 5 reps",
    },
    {
      title: "Wall Drive Starts",
      description:
        "Use a wall for support and rehearse a deep forward body angle while driving through each leg.",
      duration: "2 sets × 8 reps per side",
    },
    {
      title: "Low Stance Accelerations",
      description:
        "Perform short accelerations while deliberately maintaining deeper knee flexion through the first few strides.",
      duration: "5 × 10–15 m",
    },
  ],

  confidence: {
    score: 91,
    label: "High",
    reason:
      "The skater remains clearly visible and the clip provides a useful side-angle view of the acceleration mechanics.",
  },
};