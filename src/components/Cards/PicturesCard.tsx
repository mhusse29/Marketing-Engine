import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Maximize2, X } from 'lucide-react';

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
  onRegenerate: _onRegenerate,
  onReplaceImages: _onReplaceImages,
  status,
}: PicturesCardProps) {
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
    if (meta.model) {
      return meta.model.toUpperCase();
    }
    return providerLabel.toUpperCase();
  }, [versionPictures, providerLabel]);

  useEffect(() => {
    setSelectedAssetIndex(0);
  }, [currentVersion]);

  const selectedAsset =
    versionPictures?.mode === 'image' && 'assets' in versionPictures
      ? versionPictures.assets[selectedAssetIndex]
      : undefined;

  // Fullscreen Popup Component
  const fullscreenPortal = isFullscreen && selectedAsset ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-8"
        onClick={() => setIsFullscreen(false)}
        style={{ position: 'fixed' }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="absolute right-8 top-8 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white z-[10000]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Full Image */}
        <motion.img
          src={selectedAsset.url}
          alt="Full size preview"
          className="max-h-full max-w-full rounded-lg object-contain"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Model Name - Bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10000]">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              Preview
            </span>
            <span className="text-sm font-medium uppercase tracking-wide text-white/90">
              {modelName}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <CardShell sheen={false} className="relative isolate overflow-hidden p-0">
        <div className="relative z-10">
          {/* Image Display with Overlays */}
          {versionPictures?.mode === 'image' && selectedAsset ? (
            <div className="relative">
              {/* Main Image - Clickable */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="relative w-full overflow-hidden bg-black/20"
              >
                <img
                  src={selectedAsset.url}
                  alt="Generated image"
                  className="h-auto w-full object-contain"
                  style={{ maxHeight: '80vh' }}
                />

                {/* Bottom Overlay Bar */}
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4">
                  {/* Left: Preview + Model Name */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                      Preview
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-white/90">
                      {modelName}
                    </span>
                  </div>

                  {/* Right: Action Icons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFullscreen(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
                      aria-label="Expand"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
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
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
                      aria-label="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </button>

              {/* Dot Navigation - Only if multiple images */}
              {versionPictures.mode === 'image' && 'assets' in versionPictures && versionPictures.assets.length > 1 && (
                <div className="flex items-center justify-center gap-2 py-4">
                  {versionPictures.assets.map((asset, index) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetIndex(index)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        selectedAssetIndex === index
                          ? 'bg-white/80 w-8'
                          : 'bg-white/20 w-1.5 hover:bg-white/40'
                      )}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[500px] items-center justify-center bg-black/10">
              <div className="text-center">
                <p className="text-sm text-white/50">
                  {isBusy ? 'Generating images...' : 'No images generated yet'}
                </p>
              </div>
            </div>
          )}
        </div>

        <NanoGridBloom busy={isBusy} />
        <PerimeterProgressSegmented status={status} radius={16} />
      </CardShell>

      {/* Fullscreen Popup (rendered via portal) */}
      {fullscreenPortal}
    </>
  );
}
