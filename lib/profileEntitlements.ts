import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type EntitlementState,
  defaultEntitlements,
  remainingAssessments,
  canRunAssessment,
} from "@/lib/assessmentBilling";

export type ProfileEntitlementRow = {
  free_assessments_used: number | null;
  assessment_credits: number | null;
};

type RpcEntitlementResult = {
  ok?: boolean;
  already_granted?: boolean;
  credits_granted?: number;
  free_assessments_used?: number;
  assessment_credits?: number;
};

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
  });
}

export async function ensureProfileRow(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, free_assessments_used, assessment_credits")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data as ProfileEntitlementRow & { id: string };
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: email ?? null,
        free_assessments_used: 0,
        assessment_credits: 0,
      },
      { onConflict: "id" },
    )
    .select("id, free_assessments_used, assessment_credits")
    .single();

  if (insertError) throw insertError;
  return created as ProfileEntitlementRow & { id: string };
}

export async function readProfileEntitlements(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<EntitlementState> {
  const row = await ensureProfileRow(supabase, userId, email);
  return entitlementsFromProfile(row);
}

/** Atomic merge via RPC: profile := greatest(profile, device). Idempotent. */
export async function mergeDeviceIntoProfile(
  supabase: SupabaseClient,
  device: Pick<EntitlementState, "freeUsed" | "credits">,
): Promise<EntitlementState> {
  const { data, error } = await supabase.rpc("merge_assessment_entitlement", {
    p_free_used: Math.max(0, device.freeUsed),
    p_credits: Math.max(0, device.credits),
  });

  if (error) throw error;
  return entitlementsFromRpc(data as RpcEntitlementResult);
}

/** Atomic consume via RPC (FOR UPDATE). Not read→calc→update. */
export async function consumeProfileAssessment(
  supabase: SupabaseClient,
): Promise<
  | { ok: true; state: EntitlementState; remaining: number }
  | { ok: false; state: EntitlementState; remaining: number }
> {
  const { data, error } = await supabase.rpc("consume_assessment_credit");

  if (error) throw error;

  const result = data as RpcEntitlementResult;
  const state = entitlementsFromRpc(result);
  const remaining = remainingAssessments(state);

  if (!result?.ok) {
    return { ok: false, state, remaining };
  }

  return { ok: true, state, remaining };
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
) {
  return {
    ...state,
    remaining: remainingAssessments(state),
    canRun: canRunAssessment(state),
    source,
  };
}
