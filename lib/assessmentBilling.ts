export const FREE_ASSESSMENTS = 1;
export const ASSESSMENT_PACK_CREDITS = 5;
export const ASSESSMENT_PACK_PRICE_CAD = "$19 CAD";
export const ASSESSMENT_PACK_AMOUNT_CENTS = 1900;
export const ASSESSMENT_PRODUCT_NAME = "POWR Skating Assessment Pack";
export const ASSESSMENT_PRODUCT_ID = "powr_assessment_pack";

export const ENTITLEMENT_COOKIE = "powr_ent_v1";
export const ENTITLEMENT_STORAGE_KEY = "powr_entitlement_v1";
export const CREATOR_REF_STORAGE_KEY = "powr_creator_ref_v1";

export type EntitlementState = {
  freeUsed: number;
  credits: number;
  unlockedSessionIds: string[];
};

export function defaultEntitlements(): EntitlementState {
  return {
    freeUsed: 0,
    credits: 0,
    unlockedSessionIds: [],
  };
}

export function remainingAssessments(state: EntitlementState) {
  const freeLeft = Math.max(0, FREE_ASSESSMENTS - state.freeUsed);
  return freeLeft + Math.max(0, state.credits);
}

export function canRunAssessment(state: EntitlementState) {
  return remainingAssessments(state) > 0;
}

export function consumeAssessment(state: EntitlementState): EntitlementState {
  if (state.freeUsed < FREE_ASSESSMENTS) {
    return { ...state, freeUsed: state.freeUsed + 1 };
  }

  if (state.credits > 0) {
    return { ...state, credits: state.credits - 1 };
  }

  return state;
}

export function grantPackCredits(
  state: EntitlementState,
  sessionId: string,
  credits = ASSESSMENT_PACK_CREDITS,
): EntitlementState {
  if (sessionId && state.unlockedSessionIds.includes(sessionId)) {
    return state;
  }

  return {
    ...state,
    credits: state.credits + credits,
    unlockedSessionIds: sessionId
      ? [...state.unlockedSessionIds, sessionId]
      : state.unlockedSessionIds,
  };
}

export function parseEntitlementJson(raw: string | null | undefined): EntitlementState {
  if (!raw) return defaultEntitlements();

  try {
    const parsed = JSON.parse(raw) as Partial<EntitlementState>;
    return {
      freeUsed: Math.max(0, Number(parsed.freeUsed) || 0),
      credits: Math.max(0, Number(parsed.credits) || 0),
      unlockedSessionIds: Array.isArray(parsed.unlockedSessionIds)
        ? parsed.unlockedSessionIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return defaultEntitlements();
  }
}
