import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format';
import type { AiUIState, CardKey } from '../../types';

interface StepperProps {
  steps: CardKey[];
  stepStatus: AiUIState['stepStatus'];
  hiddenSteps?: Partial<Record<CardKey, boolean>>;
}

const STEP_LABELS: Record<CardKey, string> = {
  content: 'Content',
  pictures: 'Pictures',
  video: 'Video',
};

export function Stepper({ steps, stepStatus, hiddenSteps }: StepperProps) {
  if (steps.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-4 text-sm">
        {steps.map((step, index) => {
          const status = stepStatus?.[step] ?? 'queued';
          const isLast = index === steps.length - 1;
          const isHidden = hiddenSteps?.[step];

          return (
            <Fragment key={step}>
              <div
                className={cn(
                  'flex flex-1 flex-col items-center gap-2 text-center transition-opacity',
                  isHidden && 'opacity-70'
                )}
              >
                <motion.div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all',
                    status === 'thinking' && 'border-[#3E8BFF] bg-[#3E8BFF1a]',
                    status === 'rendering' && 'border-[#6B70FF] bg-[#6B70FF1a]',
                    status === 'ready' && 'border-emerald-400/30 bg-emerald-500/15'
                  )}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {status === 'queued' && (
                    <span className="text-xs font-semibold text-white/60">{index + 1}</span>
                  )}
                  {status === 'thinking' && (
                    <motion.span
                      className="h-2 w-2 rounded-full bg-[#3E8BFF]"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  {status === 'rendering' && (
                    <motion.div className="h-2 w-6 overflow-hidden rounded-full bg-white/20">
                      <motion.div
                        className="h-full w-full bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF]"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                  )}
                  {status === 'ready' && <Check className="h-4 w-4 text-emerald-300" />}
                </motion.div>
                <div className="space-y-1">
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    {STEP_LABELS[step]}
                  </span>
                  <span className="block text-[11px] text-white/40 capitalize">{status}</span>
                </div>
              </div>
              {!isLast && <div className="mx-1 hidden h-px flex-1 bg-white/10 sm:block" />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
