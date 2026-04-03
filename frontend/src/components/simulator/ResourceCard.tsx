import { ProgressBar } from '../shared/ProgressBar';
import { cn } from '../shared/Badge';

interface ResourceCardProps {
  title: string;
  valueStr: string;
  totalStr: string;
  unit?: string;
  isLoading?: boolean;
  isBram?: boolean;
  percentage?: number;
}

export function ResourceCard({ title, valueStr, totalStr, unit, isLoading, isBram = false, percentage = 0 }: ResourceCardProps) {
  if (isLoading) {
    return (
      <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-4 py-3 shadow-sm flex flex-col gap-2">
        <div className="h-3 w-24 skeleton rounded mb-1" />
        <div className="h-6 w-32 skeleton rounded" />
        <div className="h-1 w-full skeleton rounded-full mt-2" />
      </div>
    );
  }

  const tooltipMsg = "Estimated value. Real synthesis results may differ by \u00b115\u201325%. Based on Sze et al. 2017 and Xilinx UG579.";

  return (
    <div 
      className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
      title={tooltipMsg}
    >
      <h3 className="text-[13px] font-semibold text-notion-textSecondary dark:text-notionDark-textSecondary truncate mb-1">{title}</h3>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[20px] font-bold text-notion-text dark:text-notionDark-text leading-tight">{valueStr}</span>
        {totalStr && (
          <span className="text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary tabular-nums leading-tight">
            / {totalStr} {unit}
          </span>
        )}
        {!totalStr && unit && (
          <span className="text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary tabular-nums leading-tight">
            {unit}
          </span>
        )}
        {totalStr && percentage > 0 && (
           <span className={cn(
               "ml-auto text-[12px] font-medium leading-tight", 
               percentage >= 80 ? 'text-[#E03E3E] dark:text-[#DF5452]' : percentage >= 60 ? 'text-[#D9730D] dark:text-[#C77D48]' : 'text-notion-textSecondary dark:text-notionDark-textSecondary'
           )}>
              ({percentage.toFixed(1)}%)
           </span>
        )}
      </div>
      {totalStr && <ProgressBar value={percentage} isBram={isBram} className="mt-1" />}
    </div>
  );
}
