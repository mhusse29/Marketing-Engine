import { AnimatePresence } from 'framer-motion';
import { CardThumbnail } from './CardThumbnail';
import {
  defaultStageManager3DSettings,
  defaultStageManagerTraySettings,
  type StageManager3DSettings,
  type StageManagerTraySettings,
  type StageManagerEntry,
} from './types';
import './stageManager.css';

interface StageManagerProps {
  entries: StageManagerEntry[];
  onRestoreEntry: (entryId: string, cardType: StageManagerEntry['cardType']) => void;
  threeDSettings?: StageManager3DSettings;
  traySettings?: StageManagerTraySettings;
}

const BACKGROUND_PRESETS: Record<StageManagerTraySettings['backgroundPreset'], string> = {
  midnight: 'linear-gradient(135deg, rgba(6, 11, 25, 0.92), rgba(3, 6, 18, 0.78))',
  onyx: 'linear-gradient(135deg, rgba(9, 14, 26, 0.95), rgba(2, 4, 12, 0.82))',
  carbon: 'linear-gradient(135deg, rgba(12, 17, 27, 0.92), rgba(8, 10, 16, 0.78))',
  aurora: 'linear-gradient(135deg, rgba(8, 14, 24, 0.94), rgba(7, 20, 40, 0.82))',
};

export function StageManager({
  entries,
  onRestoreEntry,
  threeDSettings,
  traySettings,
}: StageManagerProps) {
  const sortedEntries = [...entries].sort((a, b) => b.createdAt - a.createdAt);
  const trayConfig: StageManagerTraySettings = {
    ...defaultStageManagerTraySettings,
    ...(traySettings ?? {}),
  };
  const applied3DSettings = threeDSettings ?? defaultStageManager3DSettings;
  const background =
    trayConfig.backgroundCustom && trayConfig.backgroundCustom.trim().length > 0
      ? trayConfig.backgroundCustom
      : BACKGROUND_PRESETS[trayConfig.backgroundPreset] ?? BACKGROUND_PRESETS.midnight;

  // Don't render if no cards are minimized
  if (sortedEntries.length === 0) {
    return null;
  }

  return (
    <div
      className="stage-manager stage-manager-container pointer-events-auto fixed left-3 top-24 z-[120]"
      style={{
        width: `${applied3DSettings.cardSize}px`,
        perspective: `${applied3DSettings.perspective}px`,
        perspectiveOrigin: 'center center',
        transformStyle: 'preserve-3d',
        padding: `${trayConfig.paddingY}px ${trayConfig.paddingX}px`,
        borderRadius: `${trayConfig.borderRadius}px`,
      }}
    >
      <div
        className="stage-manager__backdrop"
        aria-hidden="true"
        style={{
          borderRadius: `${Math.max(trayConfig.borderRadius - 2, 0)}px`,
          background,
          border: `1px solid rgba(255, 255, 255, ${trayConfig.borderOpacity.toFixed(3)})`,
          boxShadow: `
            0 18px 45px rgba(3,7,18,${0.35 + trayConfig.shadowStrength * 0.6}),
            0 8px 24px rgba(3,7,18,${0.2 + trayConfig.shadowStrength * 0.4}),
            inset 0 1px 0 rgba(255,255,255,${0.04 + trayConfig.borderOpacity / 2})
          `,
          backdropFilter: `blur(${trayConfig.blur}px) saturate(${trayConfig.saturation})`,
          WebkitBackdropFilter: `blur(${trayConfig.blur}px) saturate(${trayConfig.saturation})`,
          opacity: trayConfig.opacity,
        }}
      />
      <div className="stage-manager__stack">
        <AnimatePresence mode="popLayout">
          {sortedEntries.map((entry, index) => (
            <CardThumbnail
              key={entry.id}
              entry={entry}
              onRestore={() => onRestoreEntry(entry.id, entry.cardType)}
              index={index}
              threeDSettings={applied3DSettings}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
