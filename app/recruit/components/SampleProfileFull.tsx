import Link from "next/link";
import { PRICE, coachEmail, samplePlayer } from "../lib/content";

export default function SampleProfileFull() {
  return (
    <main className="recruit-page recruit-sample-full">
      <p className="recruit-eyebrow">SAMPLE PLAYER PROFILE</p>
      <div className="recruit-sample-hero">
        <div>
          <h1>{samplePlayer.name}</h1>
          <p className="recruit-sample-role">
            #{samplePlayer.number} · {samplePlayer.position} ·{" "}
            {samplePlayer.birthYear} · {samplePlayer.team}
          </p>
          <p className="recruit-lead">{samplePlayer.tagline}</p>
        </div>
        <div className="recruit-sample-avatar" aria-hidden="true">
          <span>EC</span>
          <em>Photo placeholder</em>
        </div>
      </div>

      <div className="recruit-sample-grid">
        <section className="recruit-page-card">
          <p className="recruit-panel-title">Identity</p>
          <dl className="recruit-sample-meta">
            <div>
              <dt>Size</dt>
              <dd>
                {samplePlayer.height} / {samplePlayer.weight}
              </dd>
            </div>
            <div>
              <dt>Shoots</dt>
              <dd>{samplePlayer.shoots}</dd>
            </div>
            <div>
              <dt>Born</dt>
              <dd>{samplePlayer.dob}</dd>
            </div>
            <div>
              <dt>Hometown</dt>
              <dd>{samplePlayer.hometown}</dd>
            </div>
            <div>
              <dt>League</dt>
              <dd>{samplePlayer.league}</dd>
            </div>
            <div>
              <dt>Team</dt>
              <dd>{samplePlayer.team}</dd>
            </div>
          </dl>
        </section>

        <section className="recruit-page-card">
          <p className="recruit-panel-title">Season production</p>
          <div className="recruit-stat-row recruit-sample-stats">
            {samplePlayer.stats.map((stat) => (
              <div key={stat.label} className="recruit-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="recruit-page-card recruit-sample-span">
          <p className="recruit-panel-title">Player bio</p>
          <p className="recruit-lead" style={{ margin: 0 }}>
            {samplePlayer.bio}
          </p>
          <ul className="recruit-sample-strengths">
            {samplePlayer.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="recruit-page-card">
          <p className="recruit-panel-title">Playing experience</p>
          <ul className="recruit-sample-experience">
            {samplePlayer.experience.map((row) => (
              <li key={`${row.team}-${row.years}`}>
                <div>
                  <strong>
                    {row.team} · {row.league}
                  </strong>
                  <span>{row.note}</span>
                </div>
                <em>{row.years}</em>
              </li>
            ))}
          </ul>
        </section>

        <section className="recruit-page-card">
          <p className="recruit-panel-title">Academics</p>
          <dl className="recruit-sample-meta">
            <div>
              <dt>School</dt>
              <dd>{samplePlayer.academics.school}</dd>
            </div>
            <div>
              <dt>Grade</dt>
              <dd>{samplePlayer.academics.grade}</dd>
            </div>
            <div>
              <dt>GPA</dt>
              <dd>{samplePlayer.academics.gpa}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{samplePlayer.academics.focus}</dd>
            </div>
          </dl>
        </section>

        <section className="recruit-page-card recruit-sample-span">
          <p className="recruit-panel-title">Highlight reel structure</p>
          <div className="recruit-sample-reel">
            <div className="recruit-video-fake" aria-hidden="true">
              <span>▶</span>
              <em>Title card → best shift first</em>
            </div>
            <ol>
              {samplePlayer.highlights.map((clip) => (
                <li key={clip.title}>
                  <span>{clip.title}</span>
                  <em>{clip.time}</em>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="recruit-page-card">
          <p className="recruit-panel-title">Contact</p>
          <dl className="recruit-sample-meta">
            <div>
              <dt>Email</dt>
              <dd>{samplePlayer.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{samplePlayer.phone}</dd>
            </div>
          </dl>
          <ul className="recruit-sample-experience">
            {samplePlayer.references.map((ref) => (
              <li key={ref.role}>
                <div>
                  <strong>{ref.role}</strong>
                  <span>{ref.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="recruit-page-card">
          <p className="recruit-panel-title">Coach intro email</p>
          <div className="recruit-email-mock recruit-sample-email">
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
      </div>

      <div className="recruit-sample-actions">
        <Link href="/recruit#offer" className="recruit-btn recruit-btn-primary">
          Build a profile like this — {PRICE}
        </Link>
        <Link href="/recruit" className="recruit-text-link">
          ← Back to POWR Recruit
        </Link>
      </div>
    </main>
  );
}
