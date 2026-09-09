export default function ReelBlueprintPreview() {
  const steps = [
    "Title card with name, position, birth year",
    "Best clips first — make identification easy",
    "Clip variety: skating, offense, defense, special teams",
    "Export checklist before you send",
  ];

  return (
    <section className="recruit-section recruit-split" id="reel-blueprint">
      <div>
        <p className="recruit-eyebrow">HIGHLIGHT REEL BLUEPRINT</p>
        <h2>STRUCTURE YOUR TAPE LIKE A PRO.</h2>
        <p className="recruit-lead">
          Coaches shouldn&apos;t hunt for your best moments. The blueprint shows
          what to include, what order works, and how to stay identifiable.
        </p>
      </div>
      <div className="recruit-panel">
        <p className="recruit-panel-title">Recommended sequence</p>
        <ol className="recruit-step-list">
          {steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
