import { NextRequest, NextResponse } from "next/server";
import {
  type EntitlementState,
  canRunAssessment,
  remainingAssessments,
} from "@/lib/assessmentBilling";
import {
  readEntitlementCookie,
  writeEntitlementCookie,
} from "@/lib/entitlementCookie";

export async function GET(request: NextRequest) {
  const state = readEntitlementCookie(request);
  return NextResponse.json({
    ...state,
    remaining: remainingAssessments(state),
    canRun: canRunAssessment(state),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<EntitlementState>;
  const current = readEntitlementCookie(request);

  const next: EntitlementState = {
    freeUsed: Math.max(current.freeUsed, Number(body.freeUsed) || 0),
    credits: Math.max(current.credits, Number(body.credits) || 0),
    unlockedSessionIds: Array.from(
      new Set([
        ...current.unlockedSessionIds,
        ...((body.unlockedSessionIds as string[]) || []).filter(
          (id) => typeof id === "string",
        ),
      ]),
    ),
  };

  const response = NextResponse.json({
    ...next,
    remaining: remainingAssessments(next),
    canRun: canRunAssessment(next),
  });
  return writeEntitlementCookie(response, next);
}
