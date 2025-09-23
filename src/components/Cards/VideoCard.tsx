
import { useMemo, useState } from 'react';
import { Check, Clock, Copy, Film, Maximize2 } from 'lucide-react';

import { cn } from '../../lib/format';
import type { GeneratedVideo } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import { StepDot } from '../Outputs/StepDot';

const BEAT_ICONS: Record<string, string> = {
  Hook: '🎬',
  Problem: '❓',
  Solution: '💡',
  Proof: '✨',
  Value: '🎯',
  CTA: '🚀',
};

const STATUS_LABELS: Record<GridStepState, string> = {
  queued: 'Queued',
  thinking: 'Thinking…',
  rendering: 'Rendering…',
  ready: 'Ready',
  error: 'Needs attention',
};

const ACTION_BUTTON =
  'h-8 rounded-full border border-white/12 bg-white/8 px-3 text-sm font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60';

interface VideoCardProps {
  videos: GeneratedVideo[];
  currentVersion: number;
  onSave: () => void;
  onRegenerate: () => Promise<void> | void;
  status: GridStepState;
}

export function VideoCard({ videos, currentVersion, onSave, onRegenerate, status }: VideoCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const versionVideo = videos[currentVersion];
  const totalVersions = videos.length;
  const statusLabel = STATUS_LABELS[status];
  const showSheen = status === 'thinking' || status === 'rendering';

  const timestamp = useMemo(
    () =>
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [videos, currentVersion]
  );

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

  const copyFullPrompt = async () => {
    if (!versionVideo) return;
    await navigator.clipboard.writeText(versionVideo.fullPrompt);
    setCopiedPrompt(true);
    window.setTimeout(() => setCopiedPrompt(false), 1200);
  };

  return (
    <CardShell sheen={showSheen}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Video Prompt</h3>
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
        {!versionVideo ? (
          <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-white/6 bg-white/[0.03] px-6 text-sm text-white/60">
            Video beats will appear here after generation runs.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-3 text-xs text-white/70">
              <span className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3">
                <Maximize2 className="h-3.5 w-3.5" />
                {versionVideo.aspect}
              </span>
              <span className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3">
                <Clock className="h-3.5 w-3.5" />
                {versionVideo.durationSec}s
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid auto-rows-min gap-4">
                {versionVideo.scriptBeats.map((beat, index) => (
                  <div
                    key={`${beat.label}-${index}`}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex min-w-[90px] items-center gap-2 text-sm font-semibold text-white/70">
                      <span>{BEAT_ICONS[beat.label] ?? '🎬'}</span>
                      <span>{beat.label}</span>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-white/70">{beat.text}</p>
                  </div>
                ))}

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <div className="flex items-center gap-2 font-medium text-white/70">
                      <Film className="h-4 w-4" />
                      Full Prompt
                    </div>
                    <button
                      onClick={copyFullPrompt}
                      className="inline-flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                      type="button"
                    >
                      {copiedPrompt ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">{versionVideo.fullPrompt}</p>
                </div>

                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-xs text-yellow-100/80">
                  Prompt only · video render not included
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60">
        {totalVersions > 0
          ? `Version ${Math.min(currentVersion + 1, totalVersions)} of ${totalVersions} • Beats sequenced for funnel flow`
          : 'Awaiting first generation'}
      </footer>
    </CardShell>
  );
}
