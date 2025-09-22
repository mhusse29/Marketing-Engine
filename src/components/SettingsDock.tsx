import * as React from 'react';

const MIN_WIDTH = 360;
const MARGIN = 16;
const STORAGE_KEY = 'marketingEngine.settingsDock.v6';

const INTERACTIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL']);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getViewport() {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 900 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function defaultWidth() {
  const { width } = getViewport();
  return clamp(420, MIN_WIDTH, width - MARGIN * 2);
}

function defaultPosition(width: number) {
  const { width: vw, height: vh } = getViewport();
  return {
    x: clamp(vw - width - MARGIN, MARGIN, Math.max(MARGIN, vw - width - MARGIN)),
    y: clamp(96, MARGIN, Math.max(MARGIN, vh - 400 - MARGIN)),
  };
}

function usePersistedNumber(key: string, initial: number) {
  const [value, setValue] = React.useState<number>(() => {
    try {
      if (typeof window === 'undefined') return initial;
      const stored = window.localStorage.getItem(key);
      if (stored !== null) return Number.parseFloat(stored);
    } catch (error) {
      console.warn('SettingsDock: failed to read preference', error);
    }
    return initial;
  });

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, String(value));
      }
    } catch (error) {
      console.warn('SettingsDock: failed to persist preference', error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function SettingsDock({ children }: { children: React.ReactNode }) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  const initialWidth = React.useMemo(() => defaultWidth(), []);
  const initialPos = React.useMemo(() => defaultPosition(initialWidth), [initialWidth]);

  const [width, setWidth] = usePersistedNumber(`${STORAGE_KEY}.width`, initialWidth);
  const [posX, setPosX] = usePersistedNumber(`${STORAGE_KEY}.posX`, initialPos.x);
  const [posY, setPosY] = usePersistedNumber(`${STORAGE_KEY}.posY`, initialPos.y);
  const [viewport, setViewport] = React.useState(getViewport());

  React.useEffect(() => {
    const handleResize = () => setViewport(getViewport());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const { width: vw, height: vh } = viewport;
    setWidth((prev) => clamp(prev, MIN_WIDTH, vw - MARGIN * 2));

    const panel = panelRef.current;
    const panelWidth = panel?.offsetWidth ?? width;
    const panelHeight = panel?.offsetHeight ?? 0;

    setPosX((prev) => clamp(prev, MARGIN, Math.max(MARGIN, vw - panelWidth - MARGIN)));

    if (panelHeight > 0) {
      setPosY((prev) => clamp(prev, MARGIN, Math.max(MARGIN, vh - panelHeight - MARGIN)));
    }
  }, [viewport, width, setPosX, setPosY, setWidth]);

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const { width: vw, height: vh } = getViewport();
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;

    setPosX((prev) => clamp(prev, MARGIN, Math.max(MARGIN, vw - panelWidth - MARGIN)));
    setPosY((prev) => clamp(prev, MARGIN, Math.max(MARGIN, vh - panelHeight - MARGIN)));
  }, [children, width, setPosX, setPosY]);

  const startDrag = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target && INTERACTIVE_TAGS.has(target.tagName)) {
        return;
      }

      const panel = panelRef.current;
      if (!panel) return;

      const startX = event.clientX;
      const startY = event.clientY;
      const startPosX = posX;
      const startPosY = posY;
      const { width: vw, height: vh } = getViewport();
      const panelWidth = panel.offsetWidth;
      const panelHeight = panel.offsetHeight;
      const maxX = Math.max(MARGIN, vw - panelWidth - MARGIN);
      const maxY = Math.max(MARGIN, vh - panelHeight - MARGIN);

      let dragging = false;

      const onMove = (ev: PointerEvent) => {
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;

        if (!dragging) {
          if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) {
            return;
          }
          dragging = true;
        }

        setPosX(clamp(startPosX + deltaX, MARGIN, maxX));
        setPosY(clamp(startPosY + deltaY, MARGIN, maxY));
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    },
    [posX, posY, setPosX, setPosY],
  );

  const panelWidth = clamp(width, MIN_WIDTH, viewport.width - MARGIN * 2);
  const panelLeft = clamp(posX, MARGIN, viewport.width - panelWidth - MARGIN);
  const panelTop = Math.max(MARGIN, posY);
  const maxPanelHeight = Math.max(320, viewport.height - MARGIN * 2);

  const resetPanel = React.useCallback(() => {
    const freshWidth = defaultWidth();
    const freshPos = defaultPosition(freshWidth);
    setWidth(freshWidth);
    setPosX(freshPos.x);
    setPosY(freshPos.y);
  }, [setPosX, setPosY, setWidth]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div
        ref={panelRef}
        className="pointer-events-auto absolute flex flex-col rounded-3xl border border-white/10 bg-[#0D1420] shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        style={{
          width: panelWidth,
          left: panelLeft,
          top: panelTop,
          maxHeight: maxPanelHeight,
        }}
        onPointerDown={startDrag}
        onDoubleClick={resetPanel}
      >
        <div className="flex-1 overflow-auto rounded-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}
