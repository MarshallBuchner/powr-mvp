import BetaBadge from "./BetaBadge";

type HeroProps = {
  onViewSample: () => void;
};

export default function Hero({ onViewSample }: HeroProps) {
  return (
    <section className="hero">
      <div className="brand-lockup">
        <div className="brand-row">
          <div className="brand">POWR</div>
          <BetaBadge />
        </div>

        <p className="eyebrow">
          THE HOME OF HOCKEY DEVELOPMENT
        </p>
      </div>

      <div className="hero-copy">
        <h1>
          Train smarter.
          <br />
          Play faster.
        </h1>

        <p>
          Upload a skating clip and receive a clear,
          personalized development report.
        </p>

        <p className="beta-note">
          <strong>POWR BETA</strong> — Assessments are AI-assisted and intended
          for hockey development. Feedback may evolve as we improve with
          players and coaches.
        </p>

        <p className="no-account">
          No account required for your first assessment. Save it after to come
          back later.
        </p>

        <div className="hero-actions">
          <a className="primary-button" href="#start-assessment">
            Upload a skating clip
          </a>

          <button
            className="secondary-button"
            type="button"
            onClick={onViewSample}
          >
            View sample assessment
          </button>
        </div>
      </div>
    </section>
  );
}
