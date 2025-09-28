
import { useEffect, useState } from 'react';
import { Check, Copy, Image as ImageIcon, Upload } from 'lucide-react';

import { cn } from '../../lib/format';
import type { GeneratedPictures } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import { StepDot } from '../Outputs/StepDot';
import NanoGridBloom from '@/ui/NanoGridBloom';
import PerimeterProgressSegmented from '@/ui/PerimeterProgressSegmented';

interface PicturesCardProps {
  pictures: GeneratedPictures[];
  currentVersion: number;
  brandLocked: boolean;
  onSave: () => void;
  onRegenerate: () => Promise<void> | void;
  onReplaceImages?: () => void;
  status: GridStepState;
}

const STATUS_LABELS: Record<GridStepState, string> = {
  queued: 'Queued',
  thinking: 'Thinking…',
  rendering: 'Rendering…',
  ready: 'Ready',
  error: 'Needs attention',
};

const ACTION_BUTTON =
  'h-8 rounded-full border border-white/12 bg-white/8 px-3 text-sm font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60';

export function PicturesCard({
  pictures,
  currentVersion,
  brandLocked,
  onSave,
  onRegenerate,
  onReplaceImages,
  status,
}: PicturesCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [mode, setMode] = useState<'prompt' | 'uploads'>(pictures[currentVersion]?.mode || 'prompt');
  const [copiedPrompts, setCopiedPrompts] = useState<number[]>([]);

  const versionPictures = pictures[currentVersion];
  const totalVersions = pictures.length;
  const statusLabel = STATUS_LABELS[status];
  useEffect(() => {
    if (versionPictures) {
      setMode(versionPictures.mode);
    }
  }, [versionPictures]);

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSave = () => {
    setIsSaved(true);
    onSave();
    window.setTimeout(() => setIsSaved(false), 1200);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerate();
    setIsRegenerating(false);
  };

  const copyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompts((prev) => [...prev, index]);
    window.setTimeout(() => {
      setCopiedPrompts((prev) => prev.filter((i) => i !== index));
    }, 1200);
  };

  const isBusy = status === 'queued' || status === 'thinking' || status === 'rendering';

  return (
    <CardShell sheen={false} className="relative isolate overflow-hidden">
      <div className="relative z-10 flex h-full flex-col">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Pictures / Prompt</h3>
            <StepDot state={status} />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/55">Generated at {timestamp}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={cn(
              ACTION_BUTTON,
              isSaved && 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
            )}
            type="button"
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className={ACTION_BUTTON}
            type="button"
          >
            {isRegenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      </header>

      <div className="space-y-5">
        {!versionPictures ? (
          <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-white/6 bg-white/[0.03] px-6 text-sm text-white/60">
            Image prompts will appear here after generation runs.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setMode('prompt')}
                disabled={versionPictures.mode === 'uploads'}
                className={cn(
                  'inline-flex h-8 items-center rounded-full border px-4 text-sm font-medium transition-all',
                  mode === 'prompt'
                    ? 'border-transparent bg-gradient-to-r from-[rgba(62,139,255,0.85)] to-[rgba(107,112,255,0.85)] text-white shadow-[0_8px_24px_rgba(62,139,255,0.35)]'
                    : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white',
                  versionPictures.mode === 'uploads' && 'cursor-not-allowed opacity-60'
                )}
                type="button"
              >
                Prompt only
              </button>
              <button
                onClick={() => setMode('uploads')}
                disabled={versionPictures.mode === 'prompt'}
                className={cn(
                  'inline-flex h-8 items-center rounded-full border px-4 text-sm font-medium transition-all',
                  mode === 'uploads'
                    ? 'border-transparent bg-gradient-to-r from-[rgba(62,139,255,0.85)] to-[rgba(107,112,255,0.85)] text-white shadow-[0_8px_24px_rgba(62,139,255,0.35)]'
                    : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white',
                  versionPictures.mode === 'prompt' && 'cursor-not-allowed opacity-60'
                )}
                type="button"
              >
                Upload actual pictures
              </button>
            </div>

            <div className="space-y-4">
              {mode === 'prompt' && versionPictures.mode === 'prompt' && (
                <div className="grid auto-rows-min gap-3">
                  {versionPictures.prompts.map((prompt, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                          <ImageIcon className="h-4 w-4" />
                          Prompt {index + 1}
                        </div>
                        <button
                          onClick={() => copyPrompt(prompt, index)}
                          className="inline-flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                          type="button"
                        >
                          {copiedPrompts.includes(index) ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-white/70">{prompt}</p>
                    </div>
                  ))}
                </div>
              )}

              {mode === 'uploads' && versionPictures.mode === 'uploads' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {versionPictures.images.map((image, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-2xl border border-white/10"
                      >
                        <img src={image.src} alt={`Generated ${index + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="text-xs text-white/80">{image.enhancement}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {onReplaceImages && (
                    <button
                      onClick={onReplaceImages}
                      className="inline-flex items-center gap-2 text-sm text-[color:var(--ac-1)] transition-colors hover:text-[color:var(--ac-2)]"
                      type="button"
                    >
                      <Upload className="h-4 w-4" />
                      Replace images
                    </button>
                  )}
                </div>
              )}
            </div>

            {brandLocked && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/60">
                Brand palette enforced
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60">
        {totalVersions > 0
          ? `Version ${Math.min(currentVersion + 1, totalVersions)} of ${totalVersions} • Prompts synced with brand palette`
          : 'Awaiting first generation'}
      </footer>
      </div>

      <NanoGridBloom busy={isBusy} />
      <PerimeterProgressSegmented status={status} />
    </CardShell>
  );
}
