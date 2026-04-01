interface EfficiencyScoreProps {
  score: number;
}

export function EfficiencyScore({ score }: EfficiencyScoreProps) {
  let label = "Poor";
  let colorHex = "#E03E3E"; // Red
  if (score >= 80) { label = "Excellent"; colorHex = "#0F7B6C"; } // Green
  else if (score >= 60) { label = "Good"; colorHex = "#0B6E99"; } // Blue text
  else if (score >= 40) { label = "Fair"; colorHex = "#D9730D"; } // Orange

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full">
      <div className="text-[64px] font-bold tracking-tight mb-2 leading-none" style={{color: colorHex}}>
         {score.toFixed(0)}
      </div>
      <div className="text-[14px] font-semibold uppercase tracking-wider mb-1" style={{color: colorHex}}>{label}</div>
      <div className="text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary mt-2">Overall Efficiency Score</div>
    </div>
  );
}
