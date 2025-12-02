import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, X } from 'lucide-react';
import { cn } from '../../lib/format';

interface ModernVideoPlayerProps {
  src: string;
  aspectRatio?: string;
  autoPlay?: boolean;
  loop?: boolean;
  badge?: string;
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
}

export function ModernVideoPlayer({
  src,
  aspectRatio = '16:9',
  autoPlay = false,
  loop = true,
  badge,
  onClose,
  className,
  showCloseButton = false,
}: ModernVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = (_e: Event) => {
      setIsPlaying(false);
      if (!loop) {
        setCurrentTime(0);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [loop]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;

    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = e.currentTarget;
    if (!video) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying && !isDragging) {
        setShowControls(false);
      }
    }, 2000);
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isDragging) {
      setShowControls(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative group rounded-2xl overflow-hidden bg-black", className)}
      style={{ aspectRatio: aspectRatio.replace(':', '/') }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        loop={loop}
        autoPlay={autoPlay}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* Badge Watermark */}
      {badge && (
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60 drop-shadow-lg">
            PREVIEW
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90 drop-shadow-lg">
            {badge}
          </span>
        </div>
      )}

      {/* Close Button (Top Right) */}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/40 hover:bg-red-500/40 text-white/70 backdrop-blur-sm transition hover:text-red-300 z-50"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* YouTube-Style Custom Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-all duration-300",
          showControls || !isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {/* Progress Bar Container (Glassmorphism) */}
        <div className="px-4 pb-2">
          <div
            className="relative h-1 bg-white/20 rounded-full cursor-pointer backdrop-blur-sm hover:h-1.5 transition-all group/progress"
            onClick={handleSeek}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
          >
            {/* Progress Fill */}
            <div
              className="absolute inset-y-0 left-0 bg-red-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
            
            {/* Hover Preview (optional - you can add thumbnail preview here) */}
            <div
              className="absolute top-0 left-0 h-full pointer-events-none"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
            </div>
          </div>
        </div>

        {/* Control Bar (Glassmorphism) */}
        <div className="flex items-center gap-3 px-4 pb-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-md">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-white" />
            ) : (
              <Play className="h-5 w-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 group/volume">
            <button
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            
            {/* Volume Slider (shows on hover) */}
            <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="flex-1 text-white/90 text-xs font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Settings (optional) */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors opacity-60"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center Play Button (when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity group-hover:bg-black/30"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-2xl scale-100 hover:scale-110">
            <Play className="h-8 w-8 fill-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}
