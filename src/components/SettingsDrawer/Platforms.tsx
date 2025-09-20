import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/format';
import type { SettingsState, Platform } from '../../types';
import type { IconType } from 'react-icons';
import {
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiLinkedin,
  SiGoogle,
  SiGoogleads,
  SiYoutube,
} from 'react-icons/si';

interface PlatformsProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

const tooltipDark =
  'rounded-lg border border-white/10 bg-[#0B1220]/90 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,.6)] px-2.5 py-1.5 text-xs text-white/95 z-50';

const PLATFORM_CONFIG: Record<Platform, { label: string; Icon: IconType; tip: string }> = {
  facebook: { label: 'Facebook', Icon: SiFacebook, tip: 'Paid social reach + retargeting.' },
  instagram: { label: 'Instagram', Icon: SiInstagram, tip: 'Stories, reels, and feed placements.' },
  tiktok: { label: 'TikTok', Icon: SiTiktok, tip: 'Short-form video discovery.' },
  linkedin: { label: 'LinkedIn', Icon: SiLinkedin, tip: 'B2B and professional audiences.' },
  'google.search': { label: 'Google Search', Icon: SiGoogle, tip: 'Intent-based keyword queries.' },
  'google.display': { label: 'Google Display', Icon: SiGoogleads, tip: 'Programmatic display inventory.' },
  'google.youtube': { label: 'YouTube', Icon: SiYoutube, tip: 'Video campaigns across YouTube.' },
};

const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG) as Platform[];

export function Platforms({ settings, onSettingsChange }: PlatformsProps) {
  const togglePlatform = (platform: Platform) => {
    const newPlatforms = settings.platforms.includes(platform)
      ? settings.platforms.filter((p) => p !== platform)
      : [...settings.platforms, platform];
    onSettingsChange({
      ...settings,
      platforms: newPlatforms,
    });
  };

  const selectAll = () => {
    onSettingsChange({
      ...settings,
      platforms: [...ALL_PLATFORMS],
    });
  };

  const clearAll = () => {
    onSettingsChange({
      ...settings,
      platforms: [],
    });
  };

  const count = settings.platforms.length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">Platforms</p>
          <Tooltip.Root delayDuration={100}>
            <Tooltip.Trigger asChild>
              <span className="cursor-help text-white/50 transition-colors hover:text-white/80">ⓘ</span>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
              Choose the channels for AI outputs.
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <motion.span
          key={count}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="text-xs font-semibold text-white/70"
        >
          {count}/7
        </motion.span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ALL_PLATFORMS.map((platform) => {
          const { label, Icon, tip } = PLATFORM_CONFIG[platform];
          const isSelected = settings.platforms.includes(platform);
          return (
            <Tooltip.Root key={platform} delayDuration={80}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex h-12 w-full items-center justify-center rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                    isSelected
                      ? 'border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_8px_24px_rgba(62,139,255,0.35)]'
                      : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="sr-only">{label}</span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                {tip}
              </Tooltip.Content>
            </Tooltip.Root>
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
