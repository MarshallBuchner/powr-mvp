/** Shared video frame sampling for /api/analyze (client-only). */

export type ExtractedFrame = {
  dataUrl: string;
  timeSeconds: number;
  timeLabel: string;
};

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

export async function extractVideoFrames(
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
