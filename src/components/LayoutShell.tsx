import type { ReactNode } from 'react';

import { SettingsDock } from './SettingsDock';

interface LayoutShellProps {
  menu: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
}

export function LayoutShell({ menu, main, sidebar }: LayoutShellProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#0B1220]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(16,22,30,0.55),rgba(10,14,20,0.55))]" />

      {menu}

      <div className="relative z-10 pb-16">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-12">
          <div className="pt-28 lg:pt-32" />

          <div className="grid gap-y-14 gap-x-28 lg:grid-cols-12">
            <section className="space-y-10 lg:col-span-7">
              {main}
            </section>
            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-40">
                <SettingsDock>{sidebar}</SettingsDock>
              </div>
            </aside>
          </div>
        </div>
      </div>

    </div>
  );
}
