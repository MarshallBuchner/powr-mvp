"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { track } from "@vercel/analytics";
import ScoreCircle from "./ScoreCircle";
import CategoryBar from "./CategoryBar";
import VideoComparison from "./VideoComparison";
import DrillCard, { DrillMediaLightbox } from "./DrillCard";
import ProgressChart from "./ProgressChart";
import MediaSlideshow from "./MediaSlideshow";
import UpgradePanel from "../UpgradePanel";
import type { ReportV2Drill, ReportV2Model } from "./mockReportData";
import {
  REPORT_V2_STEPS,
  reportV2StepHref,
} from "./reportV2Steps";
import {
  getLocalRemainingAssessments,
  localCanRunAssessment,
  fetchEntitlementBalance,
} from "../assessmentEntitlements";
import { stashPendingAssessment } from "../assessmentStorage";
import { useAuth } from "../AuthProvider";
import { getScoreBand, scoreInterpretation } from "../scoreBands";
import "./report-v2.css";

type ReportV2FlowProps = {
  model: ReportV2Model;
  demoMode?: boolean;
  isSample?: boolean;
  /** True when viewing an already-persisted /r/[id] assessment */
  alreadySaved?: boolean;
  /** Live analysis payload needed to save (guest stash or signed-in POST) */
  savePayload?: {
    goal: string;
    fileName: string;
    duration: number | null;
    analysis: unknown;
  } | null;
  /** 0-based step from the URL so nav works even if JS fails to hydrate */
  initialStep?: number;
  /** Path for step links — live share uses /r, /r/sample, /r/[id] */
  basePath?: string;
  /** Preserve query params like live `d=` when changing steps */
  searchParams?: string;
  onRestart?: () => void;
};

const DRILL_FILTERS = ["All", "Skating", "Strength", "On-Ice", "Off-Ice"] as const;

export default function ReportV2Flow({
  model,
  demoMode = false,
  isSample = false,
  alreadySaved = false,
  savePayload = null,
  initialStep = 0,
  basePath = "/r/v2",
  searchParams = "",
  onRestart,
}: ReportV2FlowProps) {
  const router = useRouter();
  const { configured, user } = useAuth();
  const tabsRef = useRef<HTMLElement | null>(null);
  const step = Math.max(
    0,
    Math.min(REPORT_V2_STEPS.length - 1, initialStep),
  );
  const [drillFilter, setDrillFilter] =
    useState<(typeof DRILL_FILTERS)[number]>("All");
  const [activeDrill, setActiveDrill] = useState<ReportV2Drill | null>(null);
  const [remaining, setRemaining] = useState(() => getLocalRemainingAssessments());
  const [unlimited, setUnlimited] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const isSavedView = alreadySaved || saveStatus === "saved";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const balance = await fetchEntitlementBalance();
      if (!cancelled && balance) {
        setRemaining(balance.remaining);
        setUnlimited(Boolean(balance.unlimited));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the active tab visible inside the horizontally scrollable strip.
  useEffect(() => {
    const nav = tabsRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>("a.is-active");
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [step]);

  const stepHref = (index: number) =>
    reportV2StepHref(index, { basePath, searchParams });

  const scoreBand = getScoreBand(model.analysis.overallScore);
  const scoreLabel = scoreBand.ringLabel;

  const confidenceLabel =
    model.analysis.confidence.label === "Moderate"
      ? "Medium"
      : model.analysis.confidence.label;

  const scoreInterpretationText = scoreInterpretation(
    model.analysis.overallScore,
    model.analysis.priorityImprovement,
  );

  async function handleSaveAssessment() {
    if (demoMode || isSample || !savePayload || isSavedView) return;
    // Guests always enter the existing login/signup flow with a pending stash.
    // Auth configuration is only required for the signed-in save POST.
    if (!user) {
      stashPendingAssessment(savePayload);
      track("save_cta_clicked", { state: "guest" });
      router.push("/login?next=/assessments");
      return;
    }
    if (!configured) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });
      if (!res.ok) throw new Error("save_failed");
      setSaveStatus("saved");
      track("assessment_saved", { goal: savePayload.goal, ui: "v2" });
    } catch (error) {
      console.error("POWR save failed:", error);
      setSaveStatus("error");
    }
  }

  const filteredDrills = useMemo(() => {
    if (drillFilter === "All") return model.drills;
    return model.drills.filter((d) => d.category === drillFilter);
  }, [model.drills, drillFilter]);

  const prioritySlides = useMemo(
    () =>
      model.priorities.map((p) => ({
        image: p.image,
        title: p.title,
        caption: p.detail,
      })),
    [model.priorities],
  );

  const drillSlides = useMemo(
    () =>
      filteredDrills.map((d) => ({
        image: d.image,
        title: d.title,
        caption: `${d.category} · ${d.duration}`,
      })),
    [filteredDrills],
  );

  const progressGain =
    model.progress.length > 1
      ? model.progress[model.progress.length - 1].score -
        model.progress[0].score
      : 0;

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My POWR Assessment",
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareStatus("copied");
        window.setTimeout(() => setShareStatus("idle"), 2000);
      }
      track("report_shared", { source: "report_v2", sample: isSample });
    } catch {
      // User cancelled share sheet — ignore.
    }
  }

  function handleNextSession() {
    if (!isSample && !demoMode && !localCanRunAssessment()) {
      track("upgrade_viewed", { source: "report_v2_next_session" });
      document
        .querySelector(".rv2-upgrade-wrap")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onRestart?.();
  }

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
              <Link href={stepHref(1)} className="rv2-primary" scroll={false}>
                View My Results →
              </Link>
              {demoMode ? (
                <p className="rv2-demo-note">
                  Preview UI with demo media.
                </p>
              ) : (
                <p className="rv2-demo-note">
                  Focus: {model.goal} · Score {model.analysis.overallScore}
                </p>
              )}
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
            <p className="rv2-score-interpretation">{scoreInterpretationText}</p>
            <p className="rv2-score-disclaimer">
              AI development estimate — not a scouting grade.
            </p>
            <div className="rv2-confidence-pill">
              <span>Confidence</span>
              <strong>{confidenceLabel}</strong>
            </div>
            <blockquote className="rv2-coach">
              <p>“{model.analysis.summary}”</p>
              <footer className="rv2-coach-meta">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {model.analysis.strengths?.length ? (
              <ul className="rv2-strength-list">
                {model.analysis.strengths.slice(0, 3).map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            ) : null}
            <div className="rv2-quick-grid">
              <Link href={stepHref(2)} className="rv2-quick-link" scroll={false}>
                <Sparkles size={16} />
                <strong>STRENGTHS</strong>
                <span>What you&apos;re doing well</span>
              </Link>
              <Link href={stepHref(3)} className="rv2-quick-link" scroll={false}>
                <Target size={16} />
                <strong>IMPROVEMENTS</strong>
                <span>Key areas to focus on</span>
              </Link>
              <Link href={stepHref(4)} className="rv2-quick-link" scroll={false}>
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
              note={
                demoMode
                  ? "Demo stills with pose-style overlays. Live clips + real angles plug in later."
                  : "Your evidence frames next to a pro reference. Pose overlays come next."
              }
            />
          </section>
        );
      case "Priorities":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">TOP PRIORITIES</p>
            <h2>Focus on these areas for the biggest improvement</h2>
            <MediaSlideshow
              slides={prioritySlides}
              label="Priority clips"
              onSelect={(slide) => {
                const match = model.priorities.find(
                  (p) => p.title === slide.title,
                );
                if (!match) return;
                setActiveDrill({
                  title: match.title,
                  description: match.detail,
                  duration: "CLIP",
                  difficulty: "Intermediate",
                  category: "Skating",
                  image: match.image,
                });
              }}
            />
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
            <Link href={stepHref(4)} className="rv2-primary" scroll={false}>
              View Recommended Drills →
            </Link>
          </section>
        );
      case "Drills":
        return (
          <section className="rv2-panel">
            <p className="rv2-eyebrow">YOUR RECOMMENDED DRILLS</p>
            <h2>AI-built for your development plan</h2>
            <div
              className="rv2-filter-row"
              role="tablist"
              aria-label="Drill filters"
            >
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
            <MediaSlideshow
              slides={drillSlides}
              label="Drill examples"
              onSelect={(slide) => {
                const match = filteredDrills.find(
                  (d) => d.title === slide.title,
                );
                if (match) setActiveDrill(match);
              }}
            />
            <div className="rv2-drill-list">
              {filteredDrills.map((d) => (
                <DrillCard key={d.title} drill={d} onOpen={setActiveDrill} />
              ))}
              {filteredDrills.length === 0 ? (
                <p className="rv2-video-note">No drills in this filter yet.</p>
              ) : null}
            </div>
            <Link href={stepHref(5)} className="rv2-primary" scroll={false}>
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
                    : "Reassess after focused practice to unlock progress over time."}
                </strong>
                <p>Keep up the work — you&apos;re on the right track.</p>
              </div>
            </div>
            <ul className="rv2-next-steps">
              <li>
                <Dumbbell size={16} /> Complete recommended drills
                <ChevronRight size={16} />
              </li>
              <li>
                <Target size={16} /> Reassess in 3–5 sessions
                <ChevronRight size={16} />
              </li>
              <li>
                <Sparkles size={16} /> Review coach feedback
                <ChevronRight size={16} />
              </li>
            </ul>

            {!demoMode && !isSample && !unlimited && remaining <= 0 ? (
              <div className="rv2-upgrade-wrap">
                <UpgradePanel source="report" remaining={remaining} compact />
              </div>
            ) : null}

            {!demoMode && !isSample && savePayload ? (
              <div className="rv2-save-cta">
                {isSavedView ? (
                  <p className="rv2-save-saved">
                    Saved to My Assessments ✓{" "}
                    <Link href="/assessments">Open history</Link>
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      className="rv2-primary"
                      onClick={() => void handleSaveAssessment()}
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving"
                        ? "Saving…"
                        : saveStatus === "error"
                          ? "Save failed — try again"
                          : "Save my assessment"}
                    </button>
                    <p className="rv2-save-note">
                      {user
                        ? "Keep this report in your POWR account and track your development."
                        : "Create a free account to keep this report and track your development."}
                    </p>
                  </>
                )}
              </div>
            ) : null}

            <button
              type="button"
              className="rv2-secondary"
              onClick={() => void handleShare()}
            >
              <Share2 size={16} />{" "}
              {shareStatus === "copied"
                ? "Link copied"
                : isSample
                  ? "Share this demo report"
                  : "Share My Progress"}
            </button>

            {onRestart ? (
              <button
                type="button"
                className="rv2-primary rv2-next-session"
                onClick={handleNextSession}
              >
                Upload Your Next Session →
              </button>
            ) : null}
          </section>
        );
      default:
        return null;
    }
  }, [
    model,
    scoreLabel,
    scoreInterpretationText,
    confidenceLabel,
    step,
    demoMode,
    isSample,
    alreadySaved,
    isSavedView,
    savePayload,
    saveStatus,
    user,
    drillFilter,
    filteredDrills,
    progressGain,
    prioritySlides,
    drillSlides,
    remaining,
    unlimited,
    shareStatus,
    onRestart,
    basePath,
    searchParams,
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

      <nav
        ref={tabsRef}
        className="rv2-tabs"
        aria-label="Report sections"
      >
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
          <Link
            href={stepHref(step - 1)}
            className="rv2-nav-btn"
            scroll={false}
          >
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
