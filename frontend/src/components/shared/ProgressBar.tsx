import { cn } from './Badge';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  isBram?: boolean;
}

export function ProgressBar({ value, className, isBram = false }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  
  let fillClass = 'bg-green-500';
  if (isBram) {
     fillClass = 'bg-amber-500';
  } else {
      if (clamped >= 80) fillClass = 'bg-red-500';
      else if (clamped >= 60) fillClass = 'bg-amber-500';
  }

  return (
    <div className={cn("w-full h-[6px] rounded-full bg-slate-700 overflow-hidden", className)}>
      <div 
        className={cn("h-full rounded-full transition-all duration-300 ease-in-out", fillClass)} 
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
