import Link from "next/link";
import { PRIMARY_CTA } from "../lib/content";
import CheckoutButton from "./CheckoutButton";

type Props = {
  compact?: boolean;
};

export default function RecruitHeader({ compact = false }: Props) {
  return (
    <header className={`recruit-header${compact ? " is-compact" : ""}`}>
      <div className="recruit-header-inner">
        <Link href="/recruit" className="recruit-logo" aria-label="POWR Recruit">
          <span className="recruit-logo-powr">POWR</span>
          <span className="recruit-logo-recruit">Recruit</span>
        </Link>

        <nav className="recruit-nav" aria-label="Recruit navigation">
          <Link href="/recruit#whats-inside">What&apos;s inside</Link>
          <Link href="/recruit#offer">Offer</Link>
          <Link href="/recruit#faq">FAQ</Link>
          <Link href="/recruit/sample-profile">Sample profile</Link>
        </nav>

        <CheckoutButton
          source="header"
          className="recruit-btn recruit-btn-primary recruit-header-cta"
        >
          {PRIMARY_CTA}
        </CheckoutButton>
      </div>
    </header>
  );
}
