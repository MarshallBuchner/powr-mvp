/** Fire-and-forget lab lifecycle beacons to /api/telemetry (no PII). */
import type { LabLifecycleMarker } from "./labLifecycle";

export function sendLabBeacon(
  event: string,
  marker: Partial<LabLifecycleMarker> | null,
  extra: { navType?: string; persisted?: boolean } = {},
) {
  try {
    if (typeof navigator === "undefined") return;
    const payload = JSON.stringify({
      event,
      stage: marker?.stage ?? "none",
      attemptId: marker?.attemptId,
      frameWidth: marker?.frameWidth,
      frameHeight: marker?.frameHeight,
      frameCount: marker?.frameCount,
      payloadBytes: marker?.payloadBytes,
      sinceStartMs:
        marker?.startedAt != null ? Math.max(0, Date.now() - marker.startedAt) : undefined,
      ...extra,
    });
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/telemetry", blob)) return;
    void fetch("/api/telemetry", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Telemetry must never affect the assessment.
  }
}
