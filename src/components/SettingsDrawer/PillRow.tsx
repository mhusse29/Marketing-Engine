import type { ReactNode } from 'react';
import { cn } from '../../lib/format';

interface PillRowProps {
  title: string;
  subtitle?: string;
  titleSlot?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  rightSlot?: ReactNode;
  collapsedContent?: ReactNode;
  children?: ReactNode;
}

export default function PillRow({
  title,
  subtitle,
  titleSlot,
  expanded,
  onToggle,
  rightSlot,
  collapsedContent,
  children,
}: PillRowProps) {
  const leftContent = titleSlot ?? (
    <div className="min-w-0">
      <div className="text-sm font-medium text-white">{title}</div>
      {subtitle ? <div className="text-xs text-white/60">{subtitle}</div> : null}
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/[0.07] focus:outline-none"
      >
        <div className="min-w-0 flex items-center gap-2 text-white/90">{leftContent}</div>
        <div className="flex items-center gap-2 text-white/60">
          {rightSlot}
          <svg
            className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M7 5l6 5-6 5z" />
          </svg>
        </div>
      </button>
      {!expanded && collapsedContent ? (
        <div className="px-4 pb-3">{collapsedContent}</div>
      ) : null}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0 overflow-hidden px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}
