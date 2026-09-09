import { whoItsFor } from "../lib/content";

export default function WhoItsFor() {
  return (
    <section className="recruit-section" id="who">
      <div className="recruit-section-head">
        <p className="recruit-eyebrow">WHO IT&apos;S FOR</p>
        <h2>BUILT FOR PLAYERS TRYING TO MOVE FORWARD.</h2>
      </div>
      <ul className="recruit-who-grid">
        {whoItsFor.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="recruit-philosophy">
        <h3>RECRUITING ISN&apos;T ABOUT PRETENDING YOU&apos;RE BETTER THAN YOU ARE.</h3>
        <p>
          It&apos;s about making it easy for the right people to understand who
          you are. Your game still has to do the talking. POWR Recruit simply
          helps you present it properly.
        </p>
      </div>
    </section>
  );
}
