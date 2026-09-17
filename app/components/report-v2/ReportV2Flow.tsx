"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import ScoreCircle from "./ScoreCircle";
import CategoryBar from "./CategoryBar";
import VideoComparison from "./VideoComparison";
import DrillCard from "./DrillCard";
import ProgressChart from "./ProgressChart";
import type { ReportV2Model } from "./mockReportData";
import "./report-v2.css";

const STEPS = [
  "Overview",
  "Score",
  "Breakdown",
  "Priorities",
  "Drills",
  "Progress",
] as const;

type ReportV2FlowProps = {
  model: ReportV2Model;
  demoMode?: boolean;
};

export default function ReportV2Flow({
  model,
  demoMode = false,
}: ReportV2FlowProps) {
  const [step, setStep] = useState(0);
  const scoreLabel =
    model.analysis.overallScore >= 85
      ? "EXCELLENT"
      : model.analysis.overallScore >= 70
        ? "GOOD"
        : "DEVELOPING";

  const stepContent = useMemo(() => {
    switch (STEPS[step]) {
      case "Overview":
        return (
          <section className="rv2-panel rv2-hero-panel">
            <p className="rv2-eyebrow">AI-POWERED SKATING ASSESSMENT</p>
            <h1>Personalized feedback. Real improvement.</h1>
            <p className="rv2-lead">TRAIN SMARTER. PLAY FASTER.</p>
            <button
              type="button"
              className="rv2-primary"
              onClick={() => setStep(1)}
            >
              View My Results →
            </button>
            {demoMode ? (
              <p className="rv2-demo-note">
                Preview UI with mock data. Live analyze → report is unchanged.
              </p>
            ) : null}
          </section>
        );
      case "Score":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">ASSESSMENT RESULTS</p>
            <h2>Overall score</h2>
            <ScoreCircle
              score={model.analysis.overallScore}
              label={scoreLabel}
              delta={model.deltaVsLast}
            />
            <blockquote className="rv2-coach">
              <p>“{model.analysis.summary}”</p>
              <cite>— {model.coachName}</cite>
            </blockquote>
            <div className="rv2-quick-grid">
              <div>
                <strong>STRENGTHS</strong>
                <span>What you&apos;re doing well</span>
              </div>
              <div>
                <strong>IMPROVEMENTS</strong>
                <span>Key areas to focus on</span>
              </div>
              <div>
                <strong>DRILLS</strong>
                <span>Built for you</span>
              </div>
            </div>
          </section>
        );
      case "Breakdown":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">TECHNIQUE BREAKDOWN</p>
            <h2>Your scores across key skating elements</h2>
            <div className="rv2-category-list">
              {model.categories.map((c) => (
                <CategoryBar key={c.name} name={c.name} score={c.score} />
              ))}
            </div>
            <VideoComparison />
          </section>
        );
      case "Priorities":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">TOP PRIORITIES</p>
            <h2>Focus on these areas for the biggest improvement</h2>
            <ol className="rv2-priority-list">
              {model.priorities.map((p, i) => (
                <li key={p.title}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>{p.title}</strong>
                    <p>{p.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="rv2-primary"
              onClick={() => setStep(4)}
            >
              View Recommended Drills →
            </button>
          </section>
        );
      case "Drills":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">YOUR RECOMMENDED DRILLS</p>
            <h2>AI-built for your development plan</h2>
            <div className="rv2-drill-list">
              {model.drills.map((d) => (
                <DrillCard key={d.title} drill={d} />
              ))}
            </div>
            <button
              type="button"
              className="rv2-primary"
              onClick={() => setStep(5)}
            >
              View Full Development Plan →
            </button>
          </section>
        );
      case "Progress":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">YOUR PROGRESS</p>
            <h2>Keep stacking sessions</h2>
            <ProgressChart points={model.progress} />
            <div className="rv2-progress-callout">
              <strong>
                {model.progress.length > 1
                  ? `You're improving: +${
                      model.progress[model.progress.length - 1].score -
                      model.progress[0].score
                    } points.`
                  : "Save assessments to unlock progress over time."}
              </strong>
              <p>Keep up the work — you&apos;re on the right track.</p>
            </div>
            <ul className="rv2-next-steps">
              <li>Complete Week 2 Drills</li>
              <li>Reassess in 4 Weeks</li>
              <li>Explore Coach Feedback</li>
            </ul>
            <button type="button" className="rv2-secondary">
              <Share2 size={16} /> Share My Progress
            </button>
          </section>
        );
      default:
        return null;
    }
  }, [model, scoreLabel, step, demoMode]);

  return (
    <div className="rv2-shell">
      <header className="rv2-topbar">
        <Link href="/" className="rv2-brand">
          POWR
        </Link>
        <span className="rv2-step-label">
          {step + 1}/{STEPS.length} · {STEPS[step]}
        </span>
      </header>

      <nav className="rv2-tabs" aria-label="Report sections">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={index === step ? "is-active" : undefined}
            onClick={() => setStep(index)}
          >
            {label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={STEPS[step]}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="rv2-stage"
        >
          {stepContent}
        </motion.div>
      </AnimatePresence>

      <footer className="rv2-footer-nav">
        <button
          type="button"
          className="rv2-nav-btn"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <button
          type="button"
          className="rv2-nav-btn is-next"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        >
          Next <ChevronRight size={18} />
        </button>
      </footer>
    </div>
  );
}
