"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mergeDeviceEntitlementsOnLogin } from "./assessmentEntitlements";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  email: string | null;
  sendSignInCode: (email: string) => Promise<{ error?: string }>;
  verifySignInCode: (
    email: string,
    token: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function formatAuthError(message: string, kind: "send" | "verify" = "send"): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("security purposes")
  ) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (
    kind === "verify" &&
    (lower.includes("expired") || lower.includes("invalid"))
  ) {
    return "That code is invalid or expired. Request a new one.";
  }
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "Could not reach sign-in service. Check your connection and try again.";
  }
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const mergedForUser = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!configured) {
      setUser(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();
    setUser(nextUser);
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    void refresh();
    if (!configured) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [configured, refresh]);

  useEffect(() => {
    if (!user?.id) {
      mergedForUser.current = null;
      return;
    }
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;
    void mergeDeviceEntitlementsOnLogin(user.id);
  }, [user?.id]);

  const sendSignInCode = useCallback(
    async (email: string) => {
      if (!configured) {
        return { error: "Accounts are not configured yet." };
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) return { error: formatAuthError(error.message, "send") };
        return {};
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign-in failed.";
        return { error: formatAuthError(msg, "send") };
      }
    },
    [configured],
  );

  const verifySignInCode = useCallback(
    async (email: string, token: string) => {
      if (!configured) {
        return { error: "Accounts are not configured yet." };
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: "email",
        });

        if (error) return { error: formatAuthError(error.message, "verify") };
        await refresh();
        return {};
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Verification failed.";
        return { error: formatAuthError(msg, "verify") };
      }
    },
    [configured, refresh],
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      user,
      email: user?.email ?? null,
      sendSignInCode,
      verifySignInCode,
      signOut,
      refresh,
    }),
    [configured, loading, user, sendSignInCode, verifySignInCode, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
