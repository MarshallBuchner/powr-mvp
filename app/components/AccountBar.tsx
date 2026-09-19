"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import BetaBadge from "./BetaBadge";
import { fetchEntitlementBalance } from "./assessmentEntitlements";

export default function AccountBar() {
  const pathname = usePathname();
  const { configured, loading, user, email, signOut } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);

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
        <nav className="account-bar-nav">
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
              <span className="account-bar-muted">{email}</span>
              <button type="button" className="account-bar-button" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="account-bar-button">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
