import { motion } from 'framer-motion';
import { useMemo, type KeyboardEvent, type MouseEvent } from 'react';
import { cn } from '../../lib/format';
import { MiniContentPreview } from './MiniContentPreview';
import { MiniPicturePreview } from './MiniPicturePreview';
import { MiniVideoPreview } from './MiniVideoPreview';
import {
  defaultStageManager3DSettings,
  type StageManager3DSettings,
  type StageManagerEntry,
} from './types';

interface CardThumbnailProps {
  entry: StageManagerEntry;
  onRestore: () => void;
  index: number;
  threeDSettings?: StageManager3DSettings;
}

export function CardThumbnail({ entry, onRestore, index, threeDSettings }: CardThumbnailProps) {
  // Use custom 3D settings or fall back to defaults
  const settings = useMemo(
    () =>
      threeDSettings
        ? { ...threeDSettings }
        : { ...defaultStageManager3DSettings },
    [threeDSettings]
  );

  // Base transform for FIRST card (index 0), then add incremental offsets
  const translateZ = settings.translateZ; // Fixed depth for consistency
  const translateX = settings.translateX; // Fixed horizontal alignment
  const translateY = settings.translateY + (index * -6); // Subtle upward cascade (newer on top)
  const rotateY = settings.rotateY;      // Unified rotation for stack cohesion
  const rotateX = settings.rotateX;      // Shared tilt
  const scale = settings.scale - (index * 0.04); // Gentle scaling toward stack depth
  const hoverScale = scale * 1.12;
  const hoverRotateY = rotateY - 10;
  const hoverRotateX = rotateX - 2;
  const hoverTranslateZ = translateZ + 60;
  const backdropBlur = settings.glassBlur > 0 ? `blur(${settings.glassBlur}px)` : undefined;
  const backgroundTint =
    settings.glassOpacity > 0 ? `rgba(255, 255, 255, ${settings.glassOpacity / 100})` : undefined;

  // Using Framer Motion for all 3D transforms - no CSS transform string needed

  // Debug logging
  const renderMiniContent = () => {
    switch (entry.cardType) {
      case 'content':
        return <MiniContentPreview content={entry.data?.content} />;
      case 'pictures':
        return <MiniPicturePreview image={entry.data?.pictures} />;
      case 'video':
        return <MiniVideoPreview video={entry.data?.video} />;
      default:
        return (
          <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            {entry.cardType}
          </div>
        );
    }
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log('Thumbnail clicked!');
    onRestore();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRestore();
    }
  };

  return (
    <motion.button
      layout
      layoutId={entry.id}
      type="button"
      initial={{
        opacity: 0,
        x: translateX + 160,
        y: translateY - 24,
        z: translateZ - 80,
        scale: scale * 1.08,
        rotateY: rotateY + 4,
      }}
      animate={{ 
        opacity: 1,
        x: translateX,
        y: translateY,
        z: translateZ,
        rotateY,
        rotateX,
        scale
      }}
      whileHover={{ 
        scale: hoverScale,
        rotateY: hoverRotateY,
        rotateX: hoverRotateX,
        z: hoverTranslateZ,
        transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
      }}
      whileTap={{ 
        scale: scale * 0.95,
        transition: { duration: 0.1 }
      }}
      exit={{
        opacity: 0,
        x: translateX + 180,
        y: translateY - 32,
        z: translateZ - 120,
        scale: scale * 0.82,
        rotateY: rotateY + 6,
      }}
      transition={{ 
        duration: 0.58,
        ease: [0.18, 0.69, 0.23, 0.99],
        delay: index * 0.035,
        layout: { duration: 0.58, ease: [0.18, 0.69, 0.23, 0.99] }
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative w-full overflow-hidden rounded-[24px]',
        'border border-white/8 hover:border-white/18',
        'shadow-[0_20px_55px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'hover:shadow-[0_32px_80px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.16)]',
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050812]',
        'bg-[#0b111d]/92 backdrop-blur-xl',
        'will-change-transform, opacity',
        'transition-all duration-250 ease-[cubic-bezier(0.22,0.61,0.36,1)]'
      )}
      style={{ 
        aspectRatio: '16/9',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        backdropFilter: backdropBlur,
        WebkitBackdropFilter: backdropBlur,
        backgroundColor: backgroundTint || 'rgba(8, 14, 28, 0.9)',
        zIndex: 200 - index,
        boxShadow: `
          -12px 18px 35px rgba(5, 8, 18, 0.65),
          0 12px 40px rgba(0, 0, 0, 0.55),
          inset 0 1px 0 rgba(255,255,255,0.04)
        `
      }}
      aria-label={`Restore ${entry.cardType} card`}
    >
      {/* Dynamic 3D side panel effect */}
      <div 
        className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent pointer-events-none"
        style={{
          width: `${Math.max(settings.sidePanelWidth - 2, 6)}px`,
          transform: `translateX(${settings.sidePanelWidth}px) rotateY(-88deg)`,
          transformOrigin: 'left',
          boxShadow: `inset 1px 0 0 rgba(255,255,255,0.06), 4px 0 12px rgba(0,0,0,0.35)`,
          opacity: Math.min(settings.sidePanelOpacity / 120, 0.6)
        }}
      />
      
      {/* Edge lighting effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none"
        style={{
          maskImage: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 60%)'
        }}
      />
      
      {/* Actual card content preview */}
      <div className="relative h-full w-full">
        {renderMiniContent()}
      </div>
    </motion.button>
  );
}
