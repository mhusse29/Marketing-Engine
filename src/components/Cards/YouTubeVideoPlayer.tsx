import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward, X, Download } from 'lucide-react';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface YouTubeVideoPlayerProps {
  src: string;
  aspectRatio?: string;
  autoPlay?: boolean;
  loop?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  modelBadge?: string;
  videoMetadata?: {
    provider?: string;
    model?: string;
    duration?: number;
    aspect?: string;
    prompt?: string;
  };
}

export function YouTubeVideoPlayer({
  src,
  aspectRatio = '16:9',
  autoPlay = false,
  loop = false,
  onClose,
  showCloseButton = false,
  className = '',
  modelBadge = 'VIDEO',
}: YouTubeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  
  const [playing, setPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  
  // Update video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);
  
  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);
  
  // Auto-hide controls
  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      return;
    }
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing, currentTime]);
  
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
  };
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };
  
  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };
  
  // Download video
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowSettingsMenu(false);
  };
  
  // Timeline dragging handlers with RAF for smooth updates
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();      // Prevent default drag behavior
    e.stopPropagation();     // CRITICAL: Stop event from bubbling to card
    setIsDraggingTimeline(true);
    updateTimelinePosition(e);
  };
  
  const handleTimelineMouseMove = (e: MouseEvent) => {
    if (!isDraggingTimeline || !timelineRef.current || !videoRef.current) return;
    
    // Cancel previous RAF if still pending (prevents RAF buildup)
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    // Use RAF for smooth, premium updates
    rafId.current = requestAnimationFrame(() => {
      if (!timelineRef.current || !videoRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      
      // Update video immediately
      videoRef.current.currentTime = newTime;
      // Force state update for immediate visual feedback
      setCurrentTime(newTime);
      
      rafId.current = null;
    });
  };
  
  const handleTimelineMouseUp = () => {
    setIsDraggingTimeline(false);
  };
  
  const updateTimelinePosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime); // Force immediate state update
  };
  
  // Show time tooltip on hover
  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(percentage * duration);
  };
  
  // Add/remove drag event listeners
  useEffect(() => {
    if (isDraggingTimeline) {
      document.addEventListener('mousemove', handleTimelineMouseMove);
      document.addEventListener('mouseup', handleTimelineMouseUp);
    } else {
      document.removeEventListener('mousemove', handleTimelineMouseMove);
      document.removeEventListener('mouseup', handleTimelineMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleTimelineMouseMove);
      document.removeEventListener('mouseup', handleTimelineMouseUp);
    };
  }, [isDraggingTimeline, duration]);
  
  const progress = duration > 0 ? currentTime / duration : 0;
  
  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${className}`}
      style={{ aspectRatio: aspectRatio?.replace(':', '/') || '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        loop={loop}
        autoPlay={autoPlay}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain"
        onClick={() => {
          if (isDraggingTimeline) return; // Don't toggle during drag
          togglePlay();
        }}
        onDragStart={(e) => e.preventDefault()}
      />
      
      {/* Overlay Controls */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Center Play Button (when paused) - minimal, no blur */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            <Play size={20} className="text-white fill-white ml-0.5" />
          </button>
        )}
        
        {/* Bottom Controls Bar */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-3 space-y-2"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Timeline with Waveform */}
          <div
            ref={timelineRef}
            className="relative h-12 group"
            style={{ 
              cursor: isDraggingTimeline ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={handleTimelineMouseDown}
            onMouseMove={handleTimelineHover}
            onMouseLeave={() => setHoverTime(null)}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Simple Smooth Timeline Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 group-hover:h-1.5 transition-all">
              {/* Background track (gray) */}
              <div className="absolute inset-0 bg-white/20 rounded-full" />
              
              {/* Progress bar (red) */}
              <div
                className="absolute inset-y-0 left-0 bg-red-500 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            
            {/* Scrubber handle - centered on timeline track */}
            <div
              className="absolute w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              style={{ 
                left: `${progress * 100}%`,
                bottom: '0',
                transform: isDraggingTimeline 
                  ? 'translate(-50%, 50%) scale(1.5)' 
                  : 'translate(-50%, 50%) scale(1)'
              }}
            />
            
            {/* Time tooltip on hover/drag */}
            {hoverTime !== null && (
              <div
                className="absolute -top-8 bg-black/90 px-2 py-1 rounded text-xs text-white font-medium shadow-lg pointer-events-none"
                style={{ 
                  left: `${(hoverTime / duration) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
          
          {/* Control Buttons Row */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:bg-white/10 p-2 rounded transition"
              >
                {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
              </button>
              
              <button
                onClick={handleSkipBack}
                className="text-white hover:bg-white/10 p-2 rounded transition"
                title="Rewind 10s"
              >
                <SkipBack size={18} />
              </button>
              
              <button
                onClick={handleSkipForward}
                className="text-white hover:bg-white/10 p-2 rounded transition"
                title="Forward 10s"
              >
                <SkipForward size={18} />
              </button>
              
              {/* Volume Control */}
              <div
                className="flex items-center gap-2 group/volume"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="text-white hover:bg-white/10 p-2 rounded transition"
                >
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                
                <div
                  className={`overflow-hidden transition-all ${
                    showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'
                  }`}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Time Display */}
              <span className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Settings Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="text-white hover:bg-white/10 p-2 rounded transition"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
                
                {/* Settings Dropdown - Download & Speed Only */}
                {showSettingsMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl min-w-[220px] overflow-hidden">
                    {/* Download Option */}
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition text-left"
                    >
                      <Download size={16} />
                      <span className="text-sm">Download Video</span>
                    </button>
                    
                    <div className="border-t border-white/10" />
                    
                    {/* Speed Control */}
                    <div className="px-4 py-3">
                      <div className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">Playback Speed</div>
                      <div className="grid grid-cols-4 gap-1">
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              setShowSettingsMenu(false);
                            }}
                            className={`px-2 py-1.5 text-xs rounded transition ${
                              playbackSpeed === speed
                                ? 'bg-red-500 text-white font-medium'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            {speed === 1 ? 'Normal' : `${speed}x`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/10 p-2 rounded transition"
                title="Fullscreen"
              >
                <Maximize size={18} />
              </button>
              
              {showCloseButton && onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:bg-red-500/60 p-2 rounded transition ml-2"
                  title="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Watermark Badge (top-left) */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
        <span className="text-xs font-bold uppercase tracking-wider text-white/60 drop-shadow-lg">
          PREVIEW
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90 drop-shadow-lg">
          {modelBadge}
        </span>
      </div>
    </div>
  );
}
