import { ProgressBar } from '../shared/ProgressBar';
import { cn } from '../shared/Badge';

interface ResourceCardProps {
  title: string;
  value: number;
  total: number;
  unit: string;
  isLoading?: boolean;
  isBram?: boolean;
}

export function ResourceCard({ title, value, total, unit, isLoading, isBram = false }: ResourceCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <div className="h-6 w-32 skeleton rounded-md mb-4" />
        <div className="h-8 w-48 skeleton rounded-md mb-2" />
        <div className="h-[6px] w-full skeleton rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-[20px] font-semibold text-slate-100 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-[28px] font-bold text-slate-100">{value.toLocaleString()}</span>
        <span className="text-xs text-slate-400 font-light">
          {total > 0 ? `/ ${total.toLocaleString()}` : ''} {unit}
        </span>
        {total > 0 && (
           <span className={cn(
               "ml-auto text-sm font-semibold", 
               percentage >= 80 ? 'text-red-500' : percentage >= 60 ? 'text-amber-500' : 'text-green-500'
           )}>
              ({percentage.toFixed(1)}%)
           </span>
        )}
      </div>
      {total > 0 && <ProgressBar value={percentage} isBram={isBram} />}
    </div>
  );
}
