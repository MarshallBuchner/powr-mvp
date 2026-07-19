"use client";

import { useEffect, useState } from "react";

import type { AnalysisRequest } from "./types";

type ReportScreenProps = {
  request: AnalysisRequest;
  onRestart: () => void;
};

const overallScore = 84;

const strengths = [
  {
    title: "Edge Control",
    description: "Strong stability through directional changes and turns.",
    score: 88,
  },
  {
    title: "Balance",
    description: "Maintains a controlled upper body throughout the stride.",
    score: 84,
  },
  {
    title: "Stride Rhythm",
    description: "Consistent tempo with efficient recovery between pushes.",
    score: 81,
  },
];

const improvements = [
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
];

const drills = [
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
];

export default function ReportScreen({
  request,
  onRestart,
}: ReportScreenProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    const duration = 1300;
    const startTime = performance.now();

    function animateScore(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(overallScore * easedProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateScore);
      }
    }

    animationFrame = requestAnimationFrame(animateScore);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <main className="report-shell">
      <section className="report-hero reveal reveal-first">
        <div>
          <p className="eyebrow">POWR Development Report</p>

          <h1>Your skating profile is ready.</h1>

          <p className="intro">
            We analyzed <strong>{request.fileName}</strong> with a focus on{" "}
            <strong>{request.goal}</strong>.
          </p>
        </div>

        <div className="score-card">
          <p className="score-label">Overall development score</p>

          <div
            className="score-ring"
            style={{
              background: `
                radial-gradient(circle, #0d1913 58%, transparent 59%),
                conic-gradient(
                  #6dffae 0 ${displayScore}%,
                  rgba(255, 255, 255, 0.08) ${displayScore}% 100%
                )
              `,
            }}
          >
            <span>{displayScore}</span>
          </div>

          <p className="level">Advanced Recreational</p>

          <p className="score-note">
            Strong mechanics with clear opportunities to improve power and
            acceleration.
          </p>
        </div>
      </section>

      <section className="report-section reveal reveal-second">
        <div className="section-heading">
          <div>
            <p className="eyebrow">What you do well</p>
            <h2>Core strengths</h2>
          </div>

          <span className="section-count">03</span>
        </div>

        <div className="strength-grid">
          {strengths.map((strength, index) => (
            <article
              className="metric-card animated-card"
              style={{ animationDelay: `${500 + index * 130}ms` }}
              key={strength.title}
            >
              <div className="metric-top">
                <h3>{strength.title}</h3>
                <span>{strength.score}</span>
              </div>

              <p>{strength.description}</p>

              <div className="metric-track">
                <div
                  className="metric-fill"
                  style={{
                    width: `${strength.score}%`,
                    animationDelay: `${750 + index * 130}ms`,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section reveal reveal-third">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Where to focus next</p>
            <h2>Highest-impact improvements</h2>
          </div>

          <span className="section-count">02</span>
        </div>

        <div className="improvement-grid">
          {improvements.map((item, index) => (
            <article
              className="improvement-card animated-card"
              style={{ animationDelay: `${850 + index * 140}ms` }}
              key={item.title}
            >
              <span className="impact-pill">{item.impact}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section reveal reveal-fourth">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Personalized training plan</p>
            <h2>Recommended drills</h2>
          </div>

          <span className="section-count">03</span>
        </div>

        <div className="drill-list">
          {drills.map((drill, index) => (
            <article
              className="drill-card animated-card"
              style={{ animationDelay: `${1050 + index * 130}ms` }}
              key={drill.number}
            >
              <div className="drill-number">{drill.number}</div>

              <div className="drill-content">
                <div className="drill-heading">
                  <h3>{drill.title}</h3>
                  <span>{drill.duration}</span>
                </div>

                <p>{drill.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="report-footer reveal reveal-fifth">
        <div>
          <p className="eyebrow">Next analysis</p>
          <h2>Track your progress over time.</h2>
          <p>
            Upload another skating clip after practicing these drills and
            compare your development.
          </p>
        </div>

        <button type="button" onClick={onRestart}>
          Analyze another clip
        </button>
      </section>

      <style jsx>{`
        .report-shell {
          min-height: 100vh;
          padding: 56px 24px 80px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at top right,
              rgba(107, 255, 178, 0.09),
              transparent 28%
            ),
            #07100c;
          color: #f5fff9;
        }

        .report-hero,
        .report-section,
        .report-footer {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .report-hero {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 48px;
          align-items: center;
          padding: 48px 0 64px;
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          animation: reveal-section 700ms cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }

        .reveal-first {
          animation-delay: 80ms;
        }

        .reveal-second {
          animation-delay: 240ms;
        }

        .reveal-third {
          animation-delay: 400ms;
        }

        .reveal-fourth {
          animation-delay: 560ms;
        }

        .reveal-fifth {
          animation-delay: 720ms;
        }

        .eyebrow {
          margin: 0 0 14px;
          color: #72f2ac;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        h1 {
          max-width: 720px;
          margin: 0;
          font-size: clamp(3rem, 7vw, 6.4rem);
          line-height: 0.94;
          letter-spacing: -0.06em;
        }

        .intro {
          max-width: 620px;
          margin: 26px 0 0;
          color: #a9b8b0;
          font-size: 1.05rem;
          line-height: 1.7;
        }

        .intro strong {
          color: #f5fff9;
          font-weight: 600;
        }

        .score-card {
          padding: 34px;
          border: 1px solid rgba(150, 255, 200, 0.16);
          border-radius: 28px;
          background: rgba(12, 26, 19, 0.82);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          text-align: center;
          backdrop-filter: blur(18px);
          animation: score-card-glow 2.6s ease-in-out infinite alternate;
        }

        .score-label {
          margin: 0 0 24px;
          color: #a9b8b0;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .score-ring {
          width: 176px;
          height: 176px;
          margin: 0 auto 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          box-shadow:
            0 0 34px rgba(109, 255, 174, 0.18),
            inset 0 0 28px rgba(0, 0, 0, 0.45);
          transition: background 60ms linear;
        }

        .score-ring span {
          font-size: 4.4rem;
          font-weight: 800;
          letter-spacing: -0.08em;
          animation: score-number-in 700ms ease-out both;
        }

        .level {
          margin: 0;
          font-size: 1.12rem;
          font-weight: 700;
        }

        .score-note {
          margin: 10px 0 0;
          color: #91a39a;
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .report-section {
          padding: 54px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        h2 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.2rem);
          letter-spacing: -0.04em;
        }

        .section-count {
          color: #63756b;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .strength-grid,
        .improvement-grid {
          display: grid;
          gap: 18px;
        }

        .strength-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .improvement-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .metric-card,
        .improvement-card,
        .drill-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.035);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }

        .metric-card:hover,
        .improvement-card:hover,
        .drill-card:hover {
          transform: translateY(-4px);
          border-color: rgba(109, 255, 174, 0.2);
          background: rgba(109, 255, 174, 0.045);
        }

        .animated-card {
          opacity: 0;
          transform: translateY(20px);
          animation: card-in 650ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .metric-card {
          padding: 26px;
          border-radius: 22px;
        }

        .metric-top,
        .drill-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .metric-card h3,
        .improvement-card h3,
        .drill-card h3 {
          margin: 0;
          font-size: 1.12rem;
        }

        .metric-top span {
          color: #6dffae;
          font-size: 1.4rem;
          font-weight: 800;
        }

        .metric-card p,
        .improvement-card p,
        .drill-card p,
        .report-footer p {
          color: #91a39a;
          line-height: 1.6;
        }

        .metric-track {
          height: 7px;
          margin-top: 24px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
        }

        .metric-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #45db8a, #88ffc1);
          box-shadow: 0 0 16px rgba(109, 255, 174, 0.28);
          transform: scaleX(0);
          transform-origin: left;
          animation: metric-grow 900ms cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }

        .improvement-card {
          min-height: 210px;
          padding: 28px;
          border-radius: 24px;
        }

        .impact-pill {
          display: inline-flex;
          margin-bottom: 36px;
          padding: 7px 11px;
          border: 1px solid rgba(109, 255, 174, 0.2);
          border-radius: 999px;
          background: rgba(109, 255, 174, 0.07);
          color: #78f8b2;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .drill-list {
          display: grid;
          gap: 14px;
        }

        .drill-card {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 22px;
          align-items: center;
          padding: 24px;
          border-radius: 20px;
        }

        .drill-number {
          color: #6dffae;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .drill-heading span {
          color: #718279;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .drill-card p {
          margin: 10px 0 0;
        }

        .report-footer {
          display: flex;
          justify-content: space-between;
          gap: 32px;
          align-items: center;
          margin-top: 56px;
          padding: 38px;
          border: 1px solid rgba(109, 255, 174, 0.16);
          border-radius: 26px;
          background: linear-gradient(
            135deg,
            rgba(109, 255, 174, 0.08),
            rgba(255, 255, 255, 0.025)
          );
        }

        .report-footer p:last-child {
          max-width: 640px;
          margin-bottom: 0;
        }

        button {
          flex-shrink: 0;
          padding: 15px 22px;
          border: 0;
          border-radius: 999px;
          background: #72f2ac;
          color: #07100c;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(109, 255, 174, 0.22);
        }

        @keyframes reveal-section {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes card-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes metric-grow {
          to {
            transform: scaleX(1);
          }
        }

        @keyframes score-number-in {
          from {
            opacity: 0;
            transform: scale(0.82);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes score-card-glow {
          from {
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          }

          to {
            box-shadow:
              0 24px 70px rgba(0, 0, 0, 0.28),
              0 0 38px rgba(109, 255, 174, 0.08);
          }
        }

        @media (max-width: 820px) {
          .report-shell {
            padding-top: 24px;
          }

          .report-hero,
          .strength-grid,
          .improvement-grid {
            grid-template-columns: 1fr;
          }

          .report-hero {
            gap: 32px;
          }

          .score-card {
            max-width: 420px;
          }

          .report-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 560px) {
          .report-shell {
            padding-inline: 16px;
          }

          .section-heading {
            align-items: flex-start;
          }

          .drill-card {
            grid-template-columns: 1fr;
          }

          .drill-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal,
          .animated-card,
          .metric-fill,
          .score-card,
          .score-ring span {
            opacity: 1;
            transform: none;
            animation: none;
          }

          .metric-card,
          .improvement-card,
          .drill-card,
          button {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}