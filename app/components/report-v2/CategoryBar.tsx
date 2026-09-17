"use client";

type CategoryBarProps = {
  name: string;
  score: number;
};

export default function CategoryBar({ name, score }: CategoryBarProps) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="rv2-category-bar">
      <div className="rv2-category-meta">
        <span>{name}</span>
        <strong>{clamped}</strong>
      </div>
      <div className="rv2-category-track" aria-hidden="true">
        <div className="rv2-category-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
