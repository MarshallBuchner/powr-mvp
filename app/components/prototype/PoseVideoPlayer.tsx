"use client";

/**
 * Video player with a synced canvas overlay that runs MediaPipe PoseLandmarker
 * frame-by-frame during playback (client-side only).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  clearCanvas,
  drawPoseLandmarks,
  type SkeletonColor,
} from "./poseDrawing";
import { computePrototypeMetrics, type PrototypeMetrics } from "./poseMetrics";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type PoseDebugInfo = {
  currentTime: number;
  poseDetected: boolean;
  landmarkCount: number;
  confidencePct: number;
};

export type PoseVideoPlayerProps = {
  src: string;
  showSkeleton: boolean;
  showKeypoints: boolean;
  showLabels: boolean;
  skeletonColor: SkeletonColor;
  onMetrics?: (metrics: PrototypeMetrics) => void;
  onDebug?: (info: PoseDebugInfo) => void;
};

export default function PoseVideoPlayer({
  src,
  showSkeleton,
  showKeypoints,
  showLabels,
  skeletonColor,
  onMetrics,
  onDebug,
}: PoseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(-1);
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);

  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [modelError, setModelError] = useState<string | null>(null);

  // Keep draw options in refs so the RAF loop always sees latest toggles
  const drawOptsRef = useRef({
    showSkeleton,
    showKeypoints,
    showLabels,
    color: skeletonColor,
  });
  useEffect(() => {
    drawOptsRef.current = {
      showSkeleton,
      showKeypoints,
      showLabels,
      color: skeletonColor,
    };
  }, [showSkeleton, showKeypoints, showLabels, skeletonColor]);

  const onMetricsRef = useRef(onMetrics);
  const onDebugRef = useRef(onDebug);
  useEffect(() => {
    onMetricsRef.current = onMetrics;
  }, [onMetrics]);
  useEffect(() => {
    onDebugRef.current = onDebug;
  }, [onDebug]);

  // Load PoseLandmarker once (GPU first, then CPU fallback)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setModelStatus("loading");
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        const create = (delegate: "GPU" | "CPU") =>
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate,
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.4,
            minPosePresenceConfidence: 0.4,
            minTrackingConfidence: 0.4,
          });

        let landmarker: PoseLandmarker;
        try {
          landmarker = await create("GPU");
        } catch {
          landmarker = await create("CPU");
        }
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setModelStatus("ready");
      } catch (err) {
        console.error("[PoseVideoPlayer] model load failed", err);
        if (!cancelled) {
          setModelStatus("error");
          setModelError(
            err instanceof Error ? err.message : "Failed to load pose model",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  const syncCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.clientWidth;
    const h = video.clientHeight;
    if (w <= 0 || h <= 0) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, []);

  const paintFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas) return;

    syncCanvasSize();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    clearCanvas(ctx, width, height);

    // Detect when the clock advances, or once on the first available frame (even if paused)
    const timeAdvanced = video.currentTime !== lastTsRef.current;
    const needsFirstFrame =
      landmarksRef.current == null && video.readyState >= 2;
    if (
      landmarker &&
      video.readyState >= 2 &&
      (timeAdvanced || needsFirstFrame) &&
      (!video.paused || needsFirstFrame) &&
      !video.ended
    ) {
      lastTsRef.current = video.currentTime;
      try {
        // MediaPipe requires monotonically increasing timestamps (ms)
        const result = landmarker.detectForVideo(video, performance.now());
        const pose = result.landmarks?.[0] ?? null;
        landmarksRef.current = pose;

        const metrics = computePrototypeMetrics(pose);
        onMetricsRef.current?.(metrics);
        onDebugRef.current?.({
          currentTime: video.currentTime,
          poseDetected: Boolean(pose?.length),
          landmarkCount: pose?.length ?? 0,
          confidencePct: metrics.confidencePct,
        });
      } catch (err) {
        // Don't crash the loop if a frame fails
        console.warn("[PoseVideoPlayer] detectForVideo failed", err);
      }
    } else {
      // Still emit debug clock while idle
      onDebugRef.current?.({
        currentTime: video.currentTime,
        poseDetected: Boolean(landmarksRef.current?.length),
        landmarkCount: landmarksRef.current?.length ?? 0,
        confidencePct: computePrototypeMetrics(landmarksRef.current)
          .confidencePct,
      });
    }

    const pose = landmarksRef.current;
    if (pose?.length) {
      drawPoseLandmarks(ctx, pose, width, height, {
        ...drawOptsRef.current,
      });
    }
  }, [syncCanvasSize]);

  // Animation loop
  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      paintFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [paintFrame, src]);

  // Resize observer keeps overlay aligned with the video element
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => syncCanvasSize());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [syncCanvasSize]);

  // Reset landmarks when a new clip is loaded
  useEffect(() => {
    landmarksRef.current = null;
    lastTsRef.current = -1;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) clearCanvas(ctx, canvas.width, canvas.height);
    }
  }, [src]);

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    lastTsRef.current = -1;
    void video.play().catch(() => undefined);
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };

  return (
    <div className="skel-player">
      <div className="skel-player-stage" ref={wrapRef}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={src}
          className="skel-player-video"
          controls
          playsInline
          muted
          crossOrigin="anonymous"
          onLoadedData={() => {
            syncCanvasSize();
            // Allow a fresh first-frame detection after the clip loads
            lastTsRef.current = -1;
            landmarksRef.current = null;
          }}
        />
        <canvas ref={canvasRef} className="skel-player-canvas" style={overlayStyle} />
        {modelStatus === "loading" ? (
          <div className="skel-player-badge">Loading pose model…</div>
        ) : null}
        {modelStatus === "error" ? (
          <div className="skel-player-badge is-error">
            Pose model failed{modelError ? `: ${modelError}` : ""}
          </div>
        ) : null}
        {modelStatus === "ready" ? (
          <div className="skel-player-badge is-ready">Pose ready</div>
        ) : null}
      </div>

      <div className="skel-player-controls">
        <button type="button" className="skel-btn" onClick={handlePlayPause}>
          Play / Pause
        </button>
        <button type="button" className="skel-btn" onClick={handleRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}
