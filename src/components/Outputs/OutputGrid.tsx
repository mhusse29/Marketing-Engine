
import type { PropsWithChildren } from 'react';
import { useLayoutEffect, useRef } from 'react';

/** Grid that fills remaining viewport height under the AI box, with equal-height cards */
export default function OutputGrid({ children }: PropsWithChildren) {
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

  return (
    <div
      ref={ref}
      className="output-grid grid min-h-[var(--cards-h,420px)] grid-cols-1 items-stretch gap-6 pt-6 md:grid-cols-2 lg:pt-8 xl:grid-cols-3 lg:gap-8"
    >
      {children}
    </div>
  );
}
