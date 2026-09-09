/**
 * Shared auth cookie settings.
 * Set NEXT_PUBLIC_COOKIE_DOMAIN=".yourdomain.com" in production so apex/www share session.
 */
export const authCookieOptions = {
  domain:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined
      : undefined,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
