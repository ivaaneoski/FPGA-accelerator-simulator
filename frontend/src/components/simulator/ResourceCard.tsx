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
      <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-4 py-3 shadow-sm flex flex-col gap-2">
        <div className="h-3 w-24 skeleton rounded mb-1" />
        <div className="h-6 w-32 skeleton rounded" />
        <div className="h-1 w-full skeleton rounded-full mt-2" />
      </div>
    );
  }

  return (
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-4 py-3 shadow-sm flex flex-col justify-between">
      <h3 className="text-[13px] font-semibold text-notion-textSecondary dark:text-notionDark-textSecondary truncate mb-1">{title}</h3>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[20px] font-bold text-notion-text dark:text-notionDark-text leading-tight">{value.toLocaleString()}</span>
        <span className="text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary tabular-nums leading-tight">
          {total > 0 ? `/ ${total.toLocaleString()}` : ''} {unit}
        </span>
        {total > 0 && (
           <span className={cn(
               "ml-auto text-[12px] font-medium leading-tight", 
               percentage >= 80 ? 'text-[#E03E3E] dark:text-[#DF5452]' : percentage >= 60 ? 'text-[#D9730D] dark:text-[#C77D48]' : 'text-notion-textSecondary dark:text-notionDark-textSecondary'
           )}>
              ({percentage.toFixed(1)}%)
           </span>
        )}
      </div>
      {total > 0 && <ProgressBar value={percentage} isBram={isBram} className="mt-1" />}
    </div>
  );
}
