import type { ReactNode } from 'react';

interface LayoutShellProps {
  main: ReactNode;
  sidebar: ReactNode;
}

export function LayoutShell({ main, sidebar }: LayoutShellProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#0B1220]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(16,22,30,0.55),rgba(10,14,20,0.55))]" />

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-[1200px] px-2 sm:px-0 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-6 lg:col-span-7 lg:space-y-8">
              {main}
            </div>
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-6">
                {sidebar}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
