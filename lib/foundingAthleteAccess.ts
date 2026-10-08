/**
 * Server-side Founding Athlete access.
 * Allowlist emails live only in FOUNDING_ATHLETE_EMAILS (never client / logs).
 */

export const FOUNDING_MONTHLY_ALLOWANCE = 20;
export const FOUNDING_ACCESS_MONTHS = 6;
export const FOUNDING_TIMEZONE = "America/Edmonton";

export type FoundingBalance = {
  active: boolean;
  monthUsed: number;
  monthAllowance: number;
  monthRemaining: number;
  expiresAt: string | null;
  activatedAt: string | null;
};

function parseAllowlist(): Set<string> {
  const raw = process.env.FOUNDING_ATHLETE_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Exact match against server env allowlist. Never trust client-supplied email. */
export function isApprovedFoundingAthleteEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return parseAllowlist().has(email.trim().toLowerCase());
}

export function hasVerifiedAuthEmail(user: {
  email?: string | null;
  email_confirmed_at?: string | null;
}): boolean {
  return Boolean(user.email && user.email_confirmed_at);
}

export function foundingMonthRemaining(monthUsed: number): number {
  return Math.max(0, FOUNDING_MONTHLY_ALLOWANCE - Math.max(0, monthUsed || 0));
}

export function isFoundingAccessActive(
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;
  const expires = Date.parse(expiresAt);
  if (Number.isNaN(expires)) return false;
  return expires > now.getTime();
}

export function foundingBalanceFromProfile(
  row: {
    founding_activated_at?: string | null;
    founding_expires_at?: string | null;
    founding_month_key?: string | null;
    founding_month_used?: number | null;
  } | null | undefined,
  options?: { now?: Date; currentMonthKey?: string },
): FoundingBalance | null {
  const activatedAt = row?.founding_activated_at ?? null;
  const expiresAt = row?.founding_expires_at ?? null;
  if (!activatedAt || !expiresAt) return null;

  const active = isFoundingAccessActive(expiresAt, options?.now);
  if (!active) {
    return {
      active: false,
      monthUsed: Math.max(0, Number(row?.founding_month_used) || 0),
      monthAllowance: FOUNDING_MONTHLY_ALLOWANCE,
      monthRemaining: 0,
      expiresAt,
      activatedAt,
    };
  }

  const now = options?.now ?? new Date();
  const currentKey =
    options?.currentMonthKey ?? edmontonMonthKey(now);
  const storedKey = row?.founding_month_key ?? null;
  const monthUsed =
    storedKey && storedKey === currentKey
      ? Math.max(0, Number(row?.founding_month_used) || 0)
      : 0;

  return {
    active: true,
    monthUsed,
    monthAllowance: FOUNDING_MONTHLY_ALLOWANCE,
    monthRemaining: foundingMonthRemaining(monthUsed),
    expiresAt,
    activatedAt,
  };
}

/** Calendar month key in America/Edmonton (YYYY-MM). */
export function edmontonMonthKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FOUNDING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}
