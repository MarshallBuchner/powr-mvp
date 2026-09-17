type BetaBadgeProps = {
  className?: string;
};

export default function BetaBadge({ className = "" }: BetaBadgeProps) {
  return (
    <span className={`beta-badge${className ? ` ${className}` : ""}`}>
      BETA
    </span>
  );
}
