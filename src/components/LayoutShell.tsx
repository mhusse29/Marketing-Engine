import type { ReactNode } from 'react';

interface LayoutShellProps {
  menu: ReactNode;
  main: ReactNode;
}

export function LayoutShell({ menu, main }: LayoutShellProps) {
  return (
    <div className="notebook min-h-screen">
      <div className="grid-walkers" aria-hidden="true" />

      <div className="relative min-h-screen w-full">
        <div className="fixed inset-0 pointer-events-none z-10" aria-hidden="true" />

        <header
          className="fixed left-0 right-0 top-0 z-[80] pointer-events-auto"
          style={{ height: 'var(--topbar-h, 64px)' }}
        >
          {menu}
        </header>

        <main className="relative z-[20] pb-24 pt-[var(--topbar-h,64px)]">
          {main}
        </main>
      </div>
    </div>
  );
}
