"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import BetaBadge from "./BetaBadge";
import { fetchEntitlementBalance } from "./assessmentEntitlements";

function accountInitial(email: string | null | undefined) {
  const letter = (email || "P").trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(letter) ? letter : "P";
}

export default function AccountBar() {
  const pathname = usePathname();
  const { configured, loading, user, email, signOut } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);
  const initial = useMemo(() => accountInitial(email), [email]);

  useEffect(() => {
    if (!user) {
      setRemaining(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const balance = await fetchEntitlementBalance();
      if (!cancelled && balance) {
        setRemaining(balance.remaining);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  // Recruit stays purchase/download-only — no account chrome there.
  if (pathname?.startsWith("/recruit")) {
    return null;
  }

  if (!configured) {
    return null;
  }

  return (
    <div className="account-bar">
      <div className="account-bar-inner">
        <Link href="/" className="account-bar-brand">
          POWR <BetaBadge className="beta-badge-inline" />
        </Link>
        <nav className="account-bar-nav" aria-label="Account">
          <Link href="/#start-assessment">Assess</Link>
          <Link href="/assessments">My assessments</Link>
          <Link href="/recruit">Recruit</Link>
          {loading ? (
            <span className="account-bar-muted">…</span>
          ) : user ? (
            <>
              {remaining != null ? (
                <span className="account-bar-muted" title="Assessments remaining">
                  {remaining} left
                </span>
              ) : null}
              <Link
                href="/assessments"
                className="account-bar-avatar"
                title={email ? `Account · ${email}` : "My assessments"}
                aria-label="Open my assessments"
              >
                <span className="account-bar-avatar-mark" aria-hidden="true">
                  {initial}
                </span>
                <span className="account-bar-avatar-label">Account</span>
              </Link>
              <button
                type="button"
                className="account-bar-button"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="account-bar-button is-signin">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
