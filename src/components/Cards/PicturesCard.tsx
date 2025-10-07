import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RefreshCw, X } from 'lucide-react';

import { cn } from '../../lib/format';
import type { GeneratedPictures, PictureAsset, PictureRemixOptions } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import NanoGridBloom from '@/ui/NanoGridBloom';
import PerimeterProgressSegmented from '@/ui/PerimeterProgressSegmented';

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
  brandLocked: _brandLocked,
  onSave: _onSave,
  onRegenerate,
  onReplaceImages: _onReplaceImages,
  status,
}: PicturesCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const versionPictures = pictures[currentVersion];
  const isBusy = status === 'queued' || status === 'thinking' || status === 'rendering';

  const providerLabel = useMemo(() => {
    if (!versionPictures) return '';
    return PROVIDER_LABELS[versionPictures.provider] ?? versionPictures.provider;
  }, [versionPictures]);

  const modelName = useMemo(() => {
    if (!versionPictures) return '';
    const meta = versionPictures.meta;
    if (meta.model) return meta.model;
    return providerLabel;
  }, [versionPictures, providerLabel]);

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
    <>
      <CardShell sheen={false} className="relative isolate overflow-hidden">
        <div className="relative z-10">
          {/* Image Display with Overlays */}
          {versionPictures?.mode === 'image' && selectedAsset ? (
            <div className="relative group">
              {/* Main Image - Clickable */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20"
              >
                <img
                  src={selectedAsset.url}
                  alt="Generated image"
                  className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ maxHeight: '70vh' }}
                />

                {/* Model Name Watermark - Bottom Left */}
                <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-80">
                  <span className="text-xs font-medium text-white/90">{modelName}</span>
                </div>

                {/* Download Icon - Bottom Right */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await downloadAsset(selectedAsset, selectedAssetIndex);
                    } catch (error) {
                      console.error('Download failed:', error);
                    }
                  }}
                  className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-black/80 hover:text-white opacity-0 group-hover:opacity-100"
                  aria-label="Download"
                >
                  <Download className="h-4 w-4" />
                </button>

                {/* Regenerate Icon - Top Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegenerate();
                  }}
                  disabled={isRegenerating || isBusy}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-black/80 hover:text-white disabled:opacity-50 opacity-0 group-hover:opacity-100"
                  aria-label="Regenerate"
                >
                  <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
                </button>
              </button>

              {/* Dot Navigation - Only if multiple images */}
              {versionPictures.mode === 'image' && 'assets' in versionPictures && versionPictures.assets.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {versionPictures.assets.map((asset, index) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetIndex(index)}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        selectedAssetIndex === index
                          ? 'bg-white/80 w-8'
                          : 'bg-white/20 w-2 hover:bg-white/40'
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
                <p className="text-sm text-white/50">Generating images...</p>
              </div>
            </div>
          )}
        </div>

        <NanoGridBloom busy={isBusy || isRegenerating} />
        <PerimeterProgressSegmented status={status} radius={16} />
      </CardShell>

      {/* Fullscreen Popup */}
      <AnimatePresence>
        {isFullscreen && selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-8"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute right-8 top-8 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Full Image */}
            <motion.img
              src={selectedAsset.url}
              alt="Full size preview"
              className="max-h-full max-w-full object-contain"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Model Name - Bottom Center */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-white/90">{modelName}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
