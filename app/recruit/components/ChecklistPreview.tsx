const phases = [
  {
    title: "Before",
    items: ["Gear ready", "Travel locked", "Profile updated", "Target teams listed"],
  },
  {
    title: "During",
    items: ["Compete hard", "Communicate", "Coach interactions", "Note contacts"],
  },
  {
    title: "After",
    items: ["Send follow-ups", "Update tracker", "Save footage", "Set next steps"],
  },
];

export default function ChecklistPreview() {
  return (
    <section className="recruit-section" id="checklist">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">TRYOUT & SHOWCASE CHECKLIST</p>
        <h2>SHOW UP READY. FOLLOW UP CLEAN.</h2>
      </div>
      <div className="recruit-checklist-grid">
        {phases.map((phase) => (
          <article key={phase.title} className="recruit-panel">
            <p className="recruit-panel-title">{phase.title}</p>
            <ul className="recruit-check-list">
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
