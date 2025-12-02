import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format';
import type { SettingsState } from '../../types';
import { isSettingsValid } from '../../store/settings';
import { MediaPlanner } from './MediaPlanner';
import { Platforms } from './Platforms';
import { CardsSelector } from './CardsSelector';
import { OutputVersions } from './OutputVersions';
import SavedGenerationsPanel from './SavedGenerationsPanel';

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
    <div 
      className="relative z-[1] rounded-3xl border p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] lg:p-6 lg:pb-7"
      style={{
        backgroundColor: `rgba(255, 255, 255, var(--settings-bg-opacity, 0.05))`,
        backdropFilter: `blur(var(--settings-blur, 8px))`,
        WebkitBackdropFilter: `blur(var(--settings-blur, 8px))`,
        borderColor: `rgba(255, 255, 255, var(--settings-border-opacity, 0.10))`,
      }}
    >
      <div className="mb-3 flex items-center justify-end text-white/90">
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
      
      {/* Saved Generations History Section */}
      <motion.div 
        variants={SECTION_VARIANTS} 
        initial="initial" 
        animate="animate" 
        transition={{ duration: 0.16, delay: 0.20 }}
        className="mt-6"
      >
        <div 
          className="rounded-2xl border p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          style={{
            backgroundColor: `rgba(255, 255, 255, var(--settings-bg-opacity, 0.05))`,
            backdropFilter: `blur(var(--settings-blur, 8px))`,
            WebkitBackdropFilter: `blur(var(--settings-blur, 8px))`,
            borderColor: `rgba(255, 255, 255, var(--settings-border-opacity, 0.10))`,
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              📚 Generation History
            </h3>
            <span className="text-xs text-white/50">All your saved content</span>
          </div>
          <SavedGenerationsPanel />
        </div>
      </motion.div>
    </div>
  );
}
