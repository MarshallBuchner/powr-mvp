/**
 * Server-side persistence + idempotent replay for /api/analyze.
 *
 * Requires migration supabase/migrations/20261021_analysis_results.sql.
 * Every function degrades gracefully: if the table is missing or the service
 * role is not configured we log and fall back to the pre-existing behaviour
 * (analysis still runs, still billed exactly once, no replay).
 */
import { createHash } from "node:crypto";
import { createShareToken, guestShareExpiresAt } from "@/lib/reportTokens";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export const IN_PROGRESS_STALE_MS = 2 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidAttemptId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function hashDeviceKey(deviceKey: unknown): string | null {
  if (typeof deviceKey !== "string" || !UUID_RE.test(deviceKey)) return null;
  return createHash("sha256").update(`powr-device:${deviceKey}`).digest("hex");
}

export type StoredAnalysisResult = {
  attempt_id: string;
  status: "in_progress" | "completed";
  owner_user_id: string | null;
  device_key_hash: string | null;
  report: Record<string, unknown> | null;
  share_token: string | null;
  created_at: string;
};

export type ReplayDecision =
  | { kind: "none" }
  | { kind: "replay"; row: StoredAnalysisResult }
  | { kind: "in_progress" }
  | { kind: "forbidden" };

/** Pure ownership + state decision (unit-tested). */
export function decideReplay(
  row: StoredAnalysisResult | null,
  ctx: { userId: string | null; deviceKeyHash: string | null },
  now = Date.now(),
): ReplayDecision {
  if (!row) return { kind: "none" };
  const owns = row.owner_user_id
    ? row.owner_user_id === ctx.userId
    : Boolean(row.device_key_hash && row.device_key_hash === ctx.deviceKeyHash);
  if (!owns) return { kind: "forbidden" };
  if (row.status === "completed" && row.report) return { kind: "replay", row };
  const age = now - Date.parse(row.created_at);
  if (row.status === "in_progress" && Number.isFinite(age) && age < IN_PROGRESS_STALE_MS) {
    return { kind: "in_progress" };
  }
  return { kind: "none" };
}

function client() {
  if (!isServiceRoleConfigured()) return null;
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function findAnalysisResult(
  attemptId: string,
): Promise<StoredAnalysisResult | null> {
  const admin = client();
  if (!admin) return null;
  try {
    const { data, error } = await admin
      .from("analysis_results")
      .select("attempt_id, status, owner_user_id, device_key_hash, report, share_token, created_at")
      .eq("attempt_id", attemptId)
      .maybeSingle();
    if (error) {
      console.warn("[POWR:analyze] analysis_results lookup unavailable", { code: error.code });
      return null;
    }
    return (data as StoredAnalysisResult | null) ?? null;
  } catch (error) {
    console.warn("[POWR:analyze] analysis_results lookup failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

/** Mark the attempt in progress (best effort; never blocks analysis). */
export async function claimAnalysisAttempt(input: {
  attemptId: string;
  ownerUserId: string | null;
  deviceKeyHash: string | null;
}): Promise<boolean> {
  const admin = client();
  if (!admin) return false;
  try {
    const { error } = await admin.from("analysis_results").upsert(
      {
        attempt_id: input.attemptId,
        status: "in_progress",
        owner_user_id: input.ownerUserId,
        device_key_hash: input.ownerUserId ? null : input.deviceKeyHash,
        created_at: new Date().toISOString(),
      },
      { onConflict: "attempt_id" },
    );
    if (error) {
      console.warn("[POWR:analyze] analysis_results claim unavailable", { code: error.code });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export type PersistedReport = { shareToken: string; sharePath: string } | null;

/**
 * Persist the completed report + a share link BEFORE /api/analyze responds.
 * Returns null on any failure (client falls back to POST /api/reports/share).
 */
export async function persistCompletedAnalysis(input: {
  attemptId: string | null;
  ownerUserId: string | null;
  deviceKeyHash: string | null;
  goal: string;
  fileName: string;
  duration: number | null;
  analysis: Record<string, unknown>;
}): Promise<PersistedReport> {
  const admin = client();
  if (!admin) return null;
  let share: PersistedReport = null;
  try {
    const shareToken = createShareToken();
    const { data, error } = await admin
      .from("shared_reports")
      .insert({
        share_token: shareToken,
        expires_at: input.ownerUserId ? null : guestShareExpiresAt().toISOString(),
        owner_user_id: input.ownerUserId,
        assessment_id: null,
        goal: input.goal,
        file_name: input.fileName,
        duration: input.duration,
        analysis: input.analysis,
      })
      .select("share_token")
      .single();
    if (error || !data) {
      console.warn("[POWR:analyze] share persist failed", { code: error?.code });
    } else {
      share = { shareToken: data.share_token, sharePath: `/r/s/${data.share_token}` };
    }
  } catch (error) {
    console.warn("[POWR:analyze] share persist threw", {
      name: error instanceof Error ? error.name : "unknown",
    });
  }

  if (input.attemptId) {
    try {
      const { error } = await admin.from("analysis_results").upsert(
        {
          attempt_id: input.attemptId,
          status: "completed",
          owner_user_id: input.ownerUserId,
          device_key_hash: input.ownerUserId ? null : input.deviceKeyHash,
          report: {
            goal: input.goal,
            fileName: input.fileName,
            duration: input.duration,
            analysis: input.analysis,
          },
          share_token: share?.shareToken ?? null,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "attempt_id" },
      );
      if (error) {
        console.warn("[POWR:analyze] analysis_results persist unavailable", { code: error.code });
      }
    } catch {
      console.warn("[POWR:analyze] analysis_results persist threw");
    }
  }
  return share;
}
