import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './Badge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseClass = "inline-flex items-center gap-2 justify-center transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Exact brand guidelines styles
    const variants = {
      primary: "bg-indigo-500 text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-indigo-600 active:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900",
      secondary: "bg-transparent border-[1.5px] border-indigo-500 text-indigo-500 font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-indigo-500/10 active:bg-indigo-500/20 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900",
      danger: "bg-transparent border-[1.5px] border-red-500 text-red-500 font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-red-500/10 active:bg-red-500/20 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900",
      icon: "bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5 w-8 h-8 rounded-md p-1 focus:ring-indigo-500"
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
