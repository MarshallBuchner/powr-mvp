export interface GoalProfile {
  analysisMessages: string[];
  coachSummary: string;

  finalRecommendation: {
    heading: string;
    summary: string;
    primaryFocus: string;
    reassessment: string;
    practiceGoal: string;
  };
}

export const goalProfiles: Record<string, GoalProfile> = {
  Acceleration: {
    analysisMessages: [
      "Measuring first-step explosiveness",
      "Tracking stride length",
      "Evaluating push efficiency",
    ],

    coachSummary:
      "I focused today’s assessment on your acceleration mechanics. You already create strong forward momentum and maintain good balance through your opening strides. The biggest opportunity is completing each push farther behind your body and staying lower through the full stride so you can generate more power early.",

    finalRecommendation: {
      heading: "Build more power into your first three strides.",
      summary:
        "Your acceleration foundation is already strong. Over the next two weeks, focus on staying lower, completing each push, and driving through the heel before beginning recovery. Those changes should help you create speed sooner without simply working harder.",
      primaryFocus: "Stride Extension",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },

  "Edge Control": {
    analysisMessages: [
      "Tracking edge transitions",
      "Measuring turning mechanics",
      "Evaluating edge stability",
    ],

    coachSummary:
      "I focused today’s assessment on your edge control. You show strong stability through turns and directional changes, with controlled weight transfer throughout the movement. The next step is holding each edge slightly longer and staying centered as you transition from one edge to the other.",

    finalRecommendation: {
      heading: "Make each edge feel more deliberate.",
      summary:
        "You already show good control during turns and transitions. Over the next two weeks, focus on staying centered over the blade and holding each edge slightly longer before changing direction. Smooth, patient transitions should improve both control and speed.",
      primaryFocus: "Edge Transitions",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },

  Balance: {
    analysisMessages: [
      "Tracking upper-body stability",
      "Measuring weight transfer",
      "Evaluating body control",
    ],

    coachSummary:
      "I focused today’s assessment on your balance and body control. Your upper body stays composed through most of the movement, giving you a strong foundation to build from. Maintaining a deeper stance and keeping your chest centered during longer pushes should improve your stability even further.",

    finalRecommendation: {
      heading: "Stay centered and let the lower body do the work.",
      summary:
        "Your upper-body control gives you a solid foundation. Over the next two weeks, focus on keeping your chest centered, maintaining a deeper stance, and avoiding unnecessary movement above the waist. Better stability should make every stride feel more controlled.",
      primaryFocus: "Body Control",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },

  "Stride efficiency": {
    analysisMessages: [
      "Measuring stride completion",
      "Tracking recovery mechanics",
      "Evaluating energy efficiency",
    ],
  
    coachSummary:
      "I focused today’s assessment on your stride efficiency. Your rhythm is consistent and your recovery movement remains controlled. The biggest gains should come from finishing each stride more completely and returning the recovery skate beneath your hips more quickly.",
  
    finalRecommendation: {
      heading: "Get more from every stride.",
      summary:
        "Your stride rhythm is already consistent. Over the next two weeks, focus on finishing each push fully and returning the recovery skate beneath your hips sooner. The goal is not to skate harder—it is to create more speed with less wasted movement.",
      primaryFocus: "Stride Completion",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },
  
  "Overall skating": {
    analysisMessages: [
      "Reviewing overall skating mechanics",
      "Comparing balance, stride, and edge control",
      "Identifying your biggest opportunities",
    ],
  
    coachSummary:
      "I focused today's assessment on your overall skating mechanics. I looked at your balance, stride quality, edge control, and movement efficiency to identify the areas that will have the biggest impact on your skating.",
  
    finalRecommendation: {
      heading: "Build on your skating foundation.",
      summary:
        "You already have several solid skating fundamentals. Over the next two weeks, focus on completing each stride while maintaining a deeper skating stance. Those two improvements should produce the biggest overall gains.",
      primaryFocus: "Overall Skating",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },

  Crossovers: {
    analysisMessages: [
      "Tracking crossover timing",
      "Measuring weight transfer",
      "Evaluating push-under mechanics",
    ],
  
    coachSummary:
      "I focused today’s assessment on your crossover mechanics. Your movement stays controlled through the turn, and you maintain a good base of balance. The biggest opportunity is generating more power from the underneath leg and keeping your weight transfer smooth throughout each crossover.",
  
    finalRecommendation: {
      heading: "Create more power through every crossover.",
      summary:
        "Your crossover foundation is solid. Over the next two weeks, focus on driving the underneath leg harder and keeping your upper body centered through the turn. That should help you carry more speed without losing control.",
      primaryFocus: "Under-Push Power",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },

  "Backward skating": {
    analysisMessages: [
      "Tracking backward stride mechanics",
      "Measuring C-cut power",
      "Evaluating backward balance",
    ],
  
    coachSummary:
      "I focused today’s assessment on your backward skating. You maintain good control and stay balanced through most of the movement. The biggest opportunity is staying lower through each stride and generating more power from every C-cut.",
  
    finalRecommendation: {
      heading: "Generate more power skating backwards.",
      summary:
        "Your backward skating already shows good control. Over the next two weeks, focus on deeper knee bend, stronger C-cuts, and allowing each push to finish before recovering the skate.",
      primaryFocus: "Backward Power",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },
  Transitions: {
    analysisMessages: [
      "Tracking direction changes",
      "Measuring foot timing",
      "Evaluating body position through transitions",
    ],
  
    coachSummary:
      "I focused today’s assessment on your transitions. You stay composed while changing direction and maintain good balance through most of the movement. The biggest opportunity is improving foot timing and staying lower as you move between forward and backward skating.",
  
    finalRecommendation: {
      heading: "Make every transition smoother and more controlled.",
      summary:
        "Your transitions already show a good base of balance and control. Over the next two weeks, focus on staying low, keeping your chest centered, and moving your feet quickly without rushing your upper body.",
      primaryFocus: "Transition Timing",
      reassessment: "2 Weeks",
      practiceGoal: "2–3 Sessions / Week",
    },
  },
};