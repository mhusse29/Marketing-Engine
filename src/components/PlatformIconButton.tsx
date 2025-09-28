import * as React from 'react';
import { motion } from 'framer-motion';

import PlatformIcon from '@/ui/PlatformIcon';

export type PlatformIconButtonProps = {
  name: string;
  selected?: boolean;
  disabled?: boolean;
  onToggle?: (next: boolean) => void;
  size?: number;
  className?: string;
};

export default function PlatformIconButton({
  name,
  selected = false,
  disabled = false,
  onToggle,
  size = 48,
  className,
}: PlatformIconButtonProps) {
  const CTA_GRADIENT = 'linear-gradient(180deg,#3E8BFF 0%,#6B70FF 100%)';
  const ACTIVE_BG = CTA_GRADIENT;
  const ACTIVE_RING = 'rgba(62,139,255,0.75)';
  const IDLE_BG = 'rgba(14,20,32,0.85)';
  const IDLE_RING = 'rgba(62,139,255,0.28)';
  const DISABLED_BG = 'rgba(26,32,42,0.55)';
  const DISABLED_RING = 'rgba(255,255,255,0.08)';

  const isDisabledState = disabled;
  const background = isDisabledState ? DISABLED_BG : selected ? ACTIVE_BG : IDLE_BG;
  const borderColor = isDisabledState ? DISABLED_RING : selected ? ACTIVE_RING : IDLE_RING;

  function handleClick() {
    if (disabled) return;
    onToggle?.(!selected);
  }

  const dimension = typeof size === 'number' ? `${size}px` : size;
  const iconSize = Math.round((typeof size === 'number' ? size : parseInt(size, 10) || 48) * 0.55);

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      aria-label={name}
      disabled={disabled}
      onClick={handleClick}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      className={`relative inline-grid place-items-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${className ?? ''}`}
      style={{
        width: dimension,
        height: dimension,
        background,
        borderColor,
        borderWidth: selected ? 2 : 1.5,
        boxShadow: selected
          ? '0 0 0 4px rgba(62,139,255,0.18), 0 10px 24px rgba(0,0,0,0.35)'
          : '0 6px 18px rgba(0,0,0,0.28)',
      }}
    >
      <PlatformIcon
        name={name}
        size={iconSize}
        className={
          selected
            ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.65)]'
            : isDisabledState
            ? 'text-white/35'
            : 'text-white/80'
        }
      />
    </motion.button>
  );
}
