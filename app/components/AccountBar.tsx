"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AccountBar() {
  const pathname = usePathname();
  const { configured, loading, user, email, signOut } = useAuth();

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
          POWR
        </Link>
        <nav className="account-bar-nav">
          <Link href="/#start-assessment">Assess</Link>
          <Link href="/assessments">My assessments</Link>
          <Link href="/recruit">Recruit</Link>
          {loading ? (
            <span className="account-bar-muted">…</span>
          ) : user ? (
            <>
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
