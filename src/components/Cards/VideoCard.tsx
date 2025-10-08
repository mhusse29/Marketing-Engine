import { useState } from 'react';
import { Download, Maximize2, Check, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/format';
import type { GeneratedVideo } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import NanoGridBloom from '@/ui/NanoGridBloom';
import PerimeterProgressSegmented from '@/ui/PerimeterProgressSegmented';

// Removed STATUS_LABELS - not needed in minimal design

interface VideoCardProps {
  videos: GeneratedVideo[];
  currentVersion: number;
  onSave: () => void;
  onRegenerate: () => Promise<void> | void;
  status: GridStepState;
}

export function VideoCard({ videos, currentVersion: _currentVersion, onSave: _onSave, onRegenerate: _onRegenerate, status }: VideoCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const video = videos[currentIndex];
  const totalVideos = videos.length;
  const isBusy = status === 'queued' || status === 'thinking' || status === 'rendering';

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!video || isDownloading) return;

    setIsDownloading(true);

    try {
      console.log('[Video Download] Starting:', video.url);

      const response = await fetch(video.url, {
        method: 'GET',
        cache: 'no-store',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `video-${video.taskId}-${Date.now()}.mp4`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 150);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
      console.log('[Video Download] Success');
    } catch (error) {
      console.error('[Video Download] Failed:', error);
      alert('Download failed. Please try again or right-click the video to save.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFullscreen(true);
  };

  return (
    <>
      <CardShell sheen={false} className="relative isolate overflow-hidden">
        <div className="relative z-10 flex h-full flex-col">
          {!video ? (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-white/6 bg-white/[0.03] px-6 text-sm text-white/60">
              Video will appear here after generation runs.
            </div>
          ) : (
            <div className="relative flex flex-col">
              {/* Video Player */}
              <div className="relative group">
                <video
                  src={video.url}
                  controls
                  loop
                  preload="metadata"
                  className="w-full rounded-2xl bg-black shadow-2xl"
                  style={{
                    aspectRatio: video.aspect.replace(':', '/'),
                  }}
                />

                {/* Bottom-left watermark */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60 drop-shadow-lg">
                    PREVIEW
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90 drop-shadow-lg">
                    {video.model === 'gen3a_turbo' ? 'RUNWAY-GEN3-TURBO' : 'RUNWAY-GEN3-ALPHA'}
                  </span>
                </div>

                {/* Bottom-right action icons */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    onClick={handleExpand}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white/70 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
                    title="Expand fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading || downloadSuccess}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-sm transition',
                      downloadSuccess
                        ? 'bg-emerald-500/40 text-emerald-100'
                        : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                    )}
                    title="Download video"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : downloadSuccess ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dot navigation for multiple videos */}
              {totalVideos > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {videos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        index === currentIndex
                          ? 'w-6 bg-white/80'
                          : 'bg-white/30 hover:bg-white/50'
                      )}
                      aria-label={`Go to video ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Footer metadata */}
              <div className="mt-4 text-xs text-white/50">
                {totalVideos > 1
                  ? `Video ${currentIndex + 1} of ${totalVideos} • ${video.duration}s ${video.aspect}`
                  : `${video.duration}s ${video.aspect}`}
              </div>
            </div>
          )}
        </div>

        <NanoGridBloom busy={isBusy} />
        <PerimeterProgressSegmented status={status} />
      </CardShell>

      {/* Fullscreen popup */}
      {showFullscreen && video && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-8"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <video
              src={video.url}
              controls
              autoPlay
              loop
              className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl"
              style={{
                aspectRatio: video.aspect.replace(':', '/'),
              }}
            />

            {/* Watermark in fullscreen */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-1 pointer-events-none">
              <span className="text-sm font-bold uppercase tracking-wider text-white/70 drop-shadow-lg">
                PREVIEW
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-white/95 drop-shadow-lg">
                {video.model === 'gen3a_turbo' ? 'RUNWAY-GEN3-TURBO' : 'RUNWAY-GEN3-ALPHA'}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
