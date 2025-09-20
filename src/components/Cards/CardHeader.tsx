import { Check, RotateCw, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/format';

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  onSave: () => void;
  onRegenerate: () => void;
  isSaved?: boolean;
  isRegenerating?: boolean;
}

export function CardHeader({
  title,
  subtitle,
  onSave,
  onRegenerate,
  isSaved,
  isRegenerating,
}: CardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
      </div>

      <div className="flex gap-2">
        <motion.button
          onClick={onSave}
          disabled={isSaved}
          whileHover={{ scale: isSaved ? 1 : 1.02 }}
          whileTap={{ scale: isSaved ? 1 : 0.98 }}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition-all',
            'hover:border-white/20 hover:text-white',
            isSaved && 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
          )}
          type="button"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSaved ? (
              <motion.span
                key="check"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center"
              >
                <Check className="h-3.5 w-3.5" />
              </motion.span>
            ) : (
              <motion.span key="save" className="flex items-center">
                <Save className="h-3.5 w-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </motion.button>

        <motion.button
          onClick={onRegenerate}
          disabled={isRegenerating}
          whileHover={{ scale: isRegenerating ? 1 : 1.02 }}
          whileTap={{ scale: isRegenerating ? 1 : 0.98 }}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition-all',
            'hover:border-white/20 hover:text-white',
            isRegenerating && 'cursor-not-allowed opacity-60'
          )}
          type="button"
        >
          <motion.div
            animate={isRegenerating ? { rotate: 360 } : { rotate: 0 }}
            transition={isRegenerating ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </motion.div>
          <span>Regenerate</span>
        </motion.button>
      </div>
    </div>
  );
}
