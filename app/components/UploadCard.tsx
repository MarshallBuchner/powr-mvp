"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import GoalSelector from "./GoalSelector";
import type { AnalysisEvidenceMoment, AnalysisRequest } from "./types";
import { track } from "@vercel/analytics";
import UpgradePanel from "./UpgradePanel";
import AnalysisProcessingPanel, {
  type ProcessingStageId,
  useProcessingStage,
} from "./AnalysisProcessingPanel";
import {
  getLocalRemainingAssessments,
  localCanRunAssessment,
  localConsumeAssessment,
  readLocalEntitlements,
  syncEntitlementCookie,
  writeLocalEntitlements,
} from "./assessmentEntitlements";
import {
  ASSESSMENT_PACK_CREDITS,
  ASSESSMENT_PACK_PRICE_CAD,
  remainingAssessments,
} from "@/lib/assessmentBilling";
import { stashEvidenceFrames } from "./evidenceStorage";

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

function formatTimestamp(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

type ExtractedFrame = {
  dataUrl: string;
  timeSeconds: number;
  timeLabel: string;
};

async function extractVideoFrames(
  file: File,
  frameCount = 5,
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error("Could not create canvas context."));
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    const frames: ExtractedFrame[] = [];

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;

      for (let i = 0; i < frameCount; i++) {
        const time =
          frameCount === 1
            ? duration / 2
            : (duration * i) / (frameCount - 1);

        const seekTime = Math.min(time, Math.max(duration - 0.05, 0));
        video.currentTime = seekTime;

        await new Promise<void>((seekResolve) => {
          video.onseeked = () => seekResolve();
        });

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        frames.push({
          dataUrl: canvas.toDataURL("image/jpeg", 0.72),
          timeSeconds: seekTime,
          timeLabel: formatTimestamp(seekTime),
        });
      }

      URL.revokeObjectURL(videoUrl);
      resolve(frames);
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Could not read video."));
    };
  });
}

function buildEvidenceMoments(
  frames: ExtractedFrame[],
  priorityText: string,
): AnalysisEvidenceMoment[] {
  if (!frames.length) return [];

  const mid = frames[Math.floor(frames.length / 2)];
  const late = frames[frames.length - 1] ?? mid;
  const caption =
    priorityText.trim() || "Primary development moment from your clip";

  const moments: AnalysisEvidenceMoment[] = [
    {
      timeLabel: mid.timeLabel,
      caption,
      dataUrl: mid.dataUrl,
    },
  ];

  if (late.timeLabel !== mid.timeLabel) {
    moments.push({
      timeLabel: late.timeLabel,
      caption: "Supporting moment from the same clip",
      dataUrl: late.dataUrl,
    });
  }

  return moments.slice(0, 2);
}

type UploadCardProps = {
  onAnalyze: (request: AnalysisRequest) => void;
};

export default function UploadCard({ onAnalyze }: UploadCardProps) {
  const [selectedGoal, setSelectedGoal] = useState("Overall skating");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stageOverride, setStageOverride] = useState<ProcessingStageId | null>(
    null,
  );
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [remaining, setRemaining] = useState(1);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingStage = useProcessingStage(isAnalyzing, stageOverride);

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
          setRemaining(data.remaining ?? getLocalRemainingAssessments());
          setNeedsUpgrade(!(data.canRun ?? localCanRunAssessment()));
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
    setCanRetry(false);
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
    setCanRetry(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleAnalyze() {
    if (!selectedFile || !previewUrl || isAnalyzing) {
      return;
    }

    if (!localCanRunAssessment()) {
      setNeedsUpgrade(true);
      setCanRetry(false);
      track("upgrade_viewed", { source: "upload_blocked" });
      setError("You've used your free assessment. Unlock a pack to continue.");
      return;
    }

    track("analyze_clicked", {
      goal: selectedGoal,
      remaining: getLocalRemainingAssessments(),
    });

    setIsAnalyzing(true);
    setStageOverride("upload");
    setError("");
    setCanRetry(false);

    try {
      const frames = await extractVideoFrames(selectedFile, 5);
      setStageOverride("analyze");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frames: frames.map((frame) => frame.dataUrl),
          goal: selectedGoal,
        }),
      });

      const result = await response.json();

      if (response.status === 402 || result.error === "free_assessment_used") {
        setNeedsUpgrade(true);
        setRemaining(0);
        setCanRetry(false);
        track("upgrade_viewed", { source: "analyze_402" });
        throw new Error(
          result.message ||
            "You've used your free assessment. Unlock a pack to continue.",
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Analysis failed.");
      }

      setStageOverride("report");

      if (result.entitlements) {
        writeLocalEntitlements(result.entitlements);
        setRemaining(
          result.remaining ?? remainingAssessments(result.entitlements),
        );
        setNeedsUpgrade((result.remaining ?? 0) <= 0);
      } else {
        const next = localConsumeAssessment();
        setRemaining(remainingAssessments(next));
        setNeedsUpgrade(!localCanRunAssessment());
      }

      track("analysis_succeeded", {
        goal: selectedGoal,
        remaining: result.remaining,
      });

      const evidenceMoments = buildEvidenceMoments(
        frames,
        result.analysis?.priorityImprovement || "",
      );
      stashEvidenceFrames(evidenceMoments);

      onAnalyze({
        file: selectedFile,
        fileName: selectedFile.name,
        videoUrl: previewUrl,
        goal: selectedGoal,
        duration,
        analysis: result.analysis,
        evidenceMoments,
      });
    } catch (error) {
      console.error("POWR analysis failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "POWR couldn't analyze this video. Please try again.",
      );
      setCanRetry(Boolean(selectedFile) && localCanRunAssessment());
    } finally {
      setIsAnalyzing(false);
      setStageOverride(null);
    }
  }

  const quotaPrimary =
    remaining > 0
      ? `${remaining} free assessment${remaining === 1 ? "" : "s"} remaining`
      : "Free assessment used — unlock a pack to continue";

  const showPackHint = remaining > 0 && remaining <= 1 && !needsUpgrade;

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
                disabled={isAnalyzing}
              >
                Replace
              </button>

              <button
                className="remove-button"
                type="button"
                onClick={removeFile}
                disabled={isAnalyzing}
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

      {isAnalyzing ? (
        <AnalysisProcessingPanel
          stage={processingStage}
          fileName={selectedFile?.name}
        />
      ) : null}

      {error && (
        <div className="upload-error" role="alert">
          <span className="error-icon">!</span>
          <div className="upload-error-body">
            <span>{error}</span>
            {canRetry && selectedFile ? (
              <button
                type="button"
                className="retry-analysis-button"
                onClick={() => void handleAnalyze()}
              >
                Retry analysis
              </button>
            ) : null}
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
        disabled={!selectedFile || isAnalyzing || needsUpgrade}
        onClick={() => void handleAnalyze()}
      >
        <span>
          {isAnalyzing ? "Analyzing your skating…" : "Analyze My Skating"}
        </span>

        {!isAnalyzing && <span className="button-arrow">→</span>}
      </button>

      <p className="privacy-note">
        Your selected video stays on this device during prototype mode.
      </p>
    </section>
  );
}
