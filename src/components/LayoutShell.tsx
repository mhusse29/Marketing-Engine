import type { CSSProperties, ReactNode } from 'react';
import { TwoDimensionStackedGrid } from './TwoDimensionStackedGrid';
import { SessionTimeoutBanner } from './SessionTimeoutBanner';

interface LayoutShellProps {
  menu: ReactNode;
  main: ReactNode;
  topBarHeight?: number;
}

export function LayoutShell({ menu, main, topBarHeight = 64 }: LayoutShellProps) {
  const cssVars = {
    '--topbar-h': `${topBarHeight}px`,
  } as CSSProperties;

  return (
    <div className="notebook h-screen overflow-hidden w-full" style={cssVars}>
      <div className="grid-walkers" aria-hidden="true" />
      
      {/* 3D Stacked Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" aria-hidden="true">
        <TwoDimensionStackedGrid />
      </div>

      <SessionTimeoutBanner />

      <div 
        className="relative h-screen w-full max-w-full overflow-hidden flex flex-col"
        style={{ scrollPaddingTop: 'calc(var(--topbar-h, 64px) + 16px)' }}
      >
        <div className="fixed inset-0 pointer-events-none z-10" aria-hidden="true" />

        <header
          className="fixed left-0 right-0 top-0 z-[100] w-full"
          style={{ 
            height: 'var(--topbar-h, 64px)',
            position: 'fixed',
          }}
        >
          {menu}
        </header>

        <main className="relative z-[20] w-full max-w-full overflow-hidden h-full pt-[calc(var(--topbar-h,64px)+16px)] flex flex-col">
          {main}
        </main>
      </div>
    </div>
  );
}
