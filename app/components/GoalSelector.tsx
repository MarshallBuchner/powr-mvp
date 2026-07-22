type GoalSelectorProps = {
  goals: string[];
  selectedGoal: string;
  onSelectGoal: (goal: string) => void;
};

export default function GoalSelector({
  goals,
  selectedGoal,
  onSelectGoal,
}: GoalSelectorProps) {
  return (
    <div className="goal-grid">
      {goals.map((goal) => (
        <button
          key={goal}
          type="button"
          className={`goal-chip ${selectedGoal === goal ? "active" : ""
            }`}
          onClick={() => onSelectGoal(goal)}
        >
          {goal}
        </button>
      ))}
    </div>
  );
}