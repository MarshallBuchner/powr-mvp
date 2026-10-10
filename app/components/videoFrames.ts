/** Shared video frame sampling for /api/analyze (client-only). */

import {
  analyzeImageData,
  inspectFrameDataUrl,
  insufficientVideoQualityMessage,
  summarizeFrameBatch,
  type FrameQualityResult,
} from "@/lib/frameQuality";
import { logLabPlayback, snapshotVideoPlayback } from "@/lib/labPlayback";

export type ExtractedFrame = {
  dataUrl: string;
  timeSeconds: number;
  timeLabel: string;
  quality?: FrameQualityResult;
};

export class InsufficientVideoFramesError extends Error {
  issues: string[];
  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = "InsufficientVideoFramesError";
    this.issues = issues;
  }
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

function waitForEvent(
  target: HTMLMediaElement,
  event: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for video ${event}.`));
    }, timeoutMs);
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Could not read video."));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      target.removeEventListener(event, onOk);
      target.removeEventListener("error", onErr);
    };
    target.addEventListener(event, onOk, { once: true });
    target.addEventListener("error", onErr, { once: true });
  });
}

async function ensureDecodableDimensions(video: HTMLVideoElement) {
  // iOS Safari often reports 0×0 on loadedmetadata until a frame is available.
  if (video.videoWidth > 0 && video.videoHeight > 0) return;

  // Prefer loadeddata over play() — play() on this offscreen element can pause
  // any concurrent lab preview under iOS ConcurrentPlaybackNotPermitted.
  try {
    await waitForEvent(video, "loadeddata", 4000);
  } catch {
    logLabPlayback("extract_loadeddata_timeout", snapshotVideoPlayback(video));
  }

  if (video.videoWidth > 0 && video.videoHeight > 0) {
    video.pause();
    return;
  }

  try {
    logLabPlayback("extract_play_for_dimensions", snapshotVideoPlayback(video));
    await video.play();
  } catch (err) {
    logLabPlayback("extract_play_rejected", {
      message: err instanceof Error ? err.message : String(err),
      ...snapshotVideoPlayback(video),
    });
  }

  if (video.videoWidth > 0 && video.videoHeight > 0) {
    video.pause();
    return;
  }

  await waitForEvent(video, "loadeddata", 8000);
  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    throw new InsufficientVideoFramesError(
      insufficientVideoQualityMessage(["decode_failed"]),
      ["decode_failed"],
    );
  }
  video.pause();
}

async function seekVideo(video: HTMLVideoElement, time: number) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    throw new InsufficientVideoFramesError(
      insufficientVideoQualityMessage(["decode_failed"]),
      ["decode_failed"],
    );
  }

  const seekTime = Math.min(
    Math.max(0, time),
    Math.max(video.duration - 0.05, 0),
  );

  if (Math.abs(video.currentTime - seekTime) < 0.001 && video.readyState >= 2) {
    return seekTime;
  }

  const seeked = waitForEvent(video, "seeked", 8000);
  video.currentTime = seekTime;
  await seeked;
  return seekTime;
}

function sampleFrameQuality(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dataUrl: string,
): FrameQualityResult {
  const structural = inspectFrameDataUrl(dataUrl);
  if (!structural.usable) return structural;

  try {
    const image = context.getImageData(0, 0, width, height);
    return analyzeImageData(image);
  } catch {
    return {
      ...structural,
      usable: false,
      issues: ["decode_failed"],
      width,
      height,
    };
  }
}

export async function extractVideoFrames(
  file: File,
  frameCount = 5,
): Promise<ExtractedFrame[]> {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  const videoUrl = URL.createObjectURL(file);
  const frames: ExtractedFrame[] = [];

  try {
    // Keep this element off-DOM and paused between seeks. Never leave it
    // playing — that races the visible Analysis Lab player on iPhone Safari.
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    // Do not set crossOrigin for blob: URLs — Safari can fail to decode samples.
    video.src = videoUrl;

    logLabPlayback("extract_offscreen_start", {
      fileSize: file.size,
      fileType: file.type,
    });
    await waitForEvent(video, "loadedmetadata", 10000);
    await ensureDecodableDimensions(video);
    logLabPlayback("extract_dimensions_ready", snapshotVideoPlayback(video));

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width < 160 || height < 120) {
      throw new InsufficientVideoFramesError(
        insufficientVideoQualityMessage(["too_small"]),
        ["too_small"],
      );
    }

    canvas.width = width;
    canvas.height = height;
    const duration = video.duration;
    const qualities: FrameQualityResult[] = [];

    for (let i = 0; i < frameCount; i++) {
      const time =
        frameCount === 1
          ? duration / 2
          : (duration * i) / (frameCount - 1);

      const seekTime = await seekVideo(video, time);
      context.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      const quality = sampleFrameQuality(context, width, height, dataUrl);
      qualities.push(quality);

      frames.push({
        dataUrl,
        timeSeconds: seekTime,
        timeLabel: formatTimestamp(seekTime),
        quality,
      });
    }

    const batch = summarizeFrameBatch(qualities);
    if (!batch.usable) {
      throw new InsufficientVideoFramesError(
        insufficientVideoQualityMessage(batch.issues),
        batch.issues,
      );
    }

    return frames;
  } finally {
    URL.revokeObjectURL(videoUrl);
    video.removeAttribute("src");
    video.load();
  }
}

export function buildEvidenceMoments(
  frames: ExtractedFrame[],
  priorityText: string,
) {
  if (!frames.length) return [];

  const mid = frames[Math.floor(frames.length / 2)];
  const late = frames[frames.length - 1] ?? mid;
  const caption =
    priorityText.trim() || "Primary development moment from your clip";

  const moments = [
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
