import { randomBytes } from "crypto";

/** Opaque share tokens — not sequential IDs. */
export function createShareToken(): string {
  return randomBytes(24).toString("hex");
}

export function isShareTokenFormat(token: string): boolean {
  return /^[a-f0-9]{32,96}$/i.test(token.trim());
}

/** Guest draft shares expire after this many days. */
export const GUEST_SHARE_TTL_DAYS = 30;

export function guestShareExpiresAt(from = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + GUEST_SHARE_TTL_DAYS);
  return d;
}
