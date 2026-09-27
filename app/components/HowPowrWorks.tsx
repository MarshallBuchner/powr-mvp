export default function HowPowrWorks() {
  return (
    <section className="how-powr-works">
      <div className="how-powr-heading">
        <p className="eyebrow">HOW POWR WORKS</p>

        <h2>AI-assisted feedback for hockey development.</h2>

        <p>
          Three simple steps from skating video to a clear development report.
        </p>
      </div>

      <div className="how-powr-grid">
        <article className="how-powr-card">
          <div className="how-powr-card-top">
            <span className="how-powr-number">01</span>
            <span className="how-powr-icon">↑</span>
          </div>

          <h3>Upload your skating clip</h3>

          <p>
            Choose what you want to improve and upload a short skating video
            from your phone or camera.
          </p>

          <div className="how-powr-preview upload-preview">
            <div className="preview-upload-icon">↑</div>

            <div>
              <strong>Upload skating video</strong>
              <span>10–30 second clip</span>
            </div>
          </div>
        </article>

        <article className="how-powr-card">
          <div className="how-powr-card-top">
            <span className="how-powr-number">02</span>
            <span className="how-powr-icon">AI</span>
          </div>

          <h3>POWR reviews visible skating mechanics</h3>

          <p>
            AI evaluates mechanics that can reasonably be seen in your sampled
            frames — results depend on camera angle, lighting, and clip quality.
          </p>

          <div className="how-powr-preview analysis-preview">
            <div className="analysis-preview-row">
              <span>Acceleration mechanics</span>
              <strong>82</strong>
            </div>

            <div className="preview-track">
              <div style={{ width: "82%" }} />
            </div>

            <div className="analysis-preview-row">
              <span>Stride power</span>
              <strong>85</strong>
            </div>

            <div className="preview-track">
              <div style={{ width: "85%" }} />
            </div>

            <div className="analysis-preview-row">
              <span>Knee flexion</span>
              <strong>78</strong>
            </div>

            <div className="preview-track">
              <div style={{ width: "78%" }} />
            </div>
          </div>
        </article>

        <article className="how-powr-card">
          <div className="how-powr-card-top">
            <span className="how-powr-number">03</span>
            <span className="how-powr-icon">✓</span>
          </div>

          <h3>Get your development plan</h3>

          <p>
            See your scores, strengths, highest-priority improvement, and
            personalized drills to guide your next sessions.
          </p>

          <div className="how-powr-preview report-preview">
            <div className="mini-score">
              <strong>82</strong>
              <span>Overall score</span>
            </div>

            <div className="mini-priority">
              <span>TOP PRIORITY</span>
              <strong>Stay lower through your first 3 strides.</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}