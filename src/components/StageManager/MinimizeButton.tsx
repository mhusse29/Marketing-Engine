import { Minus } from 'lucide-react';
import { cn } from '../../lib/format';

interface MinimizeButtonProps {
  onMinimize: () => void;
  className?: string;
}

export function MinimizeButton({ onMinimize, className }: MinimizeButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onMinimize();
      }}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        'bg-black/40 text-white/70 backdrop-blur-sm',
        'transition-colors hover:bg-black/60 hover:text-white',
        'active:scale-95',
        className
      )}
      title="Minimize to Stage Manager"
      aria-label="Minimize card"
    >
      <Minus className="h-4 w-4" />
    </button>
  );
}

