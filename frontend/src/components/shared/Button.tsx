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
      primary: "bg-[#2eaadc] text-white font-medium rounded shadow-sm px-3 py-1.5 hover:bg-[#2096c3] active:bg-[#1a85af] dark:bg-[#2383e2] dark:hover:bg-[#1d6fc0]",
      secondary: "bg-notion-bg text-notion-text font-medium rounded px-3 py-1.5 border border-notion-border hover:bg-notion-bgHover active:bg-notion-bgActive hover:border-notion-textSecondary dark:bg-notionDark-bg dark:text-notionDark-text dark:border-notionDark-border dark:hover:bg-notionDark-bgHover dark:hover:border-notionDark-textSecondary",
      danger: "bg-notion-bg font-medium rounded px-3 py-1.5 border border-notion-border text-[#E03E3E] hover:bg-[#FBE4E4] hover:border-[#E03E3E] dark:bg-notionDark-bg dark:text-[#DF5452] dark:border-notionDark-border dark:hover:bg-[rgba(255,0,26,0.1)]",
      ghost: "bg-transparent text-notion-textSecondary font-medium rounded px-3 py-1.5 hover:bg-notion-bgHover active:bg-notion-bgActive dark:text-notionDark-textSecondary dark:hover:bg-notionDark-bgHover dark:active:bg-notionDark-bgActive",
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
