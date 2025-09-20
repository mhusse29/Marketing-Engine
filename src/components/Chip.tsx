import type { ReactNode } from 'react';
import { cn } from '../lib/format';

interface ChipProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export function Chip({ 
  children, 
  variant = 'secondary', 
  size = 'md',
  className 
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-all',
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
        },
        {
          'border border-white/10 bg-white/[0.06] text-white/70': variant === 'secondary',
          'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_8px_24px_rgba(62,139,255,0.35)]':
            variant === 'accent',
          'bg-white/10 text-[rgba(231,236,243,0.9)]': variant === 'primary',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
