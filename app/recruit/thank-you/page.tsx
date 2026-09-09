import Link from "next/link";
import RecruitHeader from "../components/RecruitHeader";
import RecruitFooter from "../components/RecruitFooter";

type PageProps = {
  searchParams?: Promise<{
    preview?: string;
    session_id?: string;
  }>;
};

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const isPreview = params.preview === "1";
  const sessionId = params.session_id;
  const downloadHref = sessionId
    ? `/recruit/download?session_id=${encodeURIComponent(sessionId)}`
    : isPreview
      ? "/recruit/download?session_id=preview"
      : "/recruit/download";

  return (
    <>
      <RecruitHeader compact />
      <main className="recruit-page">
        <p className="recruit-eyebrow">YOU&apos;RE IN</p>
        <h1>
          {isPreview
            ? "PREVIEW CHECKOUT COMPLETE."
            : "THANKS — YOUR TOOLKIT IS READY."}
        </h1>
        <p className="recruit-lead">
          {isPreview
            ? "Stripe is not configured yet in this environment, so you are seeing the preview success flow. Add STRIPE_SECRET_KEY (and optionally STRIPE_RECRUIT_PRICE_ID) to go live."
            : "Next step: download your POWR Recruit files and start with the START HERE guide. Build your profile first, then organize outreach and tracking."}
        </p>

        <div className="recruit-page-card">
          <p className="recruit-panel-title">What you can do now</p>
          <ol className="recruit-step-list">
            <li>
              <span>01</span>
              <p>Download the ZIP with designed PDFs + Excel tracker.</p>
            </li>
            <li>
              <span>02</span>
              <p>Open START HERE and follow the 30–60 minute setup plan.</p>
            </li>
            <li>
              <span>03</span>
              <p>Fill templates, customize coach emails, and track programs.</p>
            </li>
          </ol>

          <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href={downloadHref} className="recruit-btn recruit-btn-primary">
              Download toolkit
            </Link>
            <Link href="/" className="recruit-btn recruit-btn-secondary">
              Explore POWR assessment
            </Link>
          </div>
        </div>

        <div className="recruit-upsell">
          <h2>Optional: Recruiting Reel Review (+$30 CAD)</h2>
          <p>
            Want a second set of eyes on your recruiting tape? Get structured
            feedback on clip order, clarity, player identification, pacing, and
            overall presentation.
          </p>
          <p className="recruit-lead" style={{ margin: 0 }}>
            This button is still a placeholder until the upsell flow is wired.
          </p>
        </div>
      </main>
      <RecruitFooter />
    </>
  );
}
