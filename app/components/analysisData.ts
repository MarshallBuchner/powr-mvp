export interface MovementMetric {
  title: string;
  score: number;
  explanation: string;

  observations: {
    type: "good" | "improve";
    text: string;
  }[];

  whyItMatters?: string;
}

export interface Strength {
  title: string;
  description: string;
  score: number;
}

export interface Improvement {
  title: string;
  description: string;
  impact: string;
}

export interface ProjectedGain {
  label: string;
  value: string;
}

export interface Drill {
  number: string;
  title: string;
  duration: string;
  description: string;
}

export interface AnalysisResult {
  overallScore: number;
  tier: string;
  tierDescription: string;
  scoreNote: string;
  coachSummary: string;

  confidence: {
    score: number;
    analyzedFrames: number;
    trackedLandmarks: number;
    strideCycles: number;
  };

  movementMetrics: MovementMetric[];
  strengths: Strength[];
  improvements: Improvement[];
  projectedGains: ProjectedGain[];
  drills: Drill[];

  finalRecommendation: {
    heading: string;
    summary: string;
    primaryFocus: string;
    reassessment: string;
    practiceGoal: string;
  };
}

export const demoAnalysis: AnalysisResult = {
  overallScore: 84,
  tier: "⚡ Competitive",
  tierDescription: "Competitive development tier",
  scoreNote:
    "Strong mechanics with clear opportunities to improve power and acceleration.",

  coachSummary:
    "Your skating profile shows strong balance, edge control, and consistent stride rhythm. Your biggest opportunity is completing each stride with greater extension and maintaining a deeper knee bend. Improving those two areas should help you generate more power, accelerate faster, and conserve energy during longer shifts.",

  confidence: {
    score: 97,
    analyzedFrames: 512,
    trackedLandmarks: 18,
    strideCycles: 12,
  },

  movementMetrics: [
    {
      title: "Acceleration",
      score: 86,
      explanation: "Strong opening strides with good forward momentum.",
      observations: [
        {
          type: "good",
          text: "Strong first-step explosiveness.",
        },
        {
          type: "good",
          text: "Good forward body position during acceleration.",
        },
        {
          type: "improve",
          text: "Complete each push farther behind the body to generate more speed.",
        },
      ],

      whyItMatters:
  "Improving stride extension allows you to transfer more force into the ice, leading to quicker acceleration, better top speed, and improved skating efficiency.",
    },
    {
      title: "Edge Control",
      score: 88,
      explanation:
        "Stable weight transfer through turns and direction changes.",
      observations: [
        {
          type: "good",
          text: "Strong stability while changing direction.",
        },
        {
          type: "good",
          text: "Weight transfer stays controlled through turns.",
        },
        {
          type: "improve",
          text: "Hold the outside edge slightly longer before transitioning.",
        },
      ],
    },
    {
      title: "Balance",
      score: 84,
      explanation: "Controlled upper body with consistent skating posture.",
      observations: [
        {
          type: "good",
          text: "Upper-body movement stays controlled throughout the stride.",
        },
        {
          type: "good",
          text: "Skating posture remains stable during weight transfer.",
        },
        {
          type: "improve",
          text: "Keep the chest slightly more centered during longer pushes.",
        },
      ],
    },
    {
      title: "Stride Recovery",
      score: 78,
      explanation:
        "Recovery is consistent but can return beneath the body faster.",
      observations: [
        {
          type: "good",
          text: "Recovery movement remains consistent from stride to stride.",
        },
        {
          type: "improve",
          text: "Bring the recovery skate back beneath the hips more quickly.",
        },
        {
          type: "improve",
          text: "Reduce the time the recovery leg stays outside the body line.",
        },
      ],
    },
    {
      title: "Knee Bend",
      score: 76,
      explanation: "A deeper stance would improve power and acceleration.",
      observations: [
        {
          type: "good",
          text: "Balance remains controlled while skating in a lowered stance.",
        },
        {
          type: "improve",
          text: "Maintain deeper knee flexion throughout the full push.",
        },
        {
          type: "improve",
          text: "Avoid rising too early as the stride reaches full extension.",
        },
      ],
    },
    {
      title: "Hip Extension",
      score: 81,
      explanation:
        "Good extension, with room to finish each push more completely.",
      observations: [
        {
          type: "good",
          text: "Hip drive contributes well to forward momentum.",
        },
        {
          type: "good",
          text: "Extension remains controlled without excessive upper-body rotation.",
        },
        {
          type: "improve",
          text: "Finish the final portion of each push before beginning recovery.",
        },
      ],
    },
  ],

  strengths: [
    {
      title: "Edge Control",
      description: "Strong stability through directional changes and turns.",
      score: 88,
    },
    {
      title: "Balance",
      description:
        "Maintains a controlled upper body throughout the stride.",
      score: 84,
    },
    {
      title: "Stride Rhythm",
      description:
        "Consistent tempo with efficient recovery between pushes.",
      score: 81,
    },
  ],

  improvements: [
    {
      title: "Stride Extension",
      description:
        "Finish each push farther behind the body to generate more speed.",
      impact: "Highest impact",
    },
    {
      title: "Knee Bend",
      description:
        "A deeper skating position will improve power, balance, and acceleration.",
      impact: "High impact",
    },
  ],

  projectedGains: [
    {
      label: "Acceleration",
      value: "+8%",
    },
    {
      label: "Top Speed",
      value: "+4%",
    },
    {
      label: "Skating Efficiency",
      value: "+12%",
    },
    {
      label: "Blue-Line Sprint",
      value: "-0.18 sec",
    },
  ],

  drills: [
    {
      number: "01",
      title: "Full-Extension Strides",
      duration: "3 sets · 30 seconds",
      description:
        "Focus on completing every push through the heel before recovering.",
    },
    {
      number: "02",
      title: "Low-Stance Glides",
      duration: "4 repetitions · full ice",
      description:
        "Hold a deep knee bend while keeping the chest upright and stable.",
    },
    {
      number: "03",
      title: "Explosive Starts",
      duration: "5 repetitions · 10 metres",
      description:
        "Use three powerful opening strides before transitioning into full speed.",
    },
  ],

  finalRecommendation: {
    heading: "You're closer than you think.",
    summary:
      "Your balance and edge control already provide an excellent foundation. Over the next two weeks, focus on completing every stride and maintaining a deeper knee bend instead of simply skating harder. Small technical improvements should produce the biggest gains.",
    primaryFocus: "Stride Extension",
    reassessment: "2 Weeks",
    practiceGoal: "2–3 Sessions / Week",
  },
};