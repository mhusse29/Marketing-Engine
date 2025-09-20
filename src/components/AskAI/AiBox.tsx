import { useEffect, useState } from 'react';
import { Lock, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format';
import type { AiUIState, SettingsState } from '../../types';
import { UploadZone } from './UploadZone';
import { Chip } from '../Chip';

interface AiBoxProps {
  aiState: AiUIState;
  settings: SettingsState;
  onGenerate: (brief: string, uploads: string[]) => void;
  onClear: () => void;
  highlight?: boolean;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  'google.search': 'Search',
  'google.display': 'Display',
  'google.youtube': 'YouTube',
};

export function AiBox({ aiState, settings, onGenerate, onClear, highlight = false }: AiBoxProps) {
  const [brief, setBrief] = useState(aiState.brief);
  const [uploads, setUploads] = useState<string[]>(aiState.uploads);
  const [error, setError] = useState('');

  useEffect(() => {
    setBrief(aiState.brief);
    setUploads(aiState.uploads);
  }, [aiState.brief, aiState.uploads]);

  const isLocked = aiState.locked;
  const canSubmit = !isLocked && !aiState.generating && brief.trim().length >= 10;

  const handleGenerate = () => {
    if (!brief || brief.trim().length < 10) {
      setError('Brief must be at least 10 characters');
      return;
    }
    setError('');
    onGenerate(brief, uploads);
  };

  const handleClear = () => {
    if (isLocked) return;
    setBrief('');
    setUploads([]);
    setError('');
    onClear();
  };

  const handleUpload = (files: File[]) => {
    if (isLocked || aiState.generating) return;
    const newUploads = files.map((file) => URL.createObjectURL(file));
    setUploads((prev) => [...prev, ...newUploads].slice(0, 5));
  };

  const removeUpload = (index: number) => {
    if (isLocked || aiState.generating) return;
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative" id="ai-box">
      {!isLocked && (
        <div
          className={cn(
            'pointer-events-none absolute -inset-px -z-10 rounded-[28px] bg-[linear-gradient(130deg,rgba(62,139,255,0.35),rgba(107,112,255,0.35))] opacity-90 blur-md transition duration-[2500ms]',
            highlight && 'animate-pulse'
          )}
        />
      )}
      <div
        className={cn(
          'relative rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-opacity duration-300 lg:p-6',
          isLocked ? 'opacity-75' : 'opacity-100'
        )}
      >
        {isLocked && (
          <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
            <Lock className="h-3.5 w-3.5" />
            Complete Settings to continue
          </div>
        )}

        <div className={cn('space-y-6', isLocked && 'pointer-events-none select-none')}>
          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/60">
              Ask AI
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Give me a quick brief for this campaign.</h3>
              <p className="text-sm text-white/60">We’ll fan out to every selected format once you hit generate.</p>
            </div>
          </header>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/50">Campaign brief</label>
            <textarea
              id="ai-brief-textarea"
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value);
                if (error) setError('');
              }}
              placeholder="Describe your audience, offer, and desired outcome..."
              spellCheck={false}
              rows={3}
              disabled={isLocked || aiState.generating}
              className={cn(
                'w-full resize-y rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-[rgba(231,236,243,0.90)] placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/35 transition-all',
                'min-h-[96px] max-h-[260px]'
              )}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wide text-white/50">Upload references (optional)</label>
            <UploadZone onUpload={handleUpload} disabled={isLocked || aiState.generating} />

            {uploads.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {uploads.map((url, index) => (
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative"
                  >
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="h-16 w-16 rounded-xl border border-white/10 object-cover shadow-inner"
                    />
                    {!isLocked && (
                      <button
                        onClick={() => removeUpload(index)}
                        className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {settings.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.platforms.map((platform) => (
                <Chip key={platform} variant="accent" size="sm">
                  {PLATFORM_LABELS[platform]}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={handleClear}
              disabled={isLocked || aiState.generating}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white',
                (isLocked || aiState.generating) && 'cursor-not-allowed opacity-60 hover:text-white/70'
              )}
              type="button"
            >
              Clear
            </button>
            <button
              onClick={handleGenerate}
              disabled={!canSubmit}
              className={cn(
                'flex-1 rounded-xl px-5 py-3 text-sm font-semibold transition-all',
                'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_12px_28px_rgba(62,139,255,0.35)] hover:brightness-110',
                !canSubmit && 'cursor-not-allowed opacity-60 hover:brightness-100'
              )}
              type="button"
            >
              {aiState.generating ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  Generating...
                </span>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
