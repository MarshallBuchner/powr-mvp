"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import GoalSelector from "./GoalSelector";
import type { AnalysisRequest } from "./types";
import { track } from "@vercel/analytics";
import UpgradePanel from "./UpgradePanel";
import {
  getLocalRemainingAssessments,
  localCanRunAssessment,
  readLocalEntitlements,
  syncEntitlementCookie,
  writeLocalEntitlements,
} from "./assessmentEntitlements";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PACK_PRICE_CAD,
} from "@/lib/assessmentBilling";
import {
  ageGateMessage,
  canStartAnalysis,
  type AgeBand,
} from "@/lib/consent";

const goals = [
  "Overall skating",
  "Acceleration",
  "Stride efficiency",
  "Crossovers",
  "Backward skating",
  "Transitions",
];

const MAX_FILE_SIZE = 250 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "Unknown";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

type UploadCardProps = {
  onAnalyze: (request: AnalysisRequest) => void;
};

export default function UploadCard({ onAnalyze }: UploadCardProps) {
  const [selectedGoal, setSelectedGoal] = useState("Overall skating");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [remaining, setRemaining] = useState(1);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [unlimited, setUnlimited] = useState(false);
  const [foundingAthlete, setFoundingAthlete] = useState(false);
  const [foundingMonthRemaining, setFoundingMonthRemaining] = useState(0);
  const [foundingExpiresAt, setFoundingExpiresAt] = useState<string | null>(
    null,
  );
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [consented, setConsented] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRemaining(getLocalRemainingAssessments());
    setNeedsUpgrade(!localCanRunAssessment());

    void (async () => {
      try {
        const res = await fetch("/api/assessments/entitlement");
        if (!res.ok) return;
        const data = await res.json();
        if (data && typeof data.freeUsed === "number") {
          writeLocalEntitlements({
            freeUsed: data.freeUsed,
            credits: data.credits || 0,
            unlockedSessionIds: data.unlockedSessionIds || [],
          });
          const isUnlimited = Boolean(data.unlimited);
          const isFounding = Boolean(data.foundingAthlete);
          const foundingLeft =
            typeof data.foundingMonthRemaining === "number"
              ? data.foundingMonthRemaining
              : 0;
          setUnlimited(isUnlimited);
          setFoundingAthlete(isFounding);
          setFoundingMonthRemaining(foundingLeft);
          setFoundingExpiresAt(data.foundingExpiresAt ?? null);
          setRemaining(data.remaining ?? getLocalRemainingAssessments());
          // Hide upgrades while complimentary Founding assessments remain.
          setNeedsUpgrade(
            isUnlimited || (isFounding && foundingLeft > 0)
              ? false
              : !(data.canRun ?? localCanRunAssessment()),
          );
        } else {
          await syncEntitlementCookie(readLocalEntitlements());
        }
      } catch {
        // Keep local entitlement state if sync is unavailable.
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl((current) => {
        if (current.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return "";
      });
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return objectUrl;
    });
  }, [selectedFile]);

  function validateAndSelectFile(file: File) {
    setError("");
    setDuration(null);

    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Your video is a little too large for the beta (250 MB max). Try trimming it to 10–30 seconds and upload again.",
      );
      return;
    }

    setSelectedFile(file);

    track("video_selected", {
      goal: selectedGoal,
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      validateAndSelectFile(file);
    }
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      validateAndSelectFile(file);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    setDuration(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleAnalyze() {
    if (!selectedFile || !previewUrl) {
      return;
    }

    const ageMessage = ageGateMessage(ageBand);
    if (ageMessage) {
      setError(ageMessage);
      return;
    }

    if (!canStartAnalysis({ ageBand, consented })) {
      setError(
        "Confirm your age eligibility and analysis consent before continuing.",
      );
      return;
    }

    if (
      !unlimited &&
      !(foundingAthlete && foundingMonthRemaining > 0) &&
      !localCanRunAssessment()
    ) {
      if (foundingAthlete && foundingMonthRemaining <= 0) {
        setNeedsUpgrade(false);
        setError(
          "You've used this month's complimentary Founding Athlete assessments. They renew next month.",
        );
        return;
      }
      setNeedsUpgrade(true);
      track("upgrade_viewed", { source: "upload_blocked" });
      setError("You've used your free assessment. Unlock a pack to continue.");
      return;
    }

    track("analyze_clicked", {
      goal: selectedGoal,
      remaining: getLocalRemainingAssessments(),
    });

    setError("");

    // Open Analysis Lab immediately — /api/analyze runs there with pose overlay.
    onAnalyze({
      file: selectedFile,
      fileName: selectedFile.name,
      videoUrl: previewUrl,
      goal: selectedGoal,
      duration,
    });
  }

  const analysisReady =
    Boolean(selectedFile) &&
    !needsUpgrade &&
    canStartAnalysis({ ageBand, consented });

  const quotaPrimary = unlimited
    ? "Founder access — unlimited assessments"
    : foundingAthlete
      ? foundingMonthRemaining > 0
        ? `Founding Athlete — ${foundingMonthRemaining} complimentary assessment${foundingMonthRemaining === 1 ? "" : "s"} left this month`
        : "Founding Athlete — complimentary assessments renew next month"
      : remaining > 0
        ? `${remaining} free assessment${remaining === 1 ? "" : "s"} remaining`
        : "Free assessment used — unlock a pack to continue";

  const showPackHint =
    !unlimited &&
    !foundingAthlete &&
    remaining > 0 &&
    remaining <= 1 &&
    !needsUpgrade;

  const showFoundingRenewNote =
    foundingAthlete && foundingMonthRemaining <= 0 && !unlimited;

  return (
    <section className="card upload-card" id="start-assessment">
      <div className="section-heading">
        <p className="eyebrow">START YOUR ASSESSMENT</p>
        <h2>What would you like to improve today?</h2>
        <p className="section-description">
          Choose one area you&apos;d like your assessment to focus on.
        </p>
        <p className="beta-note beta-note-compact">
          <strong>POWR BETA</strong> — AI-assisted feedback for development and
          education. Results may evolve as we improve with players and coaches.
        </p>
      </div>

      <GoalSelector
        goals={goals}
        selectedGoal={selectedGoal}
        onSelectGoal={setSelectedGoal}
      />

      <div className="upload-guidance">
        <div className="upload-guidance-heading">
          <span>📹</span>
          <strong>Record your best skating clip</strong>
        </div>

        <div className="upload-guidance-list">
          <span>✓ Keep your full body visible</span>
          <span>✓ Record from the side when possible</span>
          <span>✓ Use a clear, well-lit skating clip</span>
          <span>✓ Record 10–30 seconds of skating</span>
        </div>
      </div>

      {!selectedFile ? (
        <label
          className={`upload-zone ${isDragging ? "dragging" : ""}`}
          htmlFor="videoInput"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="upload-svg"
            >
              <path
                d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span className="upload-title">Upload skating video</span>

          <span className="upload-subtitle">
            Click to choose a file or drag and drop
          </span>

          <span className="upload-requirements">
            MP4, MOV or compatible video · Maximum 250 MB
          </span>

          <input
            ref={fileInputRef}
            id="videoInput"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="video-preview-card">
          <div className="video-frame">
            {previewUrl && (
              <video
                className="video-preview"
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                  setDuration(event.currentTarget.duration);
                }}
              />
            )}

            <div className="video-badge">READY FOR ASSESSMENT</div>
          </div>

          <div className="video-details">
            <div className="video-file-copy">
              <span className="file-label">SELECTED CLIP</span>

              <strong>{selectedFile.name}</strong>

              <div className="file-metadata">
                <span>{formatFileSize(selectedFile.size)}</span>

                <span className="metadata-dot" />

                <span>
                  {duration === null
                    ? "Reading duration..."
                    : formatDuration(duration)}
                </span>
              </div>
            </div>

            <div className="video-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={openFilePicker}
              >
                Replace
              </button>

              <button
                className="remove-button"
                type="button"
                onClick={removeFile}
              >
                Remove
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            id="replacementVideoInput"
            className="hidden-file-input"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
          />
        </div>
      )}

      <p className="upload-best-results">
        Best results: full body visible, side view, 10–30 seconds.
      </p>

      {error && (
        <div className="upload-error" role="alert">
          <span className="error-icon">!</span>
          <div className="upload-error-body">
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="analysis-summary">
        <span>Assessment focus</span>
        <strong>{selectedGoal}</strong>
      </div>

      <p className="assessment-quota-note">{quotaPrimary}</p>
      {foundingAthlete && foundingExpiresAt ? (
        <p className="assessment-quota-hint">
          Complimentary access through{" "}
          {new Date(foundingExpiresAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          .
        </p>
      ) : null}
      {showFoundingRenewNote ? (
        <p className="assessment-quota-hint">
          Your monthly Founding Athlete allowance resets automatically next
          month (no rollover).
        </p>
      ) : null}
      {showPackHint ? (
        <p className="assessment-quota-hint">
          Then {ASSESSMENT_PACK_CREDITS} more assessments for{" "}
          {ASSESSMENT_PACK_PRICE_CAD} — no subscription.
        </p>
      ) : null}

      {needsUpgrade && !foundingAthlete ? (
        <UpgradePanel source="upload_card" remaining={remaining} />
      ) : null}

      <fieldset className="consent-fieldset">
        <legend>Before we analyze</legend>
        <p className="consent-lead">
          Analysis samples a few compressed frames from your clip (and may use
          on-device pose estimates) so we can build a skating development report.
          Those frames are sent to third-party processors such as OpenAI. Your
          full video file stays on this device and is not stored by POWR.
          OpenAI API/business data is not used to train OpenAI models by default
          unless a customer explicitly opts in. Saved reports keep analysis text
          and scores — not the clip. You can request deletion of saved reports
          via support or My assessments when signed in.
        </p>

        <label className="consent-label">
          <span className="consent-label-title">Age eligibility</span>
          <select
            value={ageBand ?? ""}
            onChange={(e) =>
              setAgeBand((e.target.value || null) as AgeBand | null)
            }
            aria-required="true"
          >
            <option value="" disabled>
              Select one…
            </option>
            <option value="adult">I am 18 or older</option>
            <option value="teen">
              I am 13–17 and have parent/guardian permission to use POWR
            </option>
            <option value="under13">I am under 13</option>
          </select>
        </label>
        {ageBand === "under13" ? (
          <p className="consent-blocked" role="alert">
            {ageGateMessage("under13")}
          </p>
        ) : null}

        <label className="consent-check">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            disabled={ageBand === "under13"}
          />
          <span>
            I understand the above, agree to the{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>, and consent to analysis
            of sampled frames for this assessment.
          </span>
        </label>
      </fieldset>

      <button
        className="primary-button"
        type="button"
        disabled={!analysisReady}
        onClick={() => handleAnalyze()}
      >
        <span>Analyze My Skating</span>
        <span className="button-arrow">→</span>
      </button>

      <p className="privacy-note">
        Full details: <Link href="/privacy">Privacy Policy</Link> ·{" "}
        <Link href="/terms">Terms</Link>
      </p>
    </section>
  );
}
