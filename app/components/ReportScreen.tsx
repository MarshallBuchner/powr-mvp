"use client";

import { demoAnalysis } from "./analysisData";

import { useEffect, useState } from "react";

import type { AnalysisRequest } from "./types";

import { goalProfiles } from "./goalProfiles";

type ReportScreenProps = {
  request: AnalysisRequest;
  onRestart: () => void;
};

const analysis = demoAnalysis;


export default function ReportScreen({
  request,
  onRestart,
}: ReportScreenProps) {

  const goalProfile =
  goalProfiles[request.goal] ?? goalProfiles.Acceleration;

const personalizedCoachSummary =
  goalProfile.coachSummary;
  const [displayScore, setDisplayScore] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);


  useEffect(() => {
    let animationFrame = 0;
    const duration = 1300;
    const startTime = performance.now();

    function animateScore(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(analysis.overallScore * easedProgress));

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

          <p className="level">{analysis.tier}</p>

          <p className="percentile">{analysis.tierDescription}</p>

          <p className="score-note">
            {analysis.scoreNote}
          </p>
        </div>
      </section>

      <section className="coach-summary reveal reveal-second">
        <div className="coach-summary-icon">AI</div>

        <div>
          <p className="eyebrow">POWR AI Coach</p>

          <h2>Assessment summary</h2>

          <p className="coach-summary-text">
  {personalizedCoachSummary}
</p>

          <div className="coach-confidence">
            <div className="confidence-score">
              <span>{analysis.confidence.score}%</span>
              <small>Assessment Confidence</small>
            </div>

            <div className="confidence-details">
              <div>✓ {analysis.confidence.analyzedFrames} analyzed frames</div>
              <div>✓ {analysis.confidence.trackedLandmarks} tracked landmarks</div>
              <div>✓ {analysis.confidence.strideCycles} completed stride cycles</div>
            </div>
          </div>
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
          {analysis.strengths.map((strength, index) => (
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
            <p className="eyebrow">Complete skating profile</p>
            <h2>Movement breakdown</h2>
          </div>

          <span className="section-count">06</span>
        </div>

        <div className="movement-grid">
  {analysis.movementMetrics.map((metric, index) => (
    <article
      className="movement-card animated-card"
      style={{ animationDelay: `${650 + index * 110}ms` }}
      key={metric.title}
    >
      <div className="movement-card-top">
        <div>
          <h3>{metric.title}</h3>

          <p>{metric.explanation}</p>

          <div className="ai-observations">
            <p className="observation-title">Coach&apos;s Notes</p>

            {metric.observations.map((item, observationIndex) => (
              <div
                className="observation-row"
                key={`${metric.title}-${observationIndex}`}
              >
                <span>{item.type === "good" ? "✅" : "⚠️"}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>

          {metric.whyItMatters && (
            <div className="why-it-matters">
              <h4>💡 Why This Matters</h4>
              <p>{metric.whyItMatters}</p>
            </div>
          )}
        </div>

        <span className="movement-score">{metric.score}</span>
      </div>

      <div className="metric-track">
        <div
          className="metric-fill"
          style={{
            width: `${metric.score}%`,
            animationDelay: `${850 + index * 110}ms`,
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
          {analysis.improvements.map((item, index) => (
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

      <section className="performance-gain reveal reveal-fourth">
        <div className="performance-gain-heading">
          <div>
            <p className="eyebrow">Projected development impact</p>
            <h2>Estimated performance gain</h2>
          </div>

          <span className="gain-icon">↗</span>
        </div>

        <p className="performance-gain-intro">
          By improving your stride extension and knee bend over the next 6–8
          weeks, your skating profile could show gains in these areas:
        </p>

        <div className="gain-grid">
          {analysis.projectedGains.map((gain) => (
            <div className="gain-stat" key={gain.label}>
              <span>{gain.value}</span>
              <p>{gain.label}</p>
            </div>
          ))}
        </div>

        <p className="gain-disclaimer">
          Prototype projection shown for demonstration purposes. Future estimates
          will be calculated from the player&apos;s measured skating data and
          comparable development profiles.
        </p>
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
        {goalProfile.drills.map((drill, index) => (
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
        <div className="coach-final">
          <p className="eyebrow">Coach's Recommendation</p>

          <h2>{goalProfile.finalRecommendation.heading}</h2>

          <p className="coach-final-text">
          {goalProfile.finalRecommendation.summary}
          </p>

          <div className="next-focus-grid">
            <div className="focus-box">
              <small>🎯 Primary Focus</small>
              <strong>{goalProfile.finalRecommendation.primaryFocus}</strong>
            </div>

            <div className="focus-box">
              <small>📅 Reassessment</small>
              <strong>{goalProfile.finalRecommendation.reassessment}</strong>
            </div>

            <div className="focus-box">
              <small>⏱ Practice Goal</small>
              <strong>{goalProfile.finalRecommendation.practiceGoal}</strong>
            </div>
          </div>
        </div>

        <button type="button" onClick={onRestart}>
          Upload Your Next Session →
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

        .coach-final-text {
          max-width: 700px;
          margin: 18px 0 32px;
          color: #b1c2b9;
          line-height: 1.8;
        }
        
        .next-focus-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        
        .focus-box {
          padding: 20px;
          border: 1px solid rgba(109,255,174,.15);
          border-radius: 18px;
          background: rgba(255,255,255,.035);
        }
        
        .focus-box small {
          display: block;
          margin-bottom: 10px;
          color: #8ea197;
          font-size: .72rem;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        
        .focus-box strong {
          display: block;
          color: #f5fff9;
          font-size: 1.05rem;
        }

        .report-hero {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 48px;
          align-items: center;
          padding: 48px 0 64px;
        }

        .performance-gain {
          width: min(1120px, 100%);
          margin: 54px auto;
          padding: 36px;
          border: 1px solid rgba(109, 255, 174, 0.2);
          border-radius: 28px;
          background:
            radial-gradient(
              circle at top right,
              rgba(109, 255, 174, 0.13),
              transparent 34%
            ),
            rgba(255, 255, 255, 0.035);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
        }
        
        .performance-gain-heading {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
        }
        
        .gain-icon {
          display: grid;
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid rgba(109, 255, 174, 0.25);
          border-radius: 16px;
          background: rgba(109, 255, 174, 0.1);
          color: #72f2ac;
          font-size: 1.7rem;
          font-weight: 800;
        }
        
        .performance-gain-intro {
          max-width: 760px;
          margin: 22px 0 30px;
          color: #b1c2b9;
          line-height: 1.7;
        }
        
        .gain-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        
        .gain-stat {
          padding: 24px 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(5, 15, 10, 0.42);
          text-align: center;
        }
        
        .gain-stat span {
          display: block;
          color: #72f2ac;
          font-size: clamp(1.8rem, 4vw, 2.7rem);
          font-weight: 800;
          letter-spacing: -0.04em;
        }
        
        .gain-stat p {
          margin: 8px 0 0;
          color: #91a39a;
          font-size: 0.88rem;
          font-weight: 600;
        }
        
        .gain-disclaimer {
          margin: 24px 0 0;
          color: #718279;
          font-size: 0.78rem;
          line-height: 1.6;
        }

        .coach-summary {
          width: min(1120px, 100%);
          margin: 0 auto 54px;
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 24px;
          align-items: flex-start;
          padding: 32px;
          border: 1px solid rgba(109, 255, 174, 0.16);
          border-radius: 26px;
          background:
            linear-gradient(
              135deg,
              rgba(109, 255, 174, 0.08),
              rgba(255, 255, 255, 0.025)
            );
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.2);
        }
        
        .coach-summary-icon {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(109, 255, 174, 0.28);
          border-radius: 18px;
          background: rgba(109, 255, 174, 0.1);
          color: #72f2ac;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        
        .coach-summary h2 {
          margin-bottom: 16px;
        }
        
        .coach-summary-text {
          max-width: 850px;
          margin: 0;
          color: #b1c2b9;
          font-size: 1.05rem;
          line-height: 1.75;
        }

        .why-it-matters {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        
        .why-it-matters h4 {
          margin: 0 0 10px;
          color: #72f2ac;
          font-size: .82rem;
          font-weight: 700;
          letter-spacing: .05em;
        }
        
        .why-it-matters p {
          margin: 0;
          color: #b1c2b9;
          line-height: 1.6;
        }

        .coach-confidence {
          display: flex;
          gap: 28px;
          align-items: center;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        
        .confidence-score {
          min-width: 130px;
          text-align: center;
        }
        
        .confidence-score span {
          display: block;
          font-size: 2.5rem;
          font-weight: 800;
          color: #72f2ac;
          line-height: 1;
        }
        
        .confidence-score small {
          color: #91a39a;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: .7rem;
        }
        
        .confidence-details {
          display: grid;
          gap: 10px;
          color: #b1c2b9;
          font-size: .95rem;
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

        .percentile {
          margin: 8px 0 0;
          color: #72f2ac;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.04em;
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

        .movement-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        
        .movement-card {
          padding: 26px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.035);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }
        
        .movement-card:hover {
          transform: translateY(-4px);
          border-color: rgba(109, 255, 174, 0.2);
          background: rgba(109, 255, 174, 0.045);
        }
        
        .movement-card-top {
          display: flex;
          justify-content: space-between;
          gap: 24px;
        }
        
        .movement-card h3 {
          margin: 0;
          font-size: 1.12rem;
        }
        
        .movement-card p {
          margin: 10px 0 0;
          color: #91a39a;
          line-height: 1.55;
        }
        
        .movement-score {
          flex-shrink: 0;
          color: #6dffae;
          font-size: 1.75rem;
          font-weight: 800;
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

        .feedback-section {
          margin-top: 72px;
        }
        
        .feedback-section h2 {
          margin-bottom: 14px;
        }
        
        .feedback-intro {
          max-width: 680px;
          margin: 0 0 28px;
          color: #91a39a;
          line-height: 1.7;
        }
        
        .feedback-card {
          display: grid;
          gap: 16px;
          padding: 30px;
          border: 1px solid rgba(109, 255, 174, 0.16);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.035);
        }
        
        .feedback-card label {
          color: #f5fff9;
          font-size: 0.9rem;
          font-weight: 700;
        }
        
        .feedback-stars {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .feedback-stars button {
          padding: 0;
          background: transparent;
          color: #63756b;
          font-size: 2rem;
          line-height: 1;
        }
        
        .feedback-stars button:hover {
          color: #72f2ac;
          box-shadow: none;
          transform: scale(1.08);
        }

        .feedback-stars button.star-selected {
          color: #72f2ac;
        }
        
        .feedback-card textarea,
        .feedback-card select {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          outline: none;
          background: rgba(5, 15, 10, 0.5);
          color: #f5fff9;
          font: inherit;
        }
        
        .feedback-card textarea {
          resize: vertical;
        }
        
        .feedback-card textarea::placeholder {
          color: #718279;
        }
        
        .feedback-card textarea:focus,
        .feedback-card select:focus {
          border-color: rgba(109, 255, 174, 0.4);
        }
        
        .submit-feedback {
          justify-self: start;
          margin-top: 8px;
        }

        .feedback-thank-you {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          padding: 32px 16px;
        }
        
        .feedback-heart {
          font-size: 3rem;
          line-height: 1;
        }
        
        .feedback-thank-you h3 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .feedback-thank-you p {
          max-width: 520px;
          color: #91a39a;
          line-height: 1.7;
        }

        .analyze-another-button {
          margin-top: 10px;
        }

        @media (max-width: 820px) {
          .report-shell {
            padding-top: 24px;
          }

          .gain-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        
          .movement-grid {
            grid-template-columns: 1fr;
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

          .next-focus-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .report-shell {
            padding-inline: 16px;
          }

          .coach-confidence {
            flex-direction: column;
            align-items: flex-start;
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

          .performance-gain {
            padding: 26px 20px;
          }
          
          .gain-grid {
            grid-template-columns: 1fr;
          }

          .next-focus-grid {
            grid-template-columns: 1fr;
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

<section className="report-section feedback-section reveal">
  <h2>❤️ Help Shape POWR</h2>

  <p className="feedback-intro">
    Thanks for trying the POWR beta. Your feedback helps us build a better
    hockey coaching experience for players everywhere.
  </p>

  <div className="feedback-card">
  {feedbackSubmitted ? (
    <div className="feedback-thank-you">
    <div className="feedback-heart">❤️</div>
  
    <h3>Thank you for helping build POWR.</h3>
  
    <p>
      Your feedback helps us improve the coaching experience for hockey
      players everywhere.
    </p>
  
    <button
      className="analyze-another-button"
      type="button"
      onClick={onRestart}
    >
      Analyze Another Video →
    </button>
  </div>
  ) : (
    <>
      <label>⭐ Overall Experience</label>

      <div className="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={star <= feedbackRating ? "star-selected" : ""}
            onClick={() => setFeedbackRating(star)}
            aria-label={`Rate POWR ${star} out of 5 stars`}
          >
            ★
          </button>
        ))}
      </div>

      <label>What was the most valuable part of your report?</label>

      <textarea
        rows={4}
        placeholder="Tell us what helped you the most..."
      />

      <label>What could we improve?</label>

      <textarea
        rows={4}
        placeholder="Anything confusing or missing?"
      />

      <label>Would you use POWR again?</label>

      <select defaultValue="">
        <option value="" disabled>
          Select an option...
        </option>

        <option>Definitely</option>
        <option>Probably</option>
        <option>Maybe</option>
        <option>Probably Not</option>
        <option>No</option>
      </select>

      <button
        className="submit-feedback"
        type="button"
        onClick={() => setFeedbackSubmitted(true)}
      >
        Submit Feedback
      </button>
    </>
  )}
</div>

</section>

    </main>
  );
}