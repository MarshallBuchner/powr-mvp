"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/recruit")) return null;
  return (
    <footer className="site-footer">
      <nav aria-label="Legal and privacy">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy/settings">Privacy settings</Link>
      </nav>
    </footer>
  );
}
