import Link from "next/link";

export default function RecruitFooter() {
  return (
    <footer className="recruit-footer">
      <div className="recruit-footer-inner">
        <div>
          <p className="recruit-logo">
            <span className="recruit-logo-powr">POWR</span>{" "}
            <span className="recruit-logo-recruit">Recruit</span>
          </p>
          <p>The Complete Hockey Recruiting Toolkit</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/">POWR Home</Link>
          <Link href="/recruit/sample-profile">Sample profile</Link>
          <a href="#offer">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
      </div>
      <p className="recruit-footer-note">
        No guaranteed recruiting outcomes. Presentation and organization tools
        only.
      </p>
    </footer>
  );
}
