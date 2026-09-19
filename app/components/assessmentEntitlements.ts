import {
  ASSESSMENT_PACK_CREDITS,
  CREATOR_REF_STORAGE_KEY,
  ENTITLEMENT_STORAGE_KEY,
  consumeAssessment,
  defaultEntitlements,
  grantPackCredits,
  parseEntitlementJson,
  remainingAssessments,
  type EntitlementState,
  canRunAssessment,
} from "@/lib/assessmentBilling";

export const ENTITLEMENT_MERGED_KEY = "powr_ent_merged_v1";

export type EntitlementBalance = EntitlementState & {
  remaining: number;
  canRun: boolean;
  source?: "profile" | "device";
  /** Server-only founder override — never set from the client. */
  unlimited?: boolean;
};

export function readLocalEntitlements(): EntitlementState {
  if (typeof window === "undefined") return defaultEntitlements();
  return parseEntitlementJson(localStorage.getItem(ENTITLEMENT_STORAGE_KEY));
}

export function writeLocalEntitlements(state: EntitlementState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENTITLEMENT_STORAGE_KEY, JSON.stringify(state));
}

export function getLocalRemainingAssessments() {
  return remainingAssessments(readLocalEntitlements());
}

export function localCanRunAssessment() {
  return canRunAssessment(readLocalEntitlements());
}

export function localConsumeAssessment() {
  const next = consumeAssessment(readLocalEntitlements());
  writeLocalEntitlements(next);
  return next;
}

export function localGrantPack(sessionId: string, credits = ASSESSMENT_PACK_CREDITS) {
  const next = grantPackCredits(readLocalEntitlements(), sessionId, credits);
  writeLocalEntitlements(next);
  return next;
}

export function captureCreatorRef(ref: string | null | undefined) {
  if (typeof window === "undefined") return;
  const cleaned = (ref || "").trim().toLowerCase().slice(0, 64);
  if (!cleaned) return;
  localStorage.setItem(CREATOR_REF_STORAGE_KEY, cleaned);
}

export function readCreatorRef() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CREATOR_REF_STORAGE_KEY);
}

export async function syncEntitlementCookie(state?: EntitlementState) {
  const payload = state || readLocalEntitlements();
  try {
    const res = await fetch("/api/assessments/entitlement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as EntitlementBalance;
    if (typeof data.freeUsed === "number") {
      writeLocalEntitlements({
        freeUsed: data.freeUsed,
        credits: data.credits || 0,
        unlockedSessionIds: data.unlockedSessionIds || [],
      });
    }
    return data;
  } catch (error) {
    console.error("POWR entitlement sync failed", error);
    return null;
  }
}

/** Fetch current balance (profile when signed in, device when guest). */
export async function fetchEntitlementBalance(): Promise<EntitlementBalance | null> {
  try {
    const res = await fetch("/api/assessments/entitlement", {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as EntitlementBalance;
    if (typeof data.freeUsed === "number") {
      writeLocalEntitlements({
        freeUsed: data.freeUsed,
        credits: data.credits || 0,
        unlockedSessionIds: data.unlockedSessionIds || [],
      });
    }
    return data;
  } catch (error) {
    console.error("POWR entitlement fetch failed", error);
    return null;
  }
}

/**
 * One-time-per-user device→profile merge after login.
 * Server merge is idempotent (greatest); local flag avoids repeat POSTs.
 */
export async function mergeDeviceEntitlementsOnLogin(userId: string) {
  if (typeof window === "undefined" || !userId) return null;

  const flagKey = `${ENTITLEMENT_MERGED_KEY}:${userId}`;
  if (localStorage.getItem(flagKey) === "1") {
    return fetchEntitlementBalance();
  }

  const merged = await syncEntitlementCookie(readLocalEntitlements());
  if (merged) {
    localStorage.setItem(flagKey, "1");
  }
  return merged;
}
