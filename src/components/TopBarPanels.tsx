import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { cn } from '../lib/format';

type Tab = 'content' | 'pictures' | 'video';

type PanelsProps = {
  open: Tab | null;
  close: () => void;
  renderContent: ReactNode;
  renderPictures: ReactNode;
  renderVideo: ReactNode;
};

type PanelsHook = {
  open: Tab | null;
  toggle: (tab: Tab) => void;
  close: () => void;
};

export function useTopBarPanels(): PanelsHook {
  const [open, setOpen] = useState<Tab | null>(null);

  const toggle = useCallback((tab: Tab) => {
    setOpen((prev) => (prev === tab ? null : tab));
  }, []);

  const close = useCallback(() => {
    setOpen(null);
  }, []);

  return { open, toggle, close };
}

export function TopBarPanels({ open, close, renderContent, renderPictures, renderVideo }: PanelsProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  const content = useMemo(() => {
    switch (open) {
      case 'content':
        return renderContent;
      case 'pictures':
        return renderPictures;
      case 'video':
        return renderVideo;
      default:
        return null;
    }
  }, [open, renderContent, renderPictures, renderVideo]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, close]);

  return createPortal(
    <>
      <div
        aria-hidden
        onClick={open ? close : undefined}
        className={cn(
          'fixed left-0 right-0 bottom-0 z-[69] bg-black/30 backdrop-blur-[1px] transition-opacity duration-200 ease-out',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        style={{ top: 'var(--topbar-h, 64px)' }}
      />
      <div
        className={cn(
          'cta-panel fixed left-1/2 z-[70] w-[min(980px,92vw)] -translate-x-1/2 transition-all duration-200 ease-out',
          open ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
        )}
        style={{ top: 'calc(var(--topbar-h, 64px) + 12px)' }}
        role="dialog"
        aria-modal="true"
        aria-label={open ? `${open} quick settings` : undefined}
      >
        <div className="cta-header">
          <div className="text-sm text-white/60">
            {open === 'content' && 'Content options'}
            {open === 'pictures' && 'Pictures prompt options'}
            {open === 'video' && 'Video prompt options'}
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
            aria-label="Close quick settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {content}
      </div>
    </>,
    document.body
  );
}

export type { Tab as TopBarPanelTab };
