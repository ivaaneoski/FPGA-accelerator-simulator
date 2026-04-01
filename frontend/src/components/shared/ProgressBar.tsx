interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
  isBram?: boolean;
}

export function ProgressBar({ value, className, isBram = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  
  // Notion uses subtle blues and muted semantic colors
  let colorClass = "bg-[#2eaadc] dark:bg-[#2383e2]"; // Primary Notion blue
  
  if (isBram) {
    colorClass = "bg-notion-tagYellowText dark:bg-notionDark-tagYellowText";
  } else {
    if (clamped >= 80) colorClass = "bg-[#E03E3E] dark:bg-[#DF5452]"; // Red warning
    else if (clamped >= 60) colorClass = "bg-[#D9730D] dark:bg-[#C77D48]"; // Orange warning
  }

  return (
    <div className={`w-full bg-notion-border dark:bg-notionDark-border rounded h-[4px] overflow-hidden flex ${className || ''}`}>
      <div 
        className={`h-full ${colorClass} transition-all duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
