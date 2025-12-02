import { useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/format';
import type { GeneratedVideo } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import { YouTubeVideoPlayer } from './YouTubeVideoPlayer';

function videoModelBadge(video?: GeneratedVideo): string {
  if (!video) return 'VIDEO';
  
  const provider = video.provider?.toUpperCase() || 'UNKNOWN';
  const model = video.model;

  // Runway models
  if (video.provider === 'runway') {
    switch (model) {
      case 'gen3a_turbo':
        return 'RUNWAY-GEN3A-TURBO';
      case 'gen4_turbo':
        return 'RUNWAY-GEN4-TURBO';
      case 'gen4_aleph':
        return 'RUNWAY-GEN4-ALEPH';
      case 'veo3':
        return 'RUNWAY-VEO-3';
      default:
        return `RUNWAY-${model?.toUpperCase() || 'VIDEO'}`;
    }
  }
  
  // Luma models
  if (video.provider === 'luma') {
    if (model === 'ray-2') {
      return 'LUMA-RAY-2';
    }
    return `LUMA-${model?.toUpperCase() || 'RAY-2'}`;
  }

  return `${provider}-${model?.toUpperCase() || 'VIDEO'}`;
}

// Removed STATUS_LABELS - not needed in minimal design

interface VideoCardProps {
  videos: GeneratedVideo[];
  status: GridStepState;
  onHide?: () => void;
}

export function VideoCard({
  videos,
  status,
  onHide,
}: VideoCardProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const video = videos[currentIndex];
  const totalVideos = videos.length;
  const isBusy = status === 'queued' || status === 'thinking' || status === 'rendering';


  return (
    <>
      <CardShell sheen={false} className="relative p-6 bg-white/[0.03] border border-white/10" aria-busy={isBusy}>
        {!video ? (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-white/6 bg-white/[0.03] px-6 text-sm text-white/60">
            Video will appear here after generation runs.
          </div>
        ) : (
          <div className="space-y-4">
            {/* YouTube-style Video Player with Waveform */}
            <YouTubeVideoPlayer
              src={video.url}
              aspectRatio={video.aspect}
              autoPlay={false}
              loop={true}
              className="max-h-[500px] rounded-xl"
              modelBadge={videoModelBadge(video)}
              videoMetadata={{
                provider: video.provider,
                model: video.model,
                duration: video.duration,
                aspect: video.aspect,
                prompt: video.prompt,
              }}
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
              <span>
                {totalVideos > 1
                  ? `Video ${currentIndex + 1} of ${totalVideos} • ${video.duration}s • ${video.aspect}`
                  : `${video.duration}s • ${video.aspect}`}
              </span>
            </div>
          </div>
        )}
        
        {/* X button in card padding area - NOT over video */}
        {onHide && video && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHide();
            }}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 hover:bg-red-500/60 text-white/80 backdrop-blur-sm transition hover:text-white z-10"
            title="Hide from main screen"
            aria-label="Hide card"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </CardShell>

      {/* Fullscreen popup */}
      {showFullscreen && video && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-8"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <YouTubeVideoPlayer
              src={video.url}
              aspectRatio={video.aspect}
              autoPlay={true}
              loop={true}
              onClose={() => setShowFullscreen(false)}
              showCloseButton={true}
              className="rounded-2xl shadow-2xl"
              modelBadge={videoModelBadge(video)}
              videoMetadata={{
                provider: video.provider,
                model: video.model,
                duration: video.duration,
                aspect: video.aspect,
                prompt: video.prompt,
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
