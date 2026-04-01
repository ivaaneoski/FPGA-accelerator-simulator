import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from './Badge';

interface TooltipProps {
  children: ReactNode;
  content: string;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
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

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={showTooltip} 
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            "absolute z-50 px-2 py-1 text-[12px] font-medium leading-tight rounded shadow-sm whitespace-nowrap animate-fade-in pointer-events-none",
            "bg-[#191919] text-white dark:bg-white dark:text-[#191919]",
            positionClasses[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
