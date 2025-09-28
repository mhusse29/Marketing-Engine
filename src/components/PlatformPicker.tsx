import * as React from 'react';

import PlatformIconButton from '@/components/PlatformIconButton';

const PLATFORMS = [
  'Facebook',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Google',
  'Google Ads',
  'YouTube',
] as const;

type PlatformName = typeof PLATFORMS[number];

type PlatformPickerProps = {
  value: PlatformName[];
  onChange: (next: PlatformName[]) => void;
};

export default function PlatformPicker({ value, onChange }: PlatformPickerProps) {
  const toggle = (platform: PlatformName) => {
    const has = value.includes(platform);
    onChange(has ? value.filter((item) => item !== platform) : [...value, platform]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold uppercase tracking-wider text-white/80">Platforms</div>
        <div className="text-xs text-white/50">
          {value.length}/{PLATFORMS.length}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {PLATFORMS.map((platform) => (
          <PlatformIconButton
            key={platform}
            name={platform}
            selected={value.includes(platform)}
            onToggle={() => toggle(platform)}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-white/70">
        <button type="button" onClick={() => onChange([...PLATFORMS])} className="hover:text-white">
          Select all
        </button>
        <span>•</span>
        <button type="button" onClick={() => onChange([])} className="hover:text-white">
          Clear
        </button>
      </div>
    </div>
  );
}
