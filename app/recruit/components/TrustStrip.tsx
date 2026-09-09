export default function TrustStrip() {
  const items = [
    { title: "Stand out", text: "Pro profile presentation" },
    { title: "Connect", text: "Coach-ready outreach" },
    { title: "Stay organized", text: "Track every opportunity" },
    { title: "Play higher", text: "Clear next steps" },
  ];

  return (
    <section className="recruit-trust-strip" aria-label="Value highlights">
      {items.map((item) => (
        <div key={item.title} className="recruit-trust-item">
          <strong>{item.title}</strong>
          <span>{item.text}</span>
        </div>
      ))}
    </section>
  );
}
