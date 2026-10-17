const KEY = "powr_meta_pending_v1";
const TTL = 60 * 60 * 1000;

export function armCompletionMeasurement(eventId: string | undefined, path: string) {
  try {
    sessionStorage.removeItem(KEY);
    if (eventId && /^\/r\/(?:view|s\/[A-Za-z0-9_-]+)$/.test(path)) {
      sessionStorage.setItem(KEY, JSON.stringify({ eventId, path, at: Date.now() }));
    }
  } catch { /* Measurement must never interrupt report navigation. */ }
}

let inFlight = false;
export async function measureOpenedReport(path: string) {
  if (inFlight) return;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    const pending = JSON.parse(raw);
    if (pending.path !== path || Date.now() - pending.at > TTL || Date.now() < pending.at) return;
    inFlight = true;
    const response = await fetch("/api/marketing/complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: pending.eventId }),
      referrerPolicy: "no-referrer", keepalive: true,
    });
    if (response.ok && sessionStorage.getItem(KEY) === raw) sessionStorage.removeItem(KEY);
  } catch { /* Ad measurement failures do not affect the assessment. */ }
  finally { inFlight = false; }
}
