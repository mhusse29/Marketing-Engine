import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Maximize2, X } from 'lucide-react';

import { cn } from '../../lib/format';
import type { GeneratedPictures, PictureAsset, PictureRemixOptions } from '../../types';
import type { StageManagerEntryInput } from '@/components/StageManager/types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import { MinimizeButton } from '../StageManager/MinimizeButton';

const PROVIDER_LABELS: Record<GeneratedPictures['provider'], string> = {
  flux: 'FLUX Pro 1.1',
  stability: 'Stable Diffusion 3.5',
  openai: 'DALL·E 3',
  ideogram: 'Ideogram v1',
};

async function downloadAsset(asset: PictureAsset) {
  console.log('[Download] Starting download for:', asset.url);
  
  // Extract filename from URL
  const urlPath = new URL(asset.url).pathname;
  const urlFilename = urlPath.split('/').pop() || 'sample.png';
  const baseFilename = urlFilename.replace(/\.[^.]+$/, '');
  const urlExt = urlFilename.split('.').pop() || 'png';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${baseFilename}-${timestamp}.${urlExt}`;
  
  console.log('[Download] Target filename:', filename);
  
  // Determine API base
  const getApiBase = () => {
    const explicit = import.meta.env?.VITE_AI_GATEWAY_URL as string | undefined;
    if (explicit && explicit.trim().length > 0) {
      return explicit.replace(/\/$/, '');
    }
    return 'http://localhost:8787';
  };
  
  try {
    // Method 1: Try direct fetch (works for same-origin and some CORS-enabled URLs)
    console.log('[Download] Method 1: Direct fetch...');
    const directResponse = await fetch(asset.url, {
      method: 'GET',
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (directResponse.ok || directResponse.status === 304) {
      const blob = await directResponse.blob();
      if (blob.size > 0) {
        console.log('[Download] Direct fetch success, blob size:', blob.size);
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 150);
        return true;
      }
    }
    throw new Error('Direct fetch failed');
  } catch (directError) {
    console.warn('[Download] Method 1 failed:', directError);
    
    try {
      // Method 2: Use our server as a proxy (bypasses CORS)
      console.log('[Download] Method 2: Proxy through gateway...');
      const proxyUrl = `${getApiBase()}/v1/images/download?url=${encodeURIComponent(asset.url)}`;
      console.log('[Download] Proxy URL:', proxyUrl);
      
      const proxyResponse = await fetch(proxyUrl);
      
      if (!proxyResponse.ok) {
        throw new Error(`Proxy failed: ${proxyResponse.status}`);
      }
      
      const blob = await proxyResponse.blob();
      console.log('[Download] Proxy success, blob size:', blob.size);
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 150);
      
      return true;
    } catch (proxyError) {
      console.warn('[Download] Method 2 failed:', proxyError);
      
      try {
        // Method 3: Open in new tab (browser handles download)
        console.log('[Download] Method 3: Open in new tab...');
        const link = document.createElement('a');
        link.href = asset.url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 150);
        console.log('[Download] New tab opened (if pop-ups allowed)');
        return true;
      } catch (tabError) {
        console.error('[Download] Method 3 failed:', tabError);
        
        // Method 4: Last resort - copy to clipboard
        try {
          await navigator.clipboard.writeText(asset.url);
          alert('Download blocked by browser.\n\nImage URL copied to clipboard!\nPaste in new tab to download.');
          console.log('[Download] URL copied to clipboard');
          return true;
        } catch (clipboardError) {
          alert(`Download failed.\n\nRight-click the image and select "Save Image As..."\n\nOr open:\n${asset.url}`);
          throw clipboardError;
        }
      }
    }
  }
}

type PicturesCardProps = {
  pictures: GeneratedPictures[];
  currentVersion: number;
  brandLocked: boolean;
  onSave: () => void;
  onRegenerate: (options?: PictureRemixOptions) => Promise<void> | void;
  onReplaceImages?: () => void;
  status: GridStepState;
  onMinimize?: (entry: StageManagerEntryInput) => void;
};

export function PicturesCard({
  pictures,
  currentVersion,
  status,
  onMinimize,
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

  const handleMinimize = () => {
    if (!onMinimize) return;
    if (!versionPictures) return;

    const previewUrl =
      selectedAsset?.url ||
      (versionPictures.mode === 'image' && 'assets' in versionPictures && versionPictures.assets[0]?.url) ||
      '';

    onMinimize({
      cardType: 'pictures',
      data: {
        pictures: {
          url: previewUrl,
          provider: versionPictures.provider,
        },
      },
    });
  };

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
        {onMinimize && <MinimizeButton onMinimize={handleMinimize} />}
        
        <div className="relative z-10">
          {/* Image Display with Overlays */}
          {versionPictures?.mode === 'image' && selectedAsset ? (
            <div className="relative">
              {/* Main Image - Clickable */}
              <div className="relative w-full overflow-hidden bg-black/20">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="w-full"
                >
                  <img
                    src={selectedAsset.url}
                    alt="Generated image"
                    className="h-auto w-full object-contain"
                    style={{ maxHeight: '80vh' }}
                  />
                </button>

                {/* Bottom Overlay Bar */}
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4 pointer-events-none">
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
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
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
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const button = e.currentTarget;
                        const icon = button.querySelector('svg');
                        if (!icon) return;
                        
                        const originalHTML = button.innerHTML;
                        
                        try {
                          // Show loading state
                          button.disabled = true;
                          button.innerHTML = '<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
                          
                          // Perform download
                          await downloadAsset(selectedAsset);
                          
                          // Show success state
                          button.innerHTML = '<svg class="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>';
                          
                          // Reset after delay
                          setTimeout(() => {
                            button.innerHTML = originalHTML;
                            button.disabled = false;
                          }, 1200);
                        } catch (error) {
                          // Show error state
                          button.innerHTML = '<svg class="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>';
                          
                          // Reset after delay
                          setTimeout(() => {
                            button.innerHTML = originalHTML;
                            button.disabled = false;
                          }, 1200);
                          
                          console.error('Download failed:', error);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    {onMinimize && (
                      <MinimizeButton onMinimize={handleMinimize} />
                    )}
                  </div>
                </div>
              </div>

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
    </CardShell>

      {/* Fullscreen Popup (rendered via portal) */}
      {fullscreenPortal}
    </>
  );
}
