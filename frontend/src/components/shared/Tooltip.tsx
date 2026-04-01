import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from './Badge';

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  delay?: number;
  position?: 'top' | 'bottom';
}

export function Tooltip({ children, content, delay = 300, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      className="relative flex items-center group/tooltip"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute z-50 px-3 flex flex-col items-center py-2 text-sm text-slate-100 bg-slate-800 border-slate-700 border rounded-lg shadow-lg max-w-xs whitespace-nowrap",
          position === 'top' ? "bottom-full mb-2 left-1/2 -translate-x-1/2" : "top-full mt-2 left-1/2 -translate-x-1/2"
        )}>
          {content}
          <div className={cn(
              "absolute w-2 h-2 bg-slate-800 border-slate-700 rotate-45",
              position === 'top' ? "bottom-[-5px] border-b border-r" : "top-[-5px] border-t border-l"
          )} />
        </div>
      )}
    </div>
  );
}
