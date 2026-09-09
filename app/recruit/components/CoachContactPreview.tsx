import { coachEmail } from "../lib/content";

export default function CoachContactPreview() {
  return (
    <section className="recruit-section recruit-split" id="coach-contact">
      <div>
        <p className="recruit-eyebrow">COACH CONTACT PACK</p>
        <h2>LOOK ORGANIZED. MAKE THEIR JOB EASIER.</h2>
        <p className="recruit-lead">
          Clear templates for introductions, tryout inquiries, follow-ups, and
          video submissions — without sounding like a spam message.
        </p>
      </div>
      <div className="recruit-email-mock" aria-label="Sample coach email template">
        <div className="recruit-email-meta">
          <p>
            <span>To</span> {coachEmail.to}
          </p>
          <p>
            <span>Subject</span> {coachEmail.subject}
          </p>
        </div>
        <pre>{coachEmail.body}</pre>
      </div>
    </section>
  );
}
