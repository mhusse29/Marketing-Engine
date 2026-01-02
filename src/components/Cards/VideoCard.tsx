import { useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/format';
import type { GeneratedVideo } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';

function videoModelBadge(video?: GeneratedVideo): string {
  if (!video) return 'VIDEO';
  const provider = video.provider?.toUpperCase() || 'UNKNOWN';
  const model = video.model?.toUpperCase() || 'VIDEO';
  return `${provider}-${model}`;
}

interface VideoCardProps {
  videos: GeneratedVideo[];
  status: GridStepState;
  errorMessage?: string;
  onHide?: () => void;
}

export function VideoCard({
  videos,
  status,
  errorMessage,
  onHide,
}: VideoCardProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const video = videos[currentIndex];
  const totalVideos = videos.length;
  const isBusy = status === 'queued' || status === 'thinking' || status === 'rendering';

  return (
    <>
      <CardShell sheen={false} className="relative p-4 bg-white/[0.03] border border-white/10" aria-busy={isBusy}>
        {!video ? (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-white/6 bg-white/[0.03] px-6 text-sm text-white/60">
            {status === 'error' && errorMessage ? (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-6 max-w-md text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <p className="text-sm font-medium text-red-300 mb-2">Video Generation Failed</p>
                <p className="text-xs text-red-200/80">{errorMessage}</p>
              </div>
            ) : (
              <span>{isBusy ? 'Generating video...' : 'Video will appear here after generation runs.'}</span>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Model badge */}
            <div className="text-[10px] font-medium text-white/40 tracking-wider">
              PREVIEW
              <span className="ml-2 text-white/60">{videoModelBadge(video)}</span>
            </div>

            {/* Simple native video player */}
            <video
              src={video.url}
              controls
              loop
              className="w-full rounded-lg bg-black"
              style={{ 
                aspectRatio: video.aspect?.replace(':', '/') || '16/9',
                objectFit: 'contain'
              }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Dot navigation for multiple videos */}
            {totalVideos > 1 && (
              <div className="flex items-center justify-center gap-2">
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
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{video.duration || '?'}s • {video.aspect || '16:9'}</span>
              <button
                onClick={() => setShowFullscreen(true)}
                className="text-white/40 hover:text-white/70 transition text-xs"
              >
                Fullscreen
              </button>
            </div>
          </div>
        )}
        
        {/* X button */}
        {onHide && video && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHide();
            }}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 hover:bg-red-500/60 text-white/80 transition hover:text-white z-10"
            title="Hide"
            aria-label="Hide card"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </CardShell>

      {/* Fullscreen popup - simple native video */}
      {showFullscreen && video && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 text-white/60 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <video
            src={video.url}
            controls
            autoPlay
            loop
            className="max-w-full max-h-full"
            style={{ objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
}
