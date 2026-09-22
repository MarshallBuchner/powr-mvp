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
          setUnlimited(isUnlimited);
          setRemaining(data.remaining ?? getLocalRemainingAssessments());
          setNeedsUpgrade(
            isUnlimited ? false : !(data.canRun ?? localCanRunAssessment()),
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

    if (!unlimited && !localCanRunAssessment()) {
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

  const quotaPrimary = unlimited
    ? "Founder access — unlimited assessments"
    : remaining > 0
      ? `${remaining} free assessment${remaining === 1 ? "" : "s"} remaining`
      : "Free assessment used — unlock a pack to continue";

  const showPackHint = !unlimited && remaining > 0 && remaining <= 1 && !needsUpgrade;

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
      {showPackHint ? (
        <p className="assessment-quota-hint">
          Then {ASSESSMENT_PACK_CREDITS} more assessments for{" "}
          {ASSESSMENT_PACK_PRICE_CAD} — no subscription.
        </p>
      ) : null}

      {needsUpgrade ? (
        <UpgradePanel source="upload_card" remaining={remaining} />
      ) : null}

      <button
        className="primary-button"
        type="button"
        disabled={!selectedFile || needsUpgrade}
        onClick={() => handleAnalyze()}
      >
        <span>Analyze My Skating</span>
        <span className="button-arrow">→</span>
      </button>

      <p className="privacy-note">
        Your full video file stays on this device. POWR only sends short sampled
        frames to generate your assessment — we don&apos;t store the video file.
        Saving a report keeps analysis text (scores and notes) in your account,
        not the clip.{" "}
        <Link href="/privacy">Privacy Policy</Link>
      </p>
      <details className="privacy-details">
        <summary>How POWR handles your video</summary>
        <ul>
          <li>
            The video file itself is not uploaded to POWR storage and is not
            saved with your account.
          </li>
          <li>
            A few compressed still frames are sent for analysis so we can build
            your report.
          </li>
          <li>
            Saved assessments store report data tied to your account — not the
            original video.
          </li>
          <li>
            Because the video is never stored on our servers, there is no separate
            “delete video” control. To remove a saved report from your history,
            contact us (in-app deletion is not available yet). Details are in our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </li>
          <li>
            Frames are used to generate your assessment. We do not use your
            video to train POWR models; third-party processor policies still
            apply. See the <Link href="/privacy">Privacy Policy</Link> for the full
            picture.
          </li>
        </ul>
      </details>
    </section>
  );
}
