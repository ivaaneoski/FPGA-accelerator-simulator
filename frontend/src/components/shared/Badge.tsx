import type { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type BadgeVariant = 'conv2d' | 'dense' | 'compute_bound' | 'memory_bound' | 'default';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    conv2d: "bg-notion-tagBlue text-notion-tagBlueText dark:bg-notionDark-tagBlue dark:text-notionDark-tagBlueText",
    dense: "bg-notion-tagPurple text-notion-tagPurpleText dark:bg-notionDark-tagPurple dark:text-notionDark-tagPurpleText",
    compute_bound: "bg-notion-tagRed text-notion-tagRedText dark:bg-notionDark-tagRed dark:text-notionDark-tagRedText",
    memory_bound: "bg-notion-tagBlue text-notion-tagBlueText dark:bg-notionDark-tagBlue dark:text-notionDark-tagBlueText",
    default: "bg-notion-tagGray text-notion-tagGrayText dark:bg-notionDark-tagGray dark:text-notionDark-tagGrayText"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[14px] font-medium leading-tight whitespace-nowrap",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
