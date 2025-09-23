
import { cn } from '../../lib/format';
import type { GridStepState } from '../../state/ui';

const STATE_STYLES: Record<GridStepState, string> = {
  queued: 'bg-white/15',
  thinking: 'bg-blue-400/70 animate-pulse',
  rendering: 'bg-gradient-to-r from-[rgba(62,139,255,0.7)] to-[rgba(107,112,255,0.7)]',
  ready: 'bg-emerald-400',
  error: 'bg-rose-400',
};

interface StepDotProps {
  state: GridStepState;
}

export function StepDot({ state }: StepDotProps) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full transition-all duration-200',
        STATE_STYLES[state]
      )}
    />
  );
}
