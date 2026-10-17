import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export const POWR_DATASET_ID = "1191232966775490";
export const MEASUREMENT_COOKIE = "powr_meta_completion";
export const MEASUREMENT_TTL_SECONDS = 3600;
const SOURCE_URL = "https://trainwithpowr.com/";

type Receipt = { id: string; issuedAt: number; fbc?: string };
type Config = { enabled?: boolean; token?: string; now?: number };
function config(options: Config) {
  return {
    enabled: options.enabled ?? process.env.META_CAPI_ENABLED === "true",
    token: options.token ?? process.env.META_CAPI_ACCESS_TOKEN ?? "",
    now: options.now ?? Math.floor(Date.now() / 1000),
  };
}

// No Meta script runs on the upload, analysis, account or private report pages.
// Only a successfully generated assessment can obtain this signed receipt.
export function issueMeasurementReceipt(input: {
  adult: boolean; consent: boolean; fbclid?: unknown;
}, options: Config = {}) {
  const { enabled, token, now } = config(options);
  if (!enabled || !token || !input.adult || !input.consent) return null;
  const click = typeof input.fbclid === "string" && /^[A-Za-z0-9_-]{1,500}$/.test(input.fbclid)
    ? input.fbclid : null;
  const receipt: Receipt = {
    id: randomUUID(), issuedAt: now,
    ...(click ? { fbc: `fb.1.${now * 1000}.${click}` } : {}),
  };
  const payload = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  const signature = createHmac("sha256", token).update(payload).digest("base64url");
  return { id: receipt.id, value: `${payload}.${signature}` };
}

export function verifyMeasurementReceipt(value: string | undefined, options: Config = {}): Receipt | null {
  const { enabled, token, now } = config(options);
  if (!enabled || !token || !value || value.length > 2000) return null;
  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", token).update(payload).digest();
    const provided = Buffer.from(signature, "base64url");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
    const receipt = JSON.parse(Buffer.from(payload, "base64url").toString()) as Receipt;
    if (!/^[0-9a-f-]{36}$/.test(receipt.id) || !Number.isSafeInteger(receipt.issuedAt) ||
      receipt.issuedAt > now || now - receipt.issuedAt > MEASUREMENT_TTL_SECONDS) return null;
    return receipt;
  } catch { return null; }
}

export async function sendAssessmentCompletion(receipt: Receipt, input: {
  ip: string | null; userAgent: string | null;
}, options: Config & { fetcher?: typeof fetch; testCode?: string } = {}) {
  const { enabled, token, now } = config(options);
  if (!enabled || !token) return false;
  // IP and user agent are sent only with the adult's explicit per-assessment consent.
  // Do not use email, account IDs, report tokens, filenames, scores or analysis here.
  if (!input.ip || !isIP(input.ip) || !input.userAgent) return false;
  const response = await (options.fetcher ?? fetch)(
    `https://graph.facebook.com/v25.0/${POWR_DATASET_ID}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        data: [{
          event_name: "AssessmentCompleted",
          event_time: now,
          event_id: receipt.id,
          action_source: "website",
          event_source_url: SOURCE_URL,
          user_data: {
            client_ip_address: input.ip,
            client_user_agent: input.userAgent.slice(0, 512),
            ...(receipt.fbc ? { fbc: receipt.fbc } : {}),
          },
        }],
        ...(options.testCode ? { test_event_code: options.testCode } : {}),
      }),
    },
  );
  // Never log API bodies: they may echo credentials or matching data.
  if (!response.ok) return false;
  const result = await response.json().catch(() => null);
  return result?.events_received === 1;
}
