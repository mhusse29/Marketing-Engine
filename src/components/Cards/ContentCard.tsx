
import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Check, ChevronDown, Copy } from 'lucide-react';

import { cn } from '../../lib/format';
import type { GeneratedContent } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import { StepDot } from '../Outputs/StepDot';

interface ContentCardProps {
  content: GeneratedContent[][];
  currentVersion: number;
  onSave: () => void;
  onRegenerate: () => Promise<void> | void;
  status: GridStepState;
}

const PLATFORM_LABELS: Record<string, { label: string; icon: string }> = {
  facebook: { label: 'Facebook', icon: '📘' },
  instagram: { label: 'Instagram', icon: '📷' },
  tiktok: { label: 'TikTok', icon: '🎵' },
  linkedin: { label: 'LinkedIn', icon: '💼' },
  'google.search': { label: 'Search', icon: '🔍' },
  'google.display': { label: 'Display', icon: '🖼️' },
  'google.youtube': { label: 'YouTube', icon: '📺' },
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

export function ContentCard({
  content,
  currentVersion,
  onSave,
  onRegenerate,
  status,
}: ContentCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expandedCaptions, setExpandedCaptions] = useState<string[]>([]);
  const [copiedItems, setCopiedItems] = useState<string[]>([]);

  const versionContent = content[currentVersion] ?? [];
  const defaultPlatform = versionContent[0]?.platform ?? 'facebook';
  const platformCount = versionContent.length;
  const totalVersions = content.length;
  const statusLabel = STATUS_LABELS[status];
  const showSheen = status === 'thinking' || status === 'rendering';

  const timestamp = useMemo(
    () =>
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [content, currentVersion]
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

  const toggleCaption = (platform: string) => {
    setExpandedCaptions((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItems((prev) => [...prev, id]);
    window.setTimeout(() => {
      setCopiedItems((prev) => prev.filter((item) => item !== id));
    }, 1200);
  };

  return (
    <CardShell sheen={showSheen}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Content</h3>
            <StepDot state={status} />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/55">
            Generated at {timestamp}
            {platformCount > 0 && ` • ${platformCount} platform${platformCount === 1 ? '' : 's'}`}
          </p>
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

      <div className="space-y-4">
        {platformCount === 0 ? (
          <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-white/6 bg-white/[0.03] px-6 text-sm text-white/60">
            Content will appear here after generation runs.
          </div>
        ) : (
          <Tabs.Root defaultValue={defaultPlatform} className="flex flex-col gap-4">
            <Tabs.List className="flex flex-wrap gap-2">
              {versionContent.map((item) => {
                const platformInfo = PLATFORM_LABELS[item.platform];
                return (
                  <Tabs.Trigger
                    key={item.platform}
                    value={item.platform}
                    className={cn(
                      'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all',
                      'data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgba(62,139,255,0.85)] data-[state=active]:to-[rgba(107,112,255,0.85)] data-[state=active]:text-white data-[state=active]:shadow-[0_8px_24px_rgba(62,139,255,0.35)]',
                      'data-[state=inactive]:border-white/10 data-[state=inactive]:bg-white/[0.04] data-[state=inactive]:text-white/70 data-[state=inactive]:hover:border-white/20 data-[state=inactive]:hover:text-white'
                    )}
                  >
                    <span>{platformInfo?.icon ?? '📝'}</span>
                    <span>{platformInfo?.label ?? item.platform}</span>
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>

            <div className="space-y-4">
              {versionContent.map((item) => {
                const isExpanded = expandedCaptions.includes(item.platform);
                const headlineId = `headline-${item.platform}`;
                const captionId = `caption-${item.platform}`;
                const ctaId = `cta-${item.platform}`;

                return (
                  <Tabs.Content
                    key={item.platform}
                    value={item.platform}
                    className="space-y-4"
                  >
                    <div className="grid auto-rows-min gap-4">
                      <section className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/55">
                          <span>Headline</span>
                          <button
                            onClick={() => copyToClipboard(item.headline, headlineId)}
                            className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
                            type="button"
                          >
                            {copiedItems.includes(headlineId) ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy
                          </button>
                        </div>
                        <p className="text-base font-semibold text-white/90">{item.headline}</p>
                      </section>

                      {item.caption && (
                        <section className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-white/55">
                            <span>Caption</span>
                            <button
                              onClick={() => copyToClipboard(item.caption ?? '', captionId)}
                              className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
                              type="button"
                            >
                              {copiedItems.includes(captionId) ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              Copy
                            </button>
                          </div>
                          <div className="space-y-2 text-sm text-white/70">
                            <p className={cn('leading-relaxed', !isExpanded && item.caption.length > 150 && 'line-clamp-3')}>
                              {item.caption}
                            </p>
                            {item.caption.length > 150 && (
                              <button
                                onClick={() => toggleCaption(item.platform)}
                                className="inline-flex items-center gap-1 text-xs text-[color:var(--ac-1)] transition-colors hover:text-[color:var(--ac-2)]"
                                type="button"
                              >
                                <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                                <ChevronDown
                                  className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')}
                                />
                              </button>
                            )}
                          </div>
                        </section>
                      )}

                      {item.cta && (
                        <section className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-white/55">
                            <span>Call to action</span>
                            <button
                              onClick={() => copyToClipboard(item.cta ?? '', ctaId)}
                              className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
                              type="button"
                            >
                              {copiedItems.includes(ctaId) ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              Copy
                            </button>
                          </div>
                          <p className="inline-flex h-8 items-center rounded-full border border-white/12 bg-white/[0.05] px-3 text-sm font-medium text-white/80">
                            {item.cta}
                          </p>
                        </section>
                      )}
                    </div>
                  </Tabs.Content>
                );
              })}
            </div>
          </Tabs.Root>
        )}
      </div>

      <footer className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60">
        {totalVersions > 0
          ? `Version ${Math.min(currentVersion + 1, totalVersions)} of ${totalVersions} • Copy optimised per platform`
          : 'Awaiting first generation'}
      </footer>
    </CardShell>
  );
}
