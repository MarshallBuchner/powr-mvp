import { trackerRows } from "../lib/content";

export default function TrackerPreview() {
  return (
    <section className="recruit-section" id="tracker">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">RECRUITING TRACKER</p>
        <h2>EVERY TEAM. EVERY FOLLOW-UP. ONE PLACE.</h2>
        <p className="recruit-lead">
          Stop guessing who you emailed last week. Track programs, coaches,
          status, and next steps in a simple system.
        </p>
      </div>

      <div className="recruit-tracker" role="table" aria-label="Sample recruiting tracker">
        <div className="recruit-tracker-head" role="row">
          <span role="columnheader">Program</span>
          <span role="columnheader">Level</span>
          <span role="columnheader">Coach</span>
          <span role="columnheader">Status</span>
        </div>
        {trackerRows.map((row) => (
          <div className="recruit-tracker-row" role="row" key={row.program}>
            <span role="cell">{row.program}</span>
            <span role="cell">{row.level}</span>
            <span role="cell">{row.coach}</span>
            <span role="cell">
              <em className={`recruit-status is-${row.tone}`}>{row.status}</em>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
