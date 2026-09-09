import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions } from "@/lib/supabase/cookies";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Completes magic-link / OTP sign-in.
 * Prefers token_hash (no PKCE cookie) then falls back to PKCE code exchange.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/assessments";
  const next = rawNext.startsWith("/") ? rawNext : "/assessments";

  const base = origin;
  const loginError = (reason?: string) =>
    NextResponse.redirect(
      `${base}/login?error=auth${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`,
    );

  if (!isSupabaseConfigured()) {
    return loginError("supabase_unconfigured");
  }

  const redirectResponse = NextResponse.redirect(`${base}${next}`);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, {
              ...authCookieOptions,
              ...options,
            });
          });
        },
      },
    },
  );

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) return redirectResponse;
    console.error("[auth/callback] verifyOtp failed:", error.message);
    return loginError(error.message);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectResponse;
    console.error("[auth/callback] exchange failed:", error.message);
    return loginError(error.message);
  }

  return loginError();
}
