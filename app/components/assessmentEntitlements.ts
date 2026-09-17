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
    await fetch("/api/assessments/entitlement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("POWR entitlement sync failed", error);
  }
}
