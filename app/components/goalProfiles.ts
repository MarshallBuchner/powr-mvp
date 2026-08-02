export interface GoalDrill {
  number: string;
  title: string;
  duration: string;
  description: string;
}

export interface GoalProfile {
  analysisMessages: string[];
  coachSummary: string;
  drills: GoalDrill[];

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

      drills: [
        {
          number: "01",
          title: "Three-Step Starts",
          duration: "5 repetitions · 10 metres",
          description:
            "Focus on creating maximum power through your first three strides while staying low and driving forward.",
        },
        {
          number: "02",
          title: "Falling Starts",
          duration: "4 sets · 4 repetitions",
          description:
            "Lean forward until balance forces the first step, then explode into three quick, powerful strides.",
        },
        {
          number: "03",
          title: "Full-Extension Strides",
          duration: "3 sets · 30 seconds",
          description:
            "Finish every push through the heel before recovering the skate beneath your hips.",
        },
      ],

    finalRecommendation: {
      heading: "Build more power into your first three strides.",
      summary:
        "Your acceleration foundation is already strong. Over the next two weeks, focus on staying lower, completing each push, and driving through the heel before beginning recovery. Those changes should help you create speed sooner without simply working harder.",
      primaryFocus: "Stride Extension",
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
  
      drills: [
        {
          number: "01",
          title: "Full-Extension Strides",
          duration: "3 sets · 30 seconds",
          description:
            "Finish each push completely before recovering the skate beneath your hips.",
        },
        {
          number: "02",
          title: "Quick-Recovery Strides",
          duration: "4 repetitions · half ice",
          description:
            "Focus on returning the recovery skate quickly under the body without shortening the push.",
        },
        {
          number: "03",
          title: "Tempo Strides",
          duration: "3 sets · 20 seconds",
          description:
            "Maintain a smooth, repeatable stride rhythm while minimizing unnecessary upper-body movement.",
        },
      ],

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

      drills: [
        {
          number: "01",
          title: "Full-Extension Strides",
          duration: "3 sets · 30 seconds",
          description:
            "Finish each push through the heel while maintaining a deep, stable skating stance.",
        },
        {
          number: "02",
          title: "Edge-Control Figure Eights",
          duration: "4 repetitions · each direction",
          description:
            "Use controlled inside and outside edges while keeping your upper body centered.",
        },
        {
          number: "03",
          title: "Low-Stance Glides",
          duration: "4 repetitions · full ice",
          description:
            "Hold a deep knee bend with the chest upright to improve balance, control, and efficiency.",
        },
      ],

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
  
      drills: [
        {
          number: "01",
          title: "Circle Crossovers",
          duration: "5 laps · each direction",
          description:
            "Focus on smooth weight transfer and driving through the underneath leg on every crossover.",
        },
        {
          number: "02",
          title: "Figure-8 Crossovers",
          duration: "4 repetitions",
          description:
            "Maintain speed while transitioning smoothly between left and right crossovers.",
        },
        {
          number: "03",
          title: "Power Crossovers",
          duration: "3 sets · 20 seconds",
          description:
            "Generate maximum speed by pushing aggressively underneath your body while staying low.",
        },
      ],

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
  
      drills: [
        {
          number: "01",
          title: "Backward C-Cuts",
          duration: "5 repetitions · full ice",
          description:
            "Generate powerful C-cuts while staying low and allowing each push to finish completely.",
        },
        {
          number: "02",
          title: "Backward Starts",
          duration: "4 sets · 5 metres",
          description:
            "Explode backwards from a stationary position using strong first C-cuts and controlled balance.",
        },
        {
          number: "03",
          title: "Backward Glide & Recover",
          duration: "3 sets · 30 seconds",
          description:
            "Alternate between powerful backward pushes and controlled recovery to build efficiency.",
        },
      ],

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
  
      drills: [
        {
          number: "01",
          title: "Forward-to-Backward Transitions",
          duration: "5 repetitions · each direction",
          description:
            "Focus on smooth edge changes while keeping your chest centered and your feet moving quickly.",
        },
        {
          number: "02",
          title: "Mohawk Transitions",
          duration: "4 repetitions · each side",
          description:
            "Develop balance and edge control by opening the hips and transitioning without losing speed.",
        },
        {
          number: "03",
          title: "Transition Acceleration",
          duration: "3 sets · full ice",
          description:
            "Accelerate immediately after every transition to eliminate hesitation between direction changes.",
        },
      ],

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