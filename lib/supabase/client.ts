import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions } from "./cookies";
import { isSupabaseConfigured } from "./config";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
    },
  );
}
