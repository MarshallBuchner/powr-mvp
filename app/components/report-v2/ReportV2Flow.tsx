"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import ScoreCircle from "./ScoreCircle";
import CategoryBar from "./CategoryBar";
import VideoComparison from "./VideoComparison";
import DrillCard from "./DrillCard";
import ProgressChart from "./ProgressChart";
import type { ReportV2Model } from "./mockReportData";
import {
  REPORT_V2_STEPS,
  reportV2StepHref,
} from "./reportV2Steps";
import "./report-v2.css";

type ReportV2FlowProps = {
  model: ReportV2Model;
  demoMode?: boolean;
  /** 0-based step from the URL so nav works even if JS fails to hydrate */
  initialStep?: number;
};

function stepHref(index: number) {
  return reportV2StepHref(index);
}

export default function ReportV2Flow({
  model,
  demoMode = false,
  initialStep = 0,
}: ReportV2FlowProps) {
  const step = Math.max(
    0,
    Math.min(REPORT_V2_STEPS.length - 1, initialStep),
  );
  const scoreLabel =
    model.analysis.overallScore >= 85
      ? "EXCELLENT"
      : model.analysis.overallScore >= 70
        ? "GOOD"
        : "DEVELOPING";

  const stepContent = useMemo(() => {
    switch (REPORT_V2_STEPS[step]) {
      case "Overview":
        return (
          <section className="rv2-panel rv2-hero-panel">
            <p className="rv2-eyebrow">AI-POWERED SKATING ASSESSMENT</p>
            <h1>Personalized feedback. Real improvement.</h1>
            <p className="rv2-lead">TRAIN SMARTER. PLAY FASTER.</p>
            <Link href={stepHref(1)} className="rv2-primary">
              View My Results →
            </Link>
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
            <Link href={stepHref(4)} className="rv2-primary">
              View Recommended Drills →
            </Link>
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
            <Link href={stepHref(5)} className="rv2-primary">
              View Full Development Plan →
            </Link>
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
          {step + 1}/{REPORT_V2_STEPS.length} · {REPORT_V2_STEPS[step]}
        </span>
      </header>

      <nav className="rv2-tabs" aria-label="Report sections">
        {REPORT_V2_STEPS.map((label, index) => (
          <Link
            key={label}
            href={stepHref(index)}
            className={index === step ? "is-active" : undefined}
            aria-current={index === step ? "step" : undefined}
            scroll={false}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div key={REPORT_V2_STEPS[step]} className="rv2-stage">
        {stepContent}
      </div>

      <footer className="rv2-footer-nav">
        {step === 0 ? (
          <span className="rv2-nav-btn is-disabled" aria-disabled="true">
            <ChevronLeft size={18} /> Back
          </span>
        ) : (
          <Link href={stepHref(step - 1)} className="rv2-nav-btn" scroll={false}>
            <ChevronLeft size={18} /> Back
          </Link>
        )}
        {step === REPORT_V2_STEPS.length - 1 ? (
          <span className="rv2-nav-btn is-next is-disabled" aria-disabled="true">
            Next <ChevronRight size={18} />
          </span>
        ) : (
          <Link
            href={stepHref(step + 1)}
            className="rv2-nav-btn is-next"
            scroll={false}
          >
            Next <ChevronRight size={18} />
          </Link>
        )}
      </footer>
    </div>
  );
}
