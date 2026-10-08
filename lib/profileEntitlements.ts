import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  type EntitlementState,
  defaultEntitlements,
  remainingAssessments,
  canRunAssessment,
} from "@/lib/assessmentBilling";
import {
  FOUNDING_ACCESS_MONTHS,
  type FoundingBalance,
  foundingBalanceFromProfile,
  hasVerifiedAuthEmail,
  isApprovedFoundingAthleteEmail,
} from "@/lib/foundingAthleteAccess";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export type ProfileEntitlementRow = {
  free_assessments_used: number | null;
  assessment_credits: number | null;
  founding_activated_at?: string | null;
  founding_expires_at?: string | null;
  founding_month_key?: string | null;
  founding_month_used?: number | null;
};

type RpcEntitlementResult = {
  ok?: boolean;
  already_granted?: boolean;
  already_activated?: boolean;
  credits_granted?: number;
  free_assessments_used?: number;
  assessment_credits?: number;
  founding_activated_at?: string | null;
  founding_expires_at?: string | null;
  founding_month_key?: string | null;
  founding_month_used?: number | null;
  consumed_from?: string;
};

const PROFILE_SELECT =
  "id, free_assessments_used, assessment_credits, founding_activated_at, founding_expires_at, founding_month_key, founding_month_used";

export function entitlementsFromProfile(
  row: ProfileEntitlementRow | null | undefined,
): EntitlementState {
  if (!row) return defaultEntitlements();
  return {
    freeUsed: Math.max(0, Number(row.free_assessments_used) || 0),
    credits: Math.max(0, Number(row.assessment_credits) || 0),
    unlockedSessionIds: [],
  };
}

export function entitlementsFromRpc(result: RpcEntitlementResult | null | undefined) {
  return entitlementsFromProfile({
    free_assessments_used: result?.free_assessments_used ?? 0,
    assessment_credits: result?.assessment_credits ?? 0,
    founding_activated_at: result?.founding_activated_at,
    founding_expires_at: result?.founding_expires_at,
    founding_month_key: result?.founding_month_key,
    founding_month_used: result?.founding_month_used,
  });
}

export function foundingFromProfile(
  row: ProfileEntitlementRow | null | undefined,
): FoundingBalance | null {
  return foundingBalanceFromProfile(row);
}

export function foundingFromRpc(
  result: RpcEntitlementResult | null | undefined,
): FoundingBalance | null {
  return foundingBalanceFromProfile(result);
}

export async function ensureProfileRow(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data as ProfileEntitlementRow & { id: string };
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert(
      {
        id: userId,
        email: email ?? null,
      },
    )
    .select(PROFILE_SELECT)
    .single();

  if (insertError) throw insertError;
  return created as ProfileEntitlementRow & { id: string };
}

/**
 * Activate Founding Athlete on first verified allowlisted sign-in.
 * Uses service role so clients cannot self-activate. Idempotent.
 * Never logs the athlete email.
 */
export async function activateFoundingAthleteIfEligible(
  user: Pick<User, "id" | "email" | "email_confirmed_at">,
): Promise<void> {
  if (!isApprovedFoundingAthleteEmail(user.email)) return;
  if (!hasVerifiedAuthEmail(user)) return;
  if (!isServiceRoleConfigured()) {
    console.error(
      "POWR founding athlete activation skipped: service role not configured",
    );
    return;
  }

  try {
    const admin = createServiceClient();
    const { error } = await admin.rpc("activate_founding_athlete", {
      p_user_id: user.id,
      p_months: FOUNDING_ACCESS_MONTHS,
    });
    if (error) throw error;
  } catch (error) {
    console.error("POWR founding athlete activation failed", error);
    throw error;
  }
}

export async function readProfileEntitlements(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<EntitlementState> {
  const row = await ensureProfileRow(supabase, userId, email);
  return entitlementsFromProfile(row);
}

export async function readProfileEntitlementBundle(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "email" | "email_confirmed_at">,
): Promise<{ state: EntitlementState; founding: FoundingBalance | null }> {
  await activateFoundingAthleteIfEligible(user);
  const row = await ensureProfileRow(supabase, user.id, user.email);
  return {
    state: entitlementsFromProfile(row),
    founding: foundingFromProfile(row),
  };
}

/** Atomic merge via RPC: profile := greatest(profile, device). Idempotent. */
export async function mergeDeviceIntoProfile(
  supabase: SupabaseClient,
  device: Pick<EntitlementState, "freeUsed" | "credits">,
): Promise<EntitlementState> {
  const { data, error } = await supabase.rpc("merge_assessment_entitlement", {
    p_free_used: Math.max(0, device.freeUsed),
    p_credits: 0,
  });

  if (error) throw error;
  return entitlementsFromRpc(data as RpcEntitlementResult);
}

export function remainingWithFounding(
  state: EntitlementState,
  founding: FoundingBalance | null | undefined,
): number {
  const foundingLeft = founding?.active ? founding.monthRemaining : 0;
  return foundingLeft + remainingAssessments(state);
}

export function canRunWithFounding(
  state: EntitlementState,
  founding: FoundingBalance | null | undefined,
): boolean {
  if (founding?.active && founding.monthRemaining > 0) return true;
  return canRunAssessment(state);
}

/** Atomic consume via RPC (FOR UPDATE). Not read→calc→update. */
export async function consumeProfileAssessment(
  supabase: SupabaseClient,
): Promise<
  | {
      ok: true;
      state: EntitlementState;
      remaining: number;
      founding: FoundingBalance | null;
    }
  | {
      ok: false;
      state: EntitlementState;
      remaining: number;
      founding: FoundingBalance | null;
    }
> {
  const { data, error } = await supabase.rpc("consume_assessment_credit");

  if (error) throw error;

  const result = data as RpcEntitlementResult;
  const state = entitlementsFromRpc(result);
  const founding = foundingFromRpc(result);
  const remaining = remainingWithFounding(state, founding);

  if (!result?.ok) {
    return { ok: false, state, remaining, founding };
  }

  return { ok: true, state, remaining, founding };
}

/** Service-role grant; idempotent on stripe_session_id. */
export async function grantPackCreditsToProfile(
  serviceSupabase: SupabaseClient,
  userId: string,
  sessionId: string,
  credits: number,
): Promise<{
  state: EntitlementState;
  creditsGranted: number;
  alreadyGranted: boolean;
}> {
  const { data, error } = await serviceSupabase.rpc(
    "grant_assessment_pack_credits",
    {
      p_user_id: userId,
      p_session_id: sessionId,
      p_credits: credits,
    },
  );

  if (error) throw error;

  const result = data as RpcEntitlementResult;
  return {
    state: entitlementsFromRpc(result),
    creditsGranted: Number(result?.credits_granted) || credits,
    alreadyGranted: Boolean(result?.already_granted),
  };
}

export function entitlementResponse(
  state: EntitlementState,
  source: "profile" | "device",
  options?: {
    unlimited?: boolean;
    founding?: FoundingBalance | null;
  },
) {
  const unlimited = Boolean(options?.unlimited);
  const founding = options?.founding ?? null;
  const foundingActive = Boolean(founding?.active);
  const remaining = remainingWithFounding(state, founding);

  return {
    ...state,
    remaining,
    canRun: unlimited || canRunWithFounding(state, founding),
    source,
    unlimited,
    /** Active Founding Athlete window — no emails or allowlist data. */
    foundingAthlete: foundingActive,
    foundingMonthRemaining: foundingActive ? founding!.monthRemaining : 0,
    foundingExpiresAt: foundingActive ? founding!.expiresAt : null,
  };
}
