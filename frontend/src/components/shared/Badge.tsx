import type { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Badge
interface BadgeProps {
  children: ReactNode;
  variant?: 'conv2d' | 'dense' | 'compute_bound' | 'memory_bound' | 'fp32' | 'int8' | 'int4' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    conv2d: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    dense: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
    compute_bound: 'bg-red-500/15 text-red-400 border border-red-500/30',
    memory_bound: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    fp32: 'bg-orange-500/15 text-orange-400',
    int8: 'bg-indigo-500/15 text-indigo-400',
    int4: 'bg-purple-500/15 text-purple-400',
    default: 'bg-slate-700 text-slate-100',
  };

  return (
    <span className={cn('px-2 py-[2px] rounded-md text-xs font-semibold inline-flex items-center justify-center', variants[variant], className)}>
      {children}
    </span>
  );
}
