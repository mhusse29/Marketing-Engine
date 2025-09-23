import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format';
import type { SettingsState } from '../../types';
import { isSettingsValid } from '../../store/settings';
import { MediaPlanner } from './MediaPlanner';
import { Platforms } from './Platforms';
import { CardsSelector } from './CardsSelector';
import { OutputVersions } from './OutputVersions';

interface SettingsPanelProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

const SECTION_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const basicsReady = useMemo(() => isSettingsValid(settings), [settings]);
  const validityLabel = basicsReady ? 'Ready' : 'Complete basics';

  return (
    <div className="relative z-[1] rounded-3xl border border-white/10 bg-white/[0.05] p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur lg:p-6 lg:pb-7">
      <div className="mb-3 flex items-center justify-between text-white/90">
        <h2 className="text-sm font-semibold text-white">Campaign Settings</h2>
        <span
          className={cn(
            'rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/70',
            basicsReady && 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
          )}
        >
          {validityLabel}
        </span>
      </div>

      <div className="space-y-4">
        <motion.div variants={SECTION_VARIANTS} initial="initial" animate="animate" transition={{ duration: 0.16, delay: 0 }}>
          <MediaPlanner settings={settings} onSettingsChange={onSettingsChange} />
        </motion.div>
        <motion.div variants={SECTION_VARIANTS} initial="initial" animate="animate" transition={{ duration: 0.16, delay: 0.04 }}>
          <Platforms settings={settings} onSettingsChange={onSettingsChange} />
        </motion.div>
        <motion.div variants={SECTION_VARIANTS} initial="initial" animate="animate" transition={{ duration: 0.16, delay: 0.08 }}>
          <CardsSelector settings={settings} onSettingsChange={onSettingsChange} />
        </motion.div>
        <motion.div variants={SECTION_VARIANTS} initial="initial" animate="animate" transition={{ duration: 0.16, delay: 0.12 }}>
          <OutputVersions settings={settings} onSettingsChange={onSettingsChange} />
        </motion.div>
      </div>
      <hr className="mt-6 border-white/10" />
    </div>
  );
}
