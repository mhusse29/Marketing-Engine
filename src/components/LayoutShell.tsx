import type { ReactNode } from 'react';

interface LayoutShellProps {
  menu: ReactNode;
  main: ReactNode;
}

export function LayoutShell({ menu, main }: LayoutShellProps) {
  return (
    <div className="notebook min-h-screen overflow-x-hidden w-full">
      <div className="grid-walkers" aria-hidden="true" />

      <div className="relative min-h-screen w-full max-w-full overflow-x-hidden">
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

        <main className="relative z-[20] w-full max-w-full overflow-x-hidden pb-24 pt-[var(--topbar-h,64px)]">
          {main}
        </main>
      </div>
    </div>
  );
}
