"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import GoalSelector from "./GoalSelector";
import type { AnalysisRequest } from "./types";

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
export default function UploadCard({
  onAnalyze,
}: UploadCardProps) {
  const [selectedGoal, setSelectedGoal] = useState("Overall skating");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function validateAndSelectFile(file: File) {
    setError("");
    setDuration(null);

    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Your video must be smaller than 250 MB.");
      return;
    }

    setSelectedFile(file);
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
    if (!selectedFile) {
      return;
    }
  
    onAnalyze({
      fileName: selectedFile.name,
      goal: selectedGoal,
      duration,
    });
  }
  return (
    <section className="card upload-card">
      <div className="section-heading">
        <p className="eyebrow">START YOUR ANALYSIS</p>
        <h2>What do you want to improve?</h2>
      </div>

      <GoalSelector
        goals={goals}
        selectedGoal={selectedGoal}
        onSelectGoal={setSelectedGoal}
      />

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

            <div className="video-badge">READY TO ANALYZE</div>
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

      {error && (
        <div className="upload-error" role="alert">
          <span className="error-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      <div className="analysis-summary">
        <span>Assessment focus</span>
        <strong>{selectedGoal}</strong>
      </div>

      <button
        className="primary-button"
        type="button"
        disabled={!selectedFile}
        onClick={handleAnalyze}
      >
        <span>Analyze skating</span>
        <span className="button-arrow">→</span>
      </button>

      <p className="privacy-note">
        Your selected video stays on this device during prototype mode.
      </p>
    </section>
  );
}