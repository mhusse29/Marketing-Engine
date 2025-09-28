import { motion } from 'framer-motion';

import PlatformPill from '@/ui/PlatformPill';

import type { Platform, SettingsState } from '../../types';
import { PLATFORMS, PLATFORM_ORDER, PLATFORM_KEYS } from '../platforms/platforms';
import { SectionHeading } from './SectionHeading';

type PlatformsProps = {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
};

export function Platforms({ settings, onSettingsChange }: PlatformsProps) {
  const updatePlatforms = (next: Platform[]) => {
    onSettingsChange({
      ...settings,
      platforms: next,
    });
  };

  const togglePlatform = (platform: Platform) => {
    const newPlatforms = settings.platforms.includes(platform)
      ? settings.platforms.filter((p) => p !== platform)
      : [...settings.platforms, platform];

    updatePlatforms(newPlatforms as Platform[]);
  };

  const selectAll = () => {
    updatePlatforms([...PLATFORM_ORDER]);
  };

  const clearAll = () => {
    updatePlatforms([]);
  };

  const count = settings.platforms.length;

  return (
    <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Platforms"
          description="Pick where the campaign should run."
        />
        <motion.span
          key={count}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-xs font-semibold text-white/70"
        >
          {count}/{PLATFORM_KEYS.length}
        </motion.span>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {PLATFORM_ORDER.map((platform) => {
          const isSelected = settings.platforms.includes(platform);
          const { label } = PLATFORMS[platform];

          return (
            <PlatformPill
              key={platform}
              name={platform}
              selected={isSelected}
              onClick={() => togglePlatform(platform)}
              tooltip={label}
              className="settings-platform-pill"
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="transition-colors hover:text-white" type="button">
            Select all
          </button>
          <span className="text-white/30">•</span>
          <button onClick={clearAll} className="transition-colors hover:text-white" type="button">
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}
