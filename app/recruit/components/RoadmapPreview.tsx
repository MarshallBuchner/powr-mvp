const roadmap = [
  { when: "Preseason", what: "Build profile, draft bio, start clip bank" },
  { when: "Early season", what: "Update stats, send first outreach wave" },
  { when: "Midseason", what: "Refresh reel, follow up, add showcases" },
  { when: "Late season", what: "Target opportunities, tighten materials" },
  { when: "Offseason", what: "Reset goals, rebuild tape, plan next year" },
];

export default function RoadmapPreview() {
  return (
    <section className="recruit-section" id="roadmap">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">RECRUITING ROADMAP</p>
        <h2>KNOW WHAT TO UPDATE AND WHEN.</h2>
      </div>
      <ol className="recruit-roadmap">
        {roadmap.map((item) => (
          <li key={item.when}>
            <strong>{item.when}</strong>
            <span>{item.what}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
