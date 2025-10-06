import { useEffect, useMemo, useState } from 'react';
import { Check, Download, Maximize2, RefreshCw } from 'lucide-react';

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
        {/* Compact Header */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white/95">Pictures / Prompt</h3>
            <StepDot state={status} />
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">{statusLabel}</span>
            <span className="text-xs text-white/40">•</span>
            <span className="text-xs text-white/50">{createdAtLabel}</span>
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

        {/* Image Display - Full Width */}
        <div className="flex-1">
          {versionPictures?.mode === 'image' && selectedAsset ? (
            <div className="flex flex-col items-center">
              {/* Image Container - Fits image perfectly */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <img
                  src={selectedAsset.url}
                  alt="Generated image"
                  className="h-auto w-full object-contain"
                  style={{ maxHeight: '70vh' }}
                />
              </div>

              {/* Action Buttons Below Image */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => window.open(selectedAsset.url, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-2 text-sm text-white/30 transition-colors hover:text-white/60"
                >
                  <Maximize2 className="h-4 w-4" />
                  Expand Full Preview
                </button>
                <span className="h-4 w-px bg-white/10" />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await downloadAsset(selectedAsset, selectedAssetIndex);
                    } catch (error) {
                      console.error('Download failed:', error);
                    }
                  }}
                  className="inline-flex items-center gap-2 text-sm text-white/30 transition-colors hover:text-white/60"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>

              {/* Thumbnail Navigation - Only if multiple images */}
              {versionPictures.mode === 'image' && 'assets' in versionPictures && versionPictures.assets.length > 1 && (
                <div className="mt-6 flex items-center gap-2">
                  {versionPictures.assets.map((asset, index) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetIndex(index)}
                      className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        selectedAssetIndex === index
                          ? 'bg-white/80 w-8'
                          : 'bg-white/20 hover:bg-white/40'
                      )}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-center">
                <p className="text-sm text-white/50">No images generated yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50">
          <span>
            {totalVersions > 0 && versionPictures
              ? `Version ${Math.min(currentVersion + 1, totalVersions)} of ${totalVersions} • ${providerLabel}`
              : 'Awaiting first generation'}
          </span>
          {brandLocked && (
            <span className="text-white/40">🎨 Brand palette enforced</span>
          )}
        </footer>
      </div>

      <NanoGridBloom busy={isBusy || isRegenerating} />
      <PerimeterProgressSegmented status={status} />
    </CardShell>
  );
}
