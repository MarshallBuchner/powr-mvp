import Link from "next/link";
import { samplePlayer } from "../lib/content";

export default function ProfileExample() {
  return (
    <section className="recruit-section" id="profile-example">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">PLAYER PROFILE EXAMPLE</p>
        <h2>MORE THAN A PLAYER. A PLAN.</h2>
        <p className="recruit-lead">
          A clean profile coaches can scan in seconds — identity, physicals,
          season numbers, and reel structure in one place.
        </p>
      </div>

      <div className="recruit-profile-shell">
        <div className="recruit-profile-tabs" aria-hidden="true">
          <span className="is-active">Player Profile</span>
          <span>Stats</span>
          <span>Highlights</span>
          <span>Academics</span>
          <span>Contact</span>
        </div>

        <div className="recruit-profile-grid">
          <div className="recruit-profile-identity">
            <p className="recruit-profile-name">{samplePlayer.name}</p>
            <p className="recruit-profile-pos">{samplePlayer.position}</p>
            <p className="recruit-profile-tag">{samplePlayer.tagline}</p>
            <dl className="recruit-profile-meta">
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
            </dl>
          </div>

          <div className="recruit-stat-row">
            {samplePlayer.stats.map((stat) => (
              <div key={stat.label} className="recruit-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="recruit-highlights">
            <p className="recruit-panel-title">Game Highlights</p>
            <div className="recruit-video-fake" aria-hidden="true">
              <span>▶</span>
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
        </div>

        <div className="recruit-profile-cta-row">
          <Link href="/recruit/sample-profile" className="recruit-text-link">
            Open full sample profile →
          </Link>
        </div>
      </div>
    </section>
  );
}
