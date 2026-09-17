"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Trophy,
  Dumbbell,
  Target,
  Sparkles,
  Play,
} from "lucide-react";
import ScoreCircle from "./ScoreCircle";
import CategoryBar from "./CategoryBar";
import VideoComparison from "./VideoComparison";
import DrillCard, { DrillMediaLightbox } from "./DrillCard";
import ProgressChart from "./ProgressChart";
import type { ReportV2Drill, ReportV2Model } from "./mockReportData";
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

const DRILL_FILTERS = ["All", "Skating", "Strength", "On-Ice", "Off-Ice"] as const;

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
  const [drillFilter, setDrillFilter] =
    useState<(typeof DRILL_FILTERS)[number]>("All");
  const [activeDrill, setActiveDrill] = useState<ReportV2Drill | null>(null);

  const scoreLabel =
    model.analysis.overallScore >= 85
      ? "EXCELLENT"
      : model.analysis.overallScore >= 70
        ? "GOOD"
        : "DEVELOPING";

  const filteredDrills = useMemo(() => {
    if (drillFilter === "All") return model.drills;
    return model.drills.filter((d) => d.category === drillFilter);
  }, [model.drills, drillFilter]);

  const progressGain =
    model.progress.length > 1
      ? model.progress[model.progress.length - 1].score - model.progress[0].score
      : 0;

  const stepContent = useMemo(() => {
    switch (REPORT_V2_STEPS[step]) {
      case "Overview":
        return (
          <section
            className="rv2-panel rv2-hero-panel"
            style={{ backgroundImage: `url(${model.heroImage})` }}
          >
            <div className="rv2-hero-overlay">
              <p className="rv2-eyebrow">AI-POWERED SKATING ASSESSMENT</p>
              <h1>Personalized feedback. Real improvement.</h1>
              <p className="rv2-lead">TRAIN SMARTER. PLAY FASTER.</p>
              <Link href={stepHref(1)} className="rv2-primary">
                View My Results →
              </Link>
              {demoMode ? (
                <p className="rv2-demo-note">
                  Preview UI with demo media. Live analyze → report is unchanged.
                </p>
              ) : null}
            </div>
          </section>
        );
      case "Score":
        return (
          <section className="rv2-panel">
            <div className="rv2-score-heading">
              <div>
                <p className="rv2-eyebrow">ASSESSMENT RESULTS</p>
                <h2>Overall score</h2>
              </div>
              <time className="rv2-date">{model.assessedOn}</time>
            </div>
            <ScoreCircle
              score={model.analysis.overallScore}
              label={scoreLabel}
              delta={model.deltaVsLast}
            />
            <blockquote className="rv2-coach">
              <p>“{model.analysis.summary}”</p>
              <footer className="rv2-coach-meta">
                <img
                  src={model.coachImage}
                  alt=""
                  className="rv2-coach-avatar"
                  width={44}
                  height={44}
                />
                <div>
                  <strong>{model.coachName}</strong>
                  <span>{model.coachTitle}</span>
                </div>
              </footer>
            </blockquote>
            <div className="rv2-quick-grid">
              <Link href={stepHref(2)} className="rv2-quick-link">
                <Sparkles size={16} />
                <strong>STRENGTHS</strong>
                <span>What you&apos;re doing well</span>
              </Link>
              <Link href={stepHref(3)} className="rv2-quick-link">
                <Target size={16} />
                <strong>IMPROVEMENTS</strong>
                <span>Key areas to focus on</span>
              </Link>
              <Link href={stepHref(4)} className="rv2-quick-link">
                <Dumbbell size={16} />
                <strong>DRILLS</strong>
                <span>Built for you</span>
              </Link>
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
                <CategoryBar
                  key={c.name}
                  name={c.name}
                  score={c.score}
                  icon={c.icon}
                />
              ))}
            </div>
            <VideoComparison
              youImage={model.comparison.youImage}
              proImage={model.comparison.proImage}
              youAngle={model.comparison.youAngle}
              proAngle={model.comparison.proAngle}
              duration={model.comparison.duration}
            />
          </section>
        );
      case "Priorities":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">TOP PRIORITIES</p>
            <h2>Focus on these areas for the biggest improvement</h2>
            <ol className="rv2-priority-list">
              {model.priorities.map((p, i) => (
                <li key={p.title} className={`is-${p.tone}`}>
                  <span>{i + 1}</span>
                  <div className="rv2-priority-copy">
                    <strong>{p.title}</strong>
                    <p>{p.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="rv2-priority-thumb"
                    style={{ backgroundImage: `url(${p.image})` }}
                    aria-label={`Preview ${p.title}`}
                    onClick={() =>
                      setActiveDrill({
                        title: p.title,
                        description: p.detail,
                        duration: "CLIP",
                        difficulty: "Intermediate",
                        category: "Skating",
                        image: p.image,
                      })
                    }
                  >
                    <Play size={14} />
                  </button>
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
            <div className="rv2-filter-row" role="tablist" aria-label="Drill filters">
              {DRILL_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={drillFilter === filter}
                  className={drillFilter === filter ? "is-active" : undefined}
                  onClick={() => setDrillFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="rv2-drill-list">
              {filteredDrills.map((d) => (
                <DrillCard key={d.title} drill={d} onOpen={setActiveDrill} />
              ))}
              {filteredDrills.length === 0 ? (
                <p className="rv2-video-note">No drills in this filter yet.</p>
              ) : null}
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
              <Trophy size={18} aria-hidden="true" />
              <div>
                <strong>
                  {model.progress.length > 1
                    ? `You're improving: +${progressGain} points.`
                    : "Save assessments to unlock progress over time."}
                </strong>
                <p>Keep up the work — you&apos;re on the right track.</p>
              </div>
            </div>
            <ul className="rv2-next-steps">
              <li>
                <Dumbbell size={16} /> Complete Week 2 Drills
                <ChevronRight size={16} />
              </li>
              <li>
                <Target size={16} /> Reassess in 4 Weeks
                <ChevronRight size={16} />
              </li>
              <li>
                <Sparkles size={16} /> Explore Coach Feedback
                <ChevronRight size={16} />
              </li>
            </ul>
            <button type="button" className="rv2-secondary">
              <Share2 size={16} /> Share My Progress
            </button>
          </section>
        );
      default:
        return null;
    }
  }, [
    model,
    scoreLabel,
    step,
    demoMode,
    drillFilter,
    filteredDrills,
    progressGain,
  ]);

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

      <DrillMediaLightbox
        drill={activeDrill}
        onClose={() => setActiveDrill(null)}
      />
    </div>
  );
}
