interface EfficiencyScoreProps {
  score: number;
}

export function EfficiencyScore({ score }: EfficiencyScoreProps) {
  let label = "Poor";
  let color = "text-red-500";
  if (score >= 80) { label = "Excellent"; color = "text-green-500"; }
  else if (score >= 60) { label = "Good"; color = "text-indigo-500"; }
  else if (score >= 40) { label = "Fair"; color = "text-amber-500"; }

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full">
      <div className="text-[64px] font-bold tracking-tight mb-2" style={{color: color.replace('text-', '').replace('-500', '') === 'indigo' ? '#6366f1' : color.replace('text-', '').replace('-500', '') === 'green' ? '#22c55e' : color.replace('text-', '').replace('-500', '') === 'amber' ? '#f59e0b' : '#ef4444'}}>
         {score.toFixed(0)}
      </div>
      <div className={`text-xl font-semibold uppercase ${color} mb-1`}>{label}</div>
      <div className="text-sm text-slate-400">Overall Efficiency Score</div>
    </div>
  );
}
