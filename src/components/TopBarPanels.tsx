import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { cn } from '../lib/format';
import { PANEL_TITLES, type TopBarPanelTab } from './TopBarPanels.helpers';

type PanelsProps = {
  open: TopBarPanelTab | null;
  close: () => void;
  renderContent: ReactNode;
  renderPictures: ReactNode;
  renderVideo: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function TopBarPanels({ open, close, renderContent, renderPictures, renderVideo, onMouseEnter, onMouseLeave }: PanelsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setMountNode(document.body);
    }
  }, []);

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
    if (typeof document === 'undefined') {
      return () => undefined;
    }

    const root = document.documentElement;
    const body = document.body;

    if (open) {
      root.dataset.modal = '1';
      body.dataset.modal = '1';
    } else {
      delete root.dataset.modal;
      delete body.dataset.modal;
    }

    return () => {
      delete root.dataset.modal;
      delete body.dataset.modal;
    };
  }, [open]);

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

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const container = scrollRef.current;
    if (!container) {
      return undefined;
    }

    const updateMask = () => {
      container.classList.toggle('is-top', container.scrollTop <= 0);
      container.classList.toggle(
        'is-bottom',
        container.scrollHeight - container.clientHeight - container.scrollTop <= 1
      );
    };

    container.scrollTop = 0;
    updateMask();
    container.addEventListener('scroll', updateMask, { passive: true });
    return () => container.removeEventListener('scroll', updateMask);
  }, [open]);

  if (!mountNode) {
    return null;
  }

  const panelTitle = open ? PANEL_TITLES[open] : '';
  const showHeader = Boolean(panelTitle);

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
          'cta-popover transition-all duration-300 ease-out',
          open ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-5'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={panelTitle || 'panel'}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {showHeader ? (
          <header className="cta-head">
            <div className="text-sm">{panelTitle}</div>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]"
              aria-label="Close quick settings"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
        ) : null}

        <div ref={scrollRef} className="cta-scroll">
          {content}
        </div>

        <footer className="cta-foot" />
      </div>
    </>,
    mountNode
  );
}

export type { TopBarPanelTab };
