"use client";

type ScoreCircleProps = {
  score: number;
  label?: string;
  delta?: number | null;
};

export default function ScoreCircle({
  score,
  label = "GOOD",
  delta,
}: ScoreCircleProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="rv2-score-circle" aria-label={`Overall score ${clamped}`}>
      <svg viewBox="0 0 140 140" className="rv2-score-svg">
        <circle cx="70" cy="70" r="54" className="rv2-score-track" />
        <circle
          cx="70"
          cy="70"
          r="54"
          className="rv2-score-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="rv2-score-center">
        <strong>
          {clamped}
          <span>/100</span>
        </strong>
        <em>{label}</em>
        {typeof delta === "number" ? (
          <small>+{delta} vs last assessment</small>
        ) : null}
      </div>
    </div>
  );
}
