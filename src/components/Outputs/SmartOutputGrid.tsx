import type { PropsWithChildren } from 'react';

import { cn } from '../../lib/format';

interface SmartOutputGridProps extends PropsWithChildren {
  /** Number of cards being generated/displayed */
  cardCount: number;
  /** Whether cards are currently generating */
  isGenerating?: boolean;
}

/** Smart grid that centers cards and adjusts layout based on count */
export default function SmartOutputGrid({ children, cardCount, isGenerating }: SmartOutputGridProps) {
  // Determine grid layout based on card count
  const getGridClasses = () => {
    const actualCount = isGenerating ? cardCount : (Array.isArray(children) ? children.length : (children ? 1 : 0));

    const base = cn(
      'smart-output-grid grid gap-6 lg:gap-8 transition-[padding]',
      'items-start justify-items-stretch w-full'
    );

    // For generating state, always use the target layout
    if (isGenerating) {
      switch (cardCount) {
        case 1:
          return cn(base, 'grid-cols-1 max-w-[720px] mx-auto');
        case 2:
          return cn(base, 'grid-cols-1 md:grid-cols-2 max-w-[1280px] mx-auto');
        case 3:
        default:
          return cn(base, 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-[1440px] mx-auto');
      }
    }
    
    // For static display, adapt to actual content
    switch (actualCount) {
      case 0:
        return cn(base, 'hidden');
      case 1:
        return cn(base, 'grid-cols-1 max-w-[720px] mx-auto');
      case 2:
        return cn(base, 'grid-cols-1 md:grid-cols-2 max-w-[1280px] mx-auto');
      case 3:
      default:
        return cn(base, 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-[1440px] mx-auto');
    }
  };

  return (
    <div
      className={getGridClasses()}
      style={{
        '--card-aspect': cardCount === 1 ? 'auto' : '1',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
