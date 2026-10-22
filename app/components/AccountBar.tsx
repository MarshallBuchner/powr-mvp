"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import BetaBadge from "./BetaBadge";

export default function AccountBar() {
  const pathname = usePathname();
  const { loading, user } = useAuth();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuOpen = openPath === pathname;
  const closeMenu = () => setOpenPath(null);

  if (pathname?.startsWith("/recruit")) return null;

  return (
    <header className={`account-bar${menuOpen ? " is-menu-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          closeMenu();
          toggle.current?.focus();
        }
      }}>
      <div className="account-bar-inner">
        <Link href="/" className="account-bar-brand" onClick={closeMenu}>
          POWR <BetaBadge className="beta-badge-inline" />
        </Link>
        <div className="account-bar-actions">
          <button ref={toggle} type="button" className="account-bar-menu-toggle"
            aria-expanded={menuOpen} aria-controls="account-bar-menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={(event) => {
              event.currentTarget.focus();
              setOpenPath(menuOpen ? null : pathname);
            }}>
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
        <nav id="account-bar-menu" className="account-bar-nav" aria-label="Main">
          <Link href="/#start-assessment" onClick={closeMenu}>Assess</Link>
          {!loading && user ? <Link href="/assessments" onClick={closeMenu}>My Assessments</Link> : null}
          <Link href="/pricing" onClick={closeMenu}>Pricing</Link>
          {loading ? <span className="account-bar-muted" role="status">Loading account…</span> : user ? (
            <Link href="/account" onClick={closeMenu}>Account</Link>
          ) : (
            <Link href="/login" className="account-bar-button is-signin" onClick={closeMenu}>Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
