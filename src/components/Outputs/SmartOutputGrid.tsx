import type { PropsWithChildren } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/format';

interface SmartOutputGridProps extends PropsWithChildren {
  /** Number of cards being generated/displayed */
  cardCount: number;
  /** Whether cards are currently generating */
  isGenerating?: boolean;
}

/** Smart grid that centers cards and adjusts layout based on count */
export default function SmartOutputGrid({ children, cardCount, isGenerating }: SmartOutputGridProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const update = () => {
      const nextTop = grid.getBoundingClientRect().top;
      const available = Math.max(420, window.innerHeight - nextTop - 32);
      grid.style.setProperty('--cards-h', `${available}px`);
    };

    update();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', update);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Determine grid layout based on card count
  const getGridClasses = () => {
    const actualCount = isGenerating ? cardCount : (Array.isArray(children) ? children.length : (children ? 1 : 0));
    const isSingleCard = actualCount === 1;

    const base = cn(
      'smart-output-grid grid gap-6 lg:gap-8 min-h-[var(--cards-h,420px)] transition-[padding]',
      isSingleCard
        ? 'pt-0 place-items-center justify-items-center content-center'
        : 'pt-6 lg:pt-8 items-start'
    );

    // For generating state, always use the target layout
    if (isGenerating) {
      switch (cardCount) {
        case 1:
          return cn(base, 'grid-cols-1 max-w-[680px] mx-auto');
        case 2:
          return cn(base, 'grid-cols-1 md:grid-cols-2 max-w-[1200px] mx-auto');
        case 3:
        default:
          return cn(base, 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-[1400px] mx-auto');
      }
    }
    
    // For static display, adapt to actual content
    switch (actualCount) {
      case 0:
        return cn(base, 'hidden');
      case 1:
        return cn(base, 'grid-cols-1 max-w-[680px] mx-auto');
      case 2:
        return cn(base, 'grid-cols-1 md:grid-cols-2 max-w-[1200px] mx-auto');
      case 3:
      default:
        return cn(base, 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-[1400px] mx-auto');
    }
  };

  return (
    <div
      ref={ref}
      className={getGridClasses()}
      style={{
        '--card-aspect': cardCount === 1 ? 'auto' : '1',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
