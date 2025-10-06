import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';

import { cn } from '../../lib/format';
import type { GeneratedPictures, PictureAsset, PictureRemixOptions } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import { StepDot } from '../Outputs/StepDot';
import NanoGridBloom from '@/ui/NanoGridBloom';
import PerimeterProgressSegmented from '@/ui/PerimeterProgressSegmented';

const STATUS_LABELS: Record<GridStepState, string> = {
  queued: 'Queued',
  thinking: 'Thinking…',
  rendering: 'Rendering…',
  ready: 'Ready',
  error: 'Needs attention',
};

const PROVIDER_LABELS: Record<GeneratedPictures['provider'], string> = {
  flux: 'FLUX Pro 1.1',
  stability: 'Stable Diffusion 3.5',
  openai: 'DALL·E 3',
  ideogram: 'Ideogram v1',
};

const extractBasePrompt = (version: GeneratedPictures | undefined): string => {
  if (!version) return '';
  if (version.mode === 'prompt') {
    return version.prompt;
  }
  return version.meta.prompt ?? '';
};

async function downloadAsset(asset: PictureAsset, index: number) {
  const response = await fetch(asset.url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `render-${index + 1}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

type PicturesCardProps = {
  pictures: GeneratedPictures[];
  currentVersion: number;
  brandLocked: boolean;
  onSave: () => void;
  onRegenerate: (options?: PictureRemixOptions) => Promise<void> | void;
  onReplaceImages?: () => void;
  status: GridStepState;
};

export function PicturesCard({
  pictures,
  currentVersion,
  brandLocked,
  onSave,
  onRegenerate,
  onReplaceImages: _onReplaceImages,
  status,
}: PicturesCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);

  const versionPictures = pictures[currentVersion];
  const totalVersions = pictures.length;
  const statusLabel = STATUS_LABELS[status];
  const isBusy = status === 'queued' || status === 'thinking' || status === 'rendering';

  const providerLabel = useMemo(() => {
    if (!versionPictures) return '';
    return PROVIDER_LABELS[versionPictures.provider] ?? versionPictures.provider;
  }, [versionPictures]);

  const createdAtLabel = useMemo(() => {
    if (!versionPictures) return '';
    try {
      return new Date(versionPictures.meta.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [versionPictures]);

  const promptText = useMemo(() => extractBasePrompt(versionPictures), [versionPictures]);

  const summaryItems = useMemo(() => {
    if (!versionPictures) {
      return [] as Array<{ label: string; value: string }>;
    }
    const meta = versionPictures.meta;
    const items: Array<{ label: string; value: string }> = [
      { label: 'Provider', value: providerLabel },
      { label: 'Mode', value: meta.mode === 'image' ? 'Images' : 'Prompt' },
      { label: 'Aspect', value: meta.aspect },
      { label: 'Style', value: meta.style },
    ];

    if (meta.quality) {
      items.push({ label: 'Quality', value: meta.quality });
    }
    if (meta.model) {
      items.push({ label: 'Model', value: meta.model });
    }

    return items;
  }, [versionPictures, providerLabel]);

  const handleCopyPrompt = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1200);
    });
  };

  const handleDownloadAll = async () => {
    if (versionPictures?.mode !== 'image' || !('assets' in versionPictures)) return;
    setIsDownloading(true);
    setDownloadError('');
    try {
      for (let index = 0; index < versionPictures.assets.length; index += 1) {
        const asset = versionPictures.assets[index];
        await downloadAsset(asset, index);
      }
    } catch (error) {
      setDownloadError((error as Error).message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    onSave();
    window.setTimeout(() => setIsSaved(false), 1200);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    setSelectedAssetIndex(0);
  }, [currentVersion]);

  const selectedAsset =
    versionPictures?.mode === 'image' && 'assets' in versionPictures
      ? versionPictures.assets[selectedAssetIndex]
      : undefined;

  return (
    <CardShell sheen={false} className="relative isolate overflow-hidden">
      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-white/95">Pictures / Prompt</h3>
              <StepDot state={status} />
              <span className="text-xs font-medium uppercase tracking-wider text-white/40">{statusLabel}</span>
            </div>
            <p className="text-sm text-white/50">Generated at {createdAtLabel || '—'}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaved || isBusy}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all',
                isSaved
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white'
              )}
              type="button"
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isBusy || isRegenerating}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
              type="button"
            >
              <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
              {isRegenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: Image Preview */}
          <div className="space-y-4">
            {versionPictures?.mode === 'image' && selectedAsset ? (
              <>
                {/* Large Preview */}
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                  <img
                    src={selectedAsset.url}
                    alt="Generated preview"
                    className="h-auto w-full object-contain"
                    style={{ maxHeight: '600px' }}
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => window.open(selectedAsset.url, '_blank', 'noopener,noreferrer')}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await downloadAsset(selectedAsset, selectedAssetIndex);
                            } catch (error) {
                              setDownloadError((error as Error).message || 'Download failed');
                            }
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadAll}
                          disabled={isDownloading}
                          className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {isDownloading ? 'Downloading…' : 'Download All'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {versionPictures.mode === 'image' && 'assets' in versionPictures && versionPictures.assets.map((asset, index) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetIndex(index)}
                      className={cn(
                        'relative overflow-hidden rounded-xl border transition-all',
                        selectedAssetIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-white/10 hover:border-white/30'
                      )}
                    >
                      <img src={asset.url} alt={`Thumbnail ${index + 1}`} className="aspect-square w-full object-cover" />
                      {selectedAssetIndex === index && (
                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-12">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-3 h-12 w-12 text-white/20" />
                  <p className="text-sm text-white/50">No images generated yet</p>
                </div>
              </div>
            )}

            {downloadError && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                {downloadError}
              </div>
            )}
          </div>

          {/* Right: Metadata & Prompt */}
          <aside className="space-y-4">
            {/* Snapshot */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Snapshot</span>
              </div>
              <dl className="space-y-3">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-white/50">{item.label}</dt>
                    <dd className="text-sm font-medium text-white/90">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Active Prompt */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Active Prompt</span>
                <button
                  onClick={() => handleCopyPrompt(promptText)}
                  disabled={!promptText}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white',
                    !promptText && 'cursor-not-allowed opacity-40 hover:text-white/50'
                  )}
                  type="button"
                >
                  {copiedPrompt ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedPrompt ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {promptText || 'Prompt will appear after generation.'}
              </p>
            </div>

            {brandLocked && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/60">
                🎨 Brand palette enforced
              </div>
            )}
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">
          {totalVersions > 0 && versionPictures
            ? `Version ${Math.min(currentVersion + 1, totalVersions)} of ${totalVersions} • ${providerLabel}`
            : 'Awaiting first generation'}
        </footer>
      </div>

      <NanoGridBloom busy={isBusy || isRegenerating} />
      <PerimeterProgressSegmented status={status} />
    </CardShell>
  );
}
