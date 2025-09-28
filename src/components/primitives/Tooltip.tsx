import { useState, useRef, useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  label: string;
  children: ReactNode;
  delay?: number;
};

export default function Tooltip({ label, children, delay = 120 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const tooltipId = useId();

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return undefined;
    }

    const show = () => {
      const rect = anchor.getBoundingClientRect();
      setCoords({ x: rect.left + rect.width / 2, y: rect.top });
      setOpen(true);
    };

    const hide = () => {
      window.clearTimeout(timeoutRef.current);
      setOpen(false);
    };

    const onEnter = () => {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(show, delay);
    };

    const onLeave = () => {
      window.clearTimeout(timeoutRef.current);
      setOpen(false);
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
    };
  }, [delay]);

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
          <div role="tooltip" id={tooltipId} className="ui-tip" style={{ left: coords.x, top: coords.y }}>
            {label}
            <i className="ui-tip-arrow" />
          </div>,
          document.body
        )}
    </span>
  );
}
