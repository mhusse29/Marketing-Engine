import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { StageManagerTraySettings } from './types';
import { defaultStageManagerTraySettings } from './types';

const BACKGROUND_PRESETS: Record<StageManagerTraySettings['backgroundPreset'], string> = {
  midnight: 'linear-gradient(135deg, rgba(6, 11, 25, 0.92), rgba(3, 6, 18, 0.78))',
  onyx: 'linear-gradient(135deg, rgba(9, 14, 26, 0.95), rgba(2, 4, 12, 0.82))',
  carbon: 'linear-gradient(135deg, rgba(12, 17, 27, 0.92), rgba(8, 10, 16, 0.78))',
  aurora: 'linear-gradient(135deg, rgba(8, 14, 24, 0.94), rgba(7, 20, 40, 0.82))',
};

interface StageManagerTrayControlProps {
  settings: StageManagerTraySettings;
  onSettingsChange: (settings: StageManagerTraySettings) => void;
}

export function StageManagerTrayControl({ settings, onSettingsChange }: StageManagerTrayControlProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [draft, setDraft] = useState<StageManagerTraySettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const update = (partial: Partial<StageManagerTraySettings>) => {
    setDraft((prev) => {
      const merged = { ...prev, ...partial };
      console.log('StageManagerTrayControl - Settings changed:', merged);
      onSettingsChange(merged);
      return merged;
    });
  };

  const backgroundPreview = useMemo(() => {
    if (draft.backgroundCustom && draft.backgroundCustom.trim().length > 0) {
      return draft.backgroundCustom;
    }
    return BACKGROUND_PRESETS[draft.backgroundPreset] ?? BACKGROUND_PRESETS.midnight;
  }, [draft.backgroundCustom, draft.backgroundPreset]);

  const reset = () => {
    const baseline = { ...defaultStageManagerTraySettings };
    setDraft(baseline);
    onSettingsChange(baseline);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-[360px] z-[100] bg-black/85 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl"
      style={{ width: isMinimized ? '220px' : '340px' }}
    >
      <div className="flex items-center justify-between p-4">
        <h3 className="text-white font-semibold text-sm">Stage Tray Controls</h3>
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white/60 hover:text-white text-lg transition-colors"
          title={isMinimized ? 'Expand controls' : 'Minimize controls'}
        >
          {isMinimized ? '▶' : '▼'}
        </button>
      </div>

      <div className="px-4 pb-3 text-xs text-white/60">
        <div>Opacity: {(draft.opacity * 100).toFixed(0)}% | Blur: {draft.blur}px</div>
        <div>Padding: {draft.paddingX}px × {draft.paddingY}px | Radius: {draft.borderRadius}px</div>
      </div>

      {!isMinimized && (
        <div className="px-4 pb-5 space-y-4">
          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-padding-x">
              Horizontal Padding: {draft.paddingX}px
            </label>
            <input
              id="tray-padding-x"
              type="range"
              min="0"
              max="40"
              step="2"
              value={draft.paddingX}
              onChange={(event) => update({ paddingX: parseInt(event.target.value, 10) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-padding-y">
              Vertical Padding: {draft.paddingY}px
            </label>
            <input
              id="tray-padding-y"
              type="range"
              min="0"
              max="40"
              step="2"
              value={draft.paddingY}
              onChange={(event) => update({ paddingY: parseInt(event.target.value, 10) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-radius">
              Corner Radius: {draft.borderRadius}px
            </label>
            <input
              id="tray-radius"
              type="range"
              min="0"
              max="40"
              step="1"
              value={draft.borderRadius}
              onChange={(event) => update({ borderRadius: parseInt(event.target.value, 10) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-blur">
              Backdrop Blur: {draft.blur}px
            </label>
            <input
              id="tray-blur"
              type="range"
              min="0"
              max="40"
              step="2"
              value={draft.blur}
              onChange={(event) => update({ blur: parseInt(event.target.value, 10) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-opacity">
              Opacity: {(draft.opacity * 100).toFixed(0)}%
            </label>
            <input
              id="tray-opacity"
              type="range"
              min="0.4"
              max="1"
              step="0.02"
              value={draft.opacity}
              onChange={(event) => update({ opacity: parseFloat(event.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-border">
              Border Strength: {(draft.borderOpacity * 100).toFixed(0)}%
            </label>
            <input
              id="tray-border"
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={draft.borderOpacity}
              onChange={(event) => update({ borderOpacity: parseFloat(event.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-shadow">
              Shadow Strength: {(draft.shadowStrength * 100).toFixed(0)}%
            </label>
            <input
              id="tray-shadow"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={draft.shadowStrength}
              onChange={(event) => update({ shadowStrength: parseFloat(event.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-saturation">
              Saturation Boost: {draft.saturation.toFixed(2)}×
            </label>
            <input
              id="tray-saturation"
              type="range"
              min="0.8"
              max="2"
              step="0.05"
              value={draft.saturation}
              onChange={(event) => update({ saturation: parseFloat(event.target.value) })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(BACKGROUND_PRESETS) as Array<StageManagerTraySettings['backgroundPreset']>).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => update({ backgroundPreset: preset })}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  draft.backgroundPreset === preset
                    ? 'bg-white/20 border-white/50 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1" htmlFor="tray-background">
              Custom Background (CSS gradient/color)
            </label>
            <input
              id="tray-background"
              type="text"
              value={draft.backgroundCustom ?? ''}
              placeholder="linear-gradient(...), rgba(...), etc."
              onChange={(event) => update({ backgroundCustom: event.target.value })}
              className="w-full rounded bg-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <p className="mt-1 text-[10px] text-white/50">
              Leave empty to use preset background. Current preview shown above.
            </p>
            <div
              className="mt-2 h-10 w-full rounded border border-white/10"
              style={{ background: backgroundPreview }}
            />
          </div>

          <div className="flex items-center justify-between pt-2 gap-3">
            <button
              type="button"
              onClick={() => update({ backgroundCustom: '' })}
              className="flex-1 px-3 py-2 text-xs bg-white/10 hover:bg-white/15 text-white rounded transition-colors"
            >
              Use Preset
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex-1 px-3 py-2 text-xs bg-gray-500/30 hover:bg-gray-500/50 text-white rounded transition-colors"
            >
              Reset Tray
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
