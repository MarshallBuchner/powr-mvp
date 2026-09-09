import { PRIMARY_CTA } from "../lib/content";
import CheckoutButton from "./CheckoutButton";

export default function FinalCTA() {
  return (
    <section className="recruit-section recruit-final" id="final-cta">
      <p className="recruit-eyebrow">READY</p>
      <h2>GOOD PLAYERS DESERVE A PROFESSIONAL PLAN.</h2>
      <p className="recruit-lead">
        Get organized. Present yourself better. Make it easier for coaches to
        evaluate you.
      </p>
      <CheckoutButton source="final" className="recruit-btn recruit-btn-primary">
        {PRIMARY_CTA}
      </CheckoutButton>
    </section>
  );
}
