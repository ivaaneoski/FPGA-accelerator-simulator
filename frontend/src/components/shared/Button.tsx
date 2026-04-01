import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './Badge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseClass = "inline-flex items-center gap-2 justify-center transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] leading-tight";
    
    const variants = {
      primary: "bg-[#2eaadc] text-white font-medium rounded shadow-sm px-3 py-1.5 hover:bg-[#2096c3] hover:-translate-y-0.5 hover:shadow-md active:bg-[#1a85af] active:translate-y-0 active:scale-[0.98] transition-all duration-200 dark:bg-[#2383e2] dark:hover:bg-[#1d6fc0]",
      secondary: "bg-notion-bg text-notion-text font-medium rounded px-3 py-1.5 border border-notion-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-notion-bgHover hover:-translate-y-0.5 hover:shadow-md active:bg-notion-bgActive hover:border-notion-textSecondary active:translate-y-0 active:scale-[0.98] transition-all duration-200 dark:bg-notionDark-bg dark:text-notionDark-text dark:border-notionDark-border dark:hover:bg-notionDark-bgHover dark:hover:border-notionDark-textSecondary",
      danger: "bg-notion-bg font-medium rounded px-3 py-1.5 border border-notion-border text-[#E03E3E] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-[#FBE4E4] hover:-translate-y-0.5 hover:shadow-md hover:border-[#E03E3E] active:translate-y-0 active:scale-[0.98] transition-all duration-200 dark:bg-notionDark-bg dark:text-[#DF5452] dark:border-notionDark-border dark:hover:bg-[rgba(255,0,26,0.1)]",
      ghost: "bg-transparent text-notion-textSecondary font-medium rounded px-3 py-1.5 hover:bg-notion-bgHover hover:-translate-y-0.5 hover:shadow-sm active:bg-notion-bgActive active:translate-y-0 active:scale-[0.98] transition-all duration-200 dark:text-notionDark-textSecondary dark:hover:bg-notionDark-bgHover dark:active:bg-notionDark-bgActive",
      icon: "notion-icon-btn"
    };

    return (
      <button 
        ref={ref}
        className={cn(baseClass, variants[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
