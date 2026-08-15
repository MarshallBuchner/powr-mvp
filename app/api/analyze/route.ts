import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { frames, goal } = body;

    if (!Array.isArray(frames) || frames.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No video frames were provided.",
        },
        { status: 400 },
      );
    }

    const imageInputs = frames.map((frame: string) => ({
      type: "input_image" as const,
      image_url: frame,
      detail: "high" as const,
    }));

    const response = await openai.responses.create({
      model: "gpt-5.6",

      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are POWR, an AI hockey development coach.

You are reviewing still frames sampled chronologically from a hockey player's skating video.

The player's selected development goal is: ${goal}.

Only evaluate things that can reasonably be observed from these frames.

Important rules:
- Do not invent skating speed.
- Do not invent exact joint angles.
- Do not claim to observe complete stride cycles if the frames do not show them.
- Do not claim biomechanical certainty from limited evidence.
- If evidence is limited, lower confidence rather than making something up.
- Scores should reflect the visible evidence and should not automatically be high.
- Keep feedback encouraging, specific, and coach-like.
- Prioritize useful development advice over technical jargon.

Evaluate:
- skating stance and knee bend
- stride extension
- stride recovery
- balance and stability
- upper-body posture
- overall mechanics relevant to the selected goal

Return a development assessment suitable for POWR.
              `.trim(),
            },
            ...imageInputs,
          ],
        },
      ],

      text: {
        format: {
          type: "json_schema",
          name: "powr_skating_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              overallScore: {
                type: "integer",
                minimum: 0,
                maximum: 100,
              },

              summary: {
                type: "string",
              },

              strengths: {
                type: "array",
                items: {
                  type: "string",
                },
              },

              priorityImprovement: {
                type: "string",
              },

              whyItMatters: {
                type: "string",
              },

              movementMetrics: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: "string",
                    },

                    score: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100,
                    },

                    explanation: {
                      type: "string",
                    },

                    observations: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          type: {
                            type: "string",
                            enum: ["good", "improve"],
                          },

                          text: {
                            type: "string",
                          },
                        },
                        required: ["type", "text"],
                      },
                    },

                    whyItMatters: {
                      type: "string",
                    },
                  },
                  required: [
                    "title",
                    "score",
                    "explanation",
                    "observations",
                    "whyItMatters",
                  ],
                },
              },

              drills: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: "string",
                    },

                    description: {
                      type: "string",
                    },

                    duration: {
                      type: "string",
                    },
                  },
                  required: ["title", "description", "duration"],
                },
              },

              confidence: {
                type: "object",
                additionalProperties: false,
                properties: {
                  score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                  },

                  label: {
                    type: "string",
                    enum: ["Low", "Moderate", "High"],
                  },

                  reason: {
                    type: "string",
                  },
                },
                required: ["score", "label", "reason"],
              },
            },

            required: [
              "overallScore",
              "summary",
              "strengths",
              "priorityImprovement",
              "whyItMatters",
              "movementMetrics",
              "drills",
              "confidence",
            ],
          },
        },
      },
    });

    const analysis = JSON.parse(response.output_text);

    return Response.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("POWR analysis error:", error);

    return Response.json(
      {
        success: false,
        error: "Analysis request failed.",
      },
      { status: 500 },
    );
  }
}