/**
 * Server-side founder unlimited-access override.
 * Exact email match against FOUNDER_UNLIMITED_EMAIL only — never trust the client.
 */

export function isFounderUnlimited(email: string | null | undefined): boolean {
  const configured = (process.env.FOUNDER_UNLIMITED_EMAIL || "")
    .trim()
    .toLowerCase();
  if (!configured || !email) return false;
  return email.trim().toLowerCase() === configured;
}
