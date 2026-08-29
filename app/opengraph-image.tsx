import { ImageResponse } from "next/og";

export const alt = "POWR | AI Hockey Development";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "radial-gradient(circle at 85% 15%, rgba(168,255,56,0.18), transparent 35%), #07100c",
          color: "#f5fff9",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 900,
              letterSpacing: "-7px",
              fontStyle: "italic",
            }}
          >
            POWR
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 8,
              color: "#a8ff38",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "4px",
            }}
          >
            AI HOCKEY DEVELOPMENT
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 900,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-4px",
            }}
          >
            <span>Train smarter.</span>
            <span>Play faster.</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 26,
              color: "#b7c4bd",
              fontSize: 27,
              lineHeight: 1.35,
            }}
          >
            Upload your skating video. Get personalized AI-powered feedback,
            development insights, and drills.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#a8ff38",
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          <span>UPLOAD</span>
          <span>•</span>
          <span>ANALYZE</span>
          <span>•</span>
          <span>IMPROVE</span>
        </div>
      </div>
    ),
    size,
  );
}