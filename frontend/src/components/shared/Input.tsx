import { forwardRef } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from './Badge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full relative">
        {label && <label className="text-[14px] text-notion-textSecondary dark:text-notionDark-textSecondary font-medium">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "w-full bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-2.5 py-1.5 text-[14px] text-notion-text dark:text-notionDark-text placeholder:text-notion-textSecondary dark:placeholder:text-notionDark-textSecondary hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover focus:bg-notion-bg dark:focus:bg-notionDark-bg focus:outline-none focus:border-[rgba(45,170,219,0.5)] focus:ring-[rgba(45,170,219,0.3)] focus:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm",
              error && "border-[#E03E3E] dark:border-[#DF5452] focus:border-[#E03E3E] focus:ring-[rgba(224,62,62,0.2)]",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[12px] text-[#E03E3E] dark:text-[#DF5452] leading-tight">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full relative">
        {label && <label className="text-[14px] text-notion-textSecondary dark:text-notionDark-textSecondary font-medium">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-2.5 py-1.5 text-[14px] text-notion-text dark:text-notionDark-text hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover focus:bg-notion-bg dark:focus:bg-notionDark-bg focus:outline-none focus:border-[rgba(45,170,219,0.5)] focus:ring-[rgba(45,170,219,0.3)] focus:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm appearance-none",
              error && "border-[#E03E3E] dark:border-[#DF5452] focus:border-[#E03E3E] focus:ring-[rgba(224,62,62,0.2)]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-notion-textSecondary dark:text-notionDark-textSecondary">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        {error && <span className="text-[12px] text-[#E03E3E] dark:text-[#DF5452] leading-tight">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
