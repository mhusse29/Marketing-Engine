import type { ReactNode } from 'react';
import { TwoDimensionStackedGrid } from './TwoDimensionStackedGrid';
import { SessionTimeoutBanner } from './SessionTimeoutBanner';

interface LayoutShellProps {
  menu: ReactNode;
  main: ReactNode;
}

export function LayoutShell({ menu, main }: LayoutShellProps) {
  return (
    <div className="notebook min-h-screen overflow-x-hidden w-full">
      <div className="grid-walkers" aria-hidden="true" />
      
      {/* 3D Stacked Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" aria-hidden="true">
        <TwoDimensionStackedGrid />
      </div>

      <SessionTimeoutBanner />

      <div 
        className="relative min-h-screen w-full max-w-full overflow-x-hidden"
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

        <main className="relative z-[20] w-full max-w-full overflow-x-hidden pb-24 pt-[calc(var(--topbar-h,64px)+16px)]">
          {main}
        </main>
      </div>
    </div>
  );
}
