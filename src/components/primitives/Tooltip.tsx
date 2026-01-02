import { useState, useRef, useEffect, useId, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  label: string;
  children: ReactNode;
  delay?: number;
  hideDelay?: number;
  side?: 'top' | 'bottom';
};

export default function Tooltip({ label, children, delay = 400, hideDelay = 100, side = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const showTimeoutRef = useRef<number | undefined>(undefined);
  const hideTimeoutRef = useRef<number | undefined>(undefined);
  const isHoveringRef = useRef(false);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const y = side === 'bottom' ? rect.bottom : rect.top;
    setCoords({ x: rect.left + rect.width / 2, y });
  }, [side]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return undefined;
    }

    const show = () => {
      if (!isHoveringRef.current) return;
      updatePosition();
      setOpen(true);
    };

    const hide = () => {
      window.clearTimeout(showTimeoutRef.current);
      window.clearTimeout(hideTimeoutRef.current);
      setOpen(false);
    };

    const onEnter = () => {
      isHoveringRef.current = true;
      // Cancel any pending hide
      window.clearTimeout(hideTimeoutRef.current);
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = window.setTimeout(show, delay);
    };

    const onLeave = () => {
      isHoveringRef.current = false;
      // Cancel any pending show
      window.clearTimeout(showTimeoutRef.current);
      // Add a small delay before hiding to prevent flicker
      hideTimeoutRef.current = window.setTimeout(() => {
        if (!isHoveringRef.current) {
          setOpen(false);
        }
      }, hideDelay);
    };

    anchor.addEventListener('mouseenter', onEnter);
    anchor.addEventListener('mouseleave', onLeave);
    anchor.addEventListener('focusin', onEnter);
    anchor.addEventListener('focusout', hide);

    return () => {
      anchor.removeEventListener('mouseenter', onEnter);
      anchor.removeEventListener('mouseleave', onLeave);
      anchor.removeEventListener('focusin', onEnter);
      anchor.removeEventListener('focusout', hide);
      // Clear any pending timeouts on cleanup
      window.clearTimeout(showTimeoutRef.current);
      window.clearTimeout(hideTimeoutRef.current);
    };
  }, [delay, hideDelay, updatePosition]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const reposition = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    };

    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  return (
    <span ref={anchorRef} className="tip-anchor" aria-describedby={open ? tooltipId : undefined}>
      {children}
      {open &&
        createPortal(
          <div 
            role="tooltip" 
            id={tooltipId} 
            className={side === 'bottom' ? 'ui-tip ui-tip-bottom' : 'ui-tip'} 
            style={{ left: coords.x, top: coords.y }}
          >
            {label}
            <i className="ui-tip-arrow" />
          </div>,
          document.body
        )}
    </span>
  );
}
