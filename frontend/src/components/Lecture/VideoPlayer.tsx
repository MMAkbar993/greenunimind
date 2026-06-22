import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  Download,
  Loader2,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { VideoResolution } from '@/types/course';

interface VideoPlayerProps {
  videoUrl?: string;
  hlsUrl?: string;
  videoResolutions?: VideoResolution[];
  title: string;
  duration?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  autoPlay?: boolean;
  className?: string;
  poster?: string;
  enableDownload?: boolean;
  enablePictureInPicture?: boolean;
  enableKeyboardShortcuts?: boolean;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
  buffered: number;
  playbackRate: number;
  quality: string;
  isOnline: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  hlsUrl,
  videoResolutions = [],
  title,
  duration: propDuration,
  onProgress,
  onComplete,
  autoPlay = false,
  className,
  poster,
  enableDownload = false,
  enablePictureInPicture = true, // Reserved for future implementation
  enableKeyboardShortcuts = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: propDuration || 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isLoading: false,
    error: null,
    buffered: 0,
    playbackRate: 1,
    quality: 'auto',
    isOnline: navigator.onLine,
  });

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setPlayerState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPlayerState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));

    // Prefer HLS if available and supported
    if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    } else if (videoUrl) {
      video.src = videoUrl;
    } else if (videoResolutions.length > 0) {
      // Use highest quality available
      const highestQuality = videoResolutions.reduce((prev, current) => {
        const prevQuality = parseInt(prev.quality.replace('p', ''));
        const currentQuality = parseInt(current.quality.replace('p', ''));
        return currentQuality > prevQuality ? current : prev;
      });
      video.src = highestQuality.url;
      setPlayerState(prev => ({ ...prev, quality: highestQuality.quality }));
    }

    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({
        ...prev,
        duration: video.duration,
        isLoading: false,
      }));
    };

    const handleError = () => {
      setPlayerState(prev => ({
        ...prev,
        error: 'Failed to load video. Please check your connection and try again.',
        isLoading: false,
      }));
    };

    const handleCanPlay = () => {
      setPlayerState(prev => ({ ...prev, isLoading: false }));
      if (autoPlay) {
        video.play().catch(() => {
          // Autoplay failed, user interaction required
        });
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoUrl, hlsUrl, videoResolutions, autoPlay]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      setPlayerState(prev => ({ ...prev, currentTime }));
      
      if (onProgress) {
        onProgress(currentTime, duration);
      }
    };

    const handleEnded = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      if (onComplete) {
        onComplete();
      }
    };

    const handlePlay = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleVolumeChange = () => {
      setPlayerState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = (video.buffered.end(0) / video.duration) * 100;
        setPlayerState(prev => ({ ...prev, buffered }));
      }
    };

    const handleWaiting = () => {
      setPlayerState(prev => ({ ...prev, isLoading: true }));
    };

    const handlePlaying = () => {
      setPlayerState(prev => ({ ...prev, isLoading: false }));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [onProgress, onComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || !containerRef.current?.contains(document.activeElement)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts]);

  // Control visibility management
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (playerState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout, playerState.isPlaying]);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Player control functions
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('Play failed:', error);
        setPlayerState(prev => ({
          ...prev,
          error: 'Failed to play video. Please try again.',
        }));
      });
    }
  }, [playerState.isPlaying]);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
  }, []);

  const seekForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, video.duration);
  }, []);

  const seekBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setPlayerState(prev => ({ ...prev, isFullscreen: true }));
      });
    } else {
      document.exitFullscreen().then(() => {
        setPlayerState(prev => ({ ...prev, isFullscreen: false }));
      });
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const changeQuality = useCallback((quality: string, url: string) => {
    const video = videoRef.current;
    if (!video) return;
    
    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;
    
    video.src = url;
    video.currentTime = currentTime;
    
    if (wasPlaying) {
      video.play();
    }
    
    setPlayerState(prev => ({ ...prev, quality }));
  }, []);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (playerState.error) {
    return (
      <div className={cn("relative bg-black rounded-lg overflow-hidden", className)}>
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Video Error</h3>
              <p className="text-sm text-gray-300">{playerState.error}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      tabIndex={0}
    >
      {/* Network Status Indicator */}
      {!playerState.isOnline && (
        <div className="absolute top-4 right-4 z-50">
          <Badge variant="destructive" className="flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            Offline
          </Badge>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        preload="metadata"
        playsInline
        onClick={togglePlayPause}
      />

      {/* Loading Overlay */}
      {playerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Play Button Overlay */}
      {!playerState.isPlaying && !playerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </Button>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300",
          showControls || !playerState.isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div
            ref={progressRef}
            className="relative h-1 bg-white bg-opacity-30 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seekTo(percent * playerState.duration);
            }}
          >
            {/* Buffered Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-white bg-opacity-50 rounded-full"
              style={{ width: `${playerState.buffered}%` }}
            />
            {/* Current Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-brand-primary rounded-full"
              style={{ width: `${(playerState.currentTime / playerState.duration) * 100}%` }}
            />
            {/* Progress Handle */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-brand-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${(playerState.currentTime / playerState.duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            {/* Skip Backward */}
            <Button
              variant="ghost"
              size="sm"
              onClick={seekBackward}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size="sm"
              onClick={seekForward}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[playerState.isMuted ? 0 : playerState.volume * 100]}
                  onValueChange={([value]) => {
                    const video = videoRef.current;
                    if (video) {
                      video.volume = value / 100;
                      video.muted = false;
                    }
                  }}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Time Display */}
            <span className="text-white text-sm font-mono">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={playerState.playbackRate === rate ? 'bg-accent' : ''}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
                
                {videoResolutions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Quality</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => changeQuality('auto', videoUrl || hlsUrl || '')}
                      className={playerState.quality === 'auto' ? 'bg-accent' : ''}
                    >
                      Auto
                    </DropdownMenuItem>
                    {videoResolutions.map((resolution) => (
                      <DropdownMenuItem
                        key={resolution.quality}
                        onClick={() => changeQuality(resolution.quality, resolution.url)}
                        className={playerState.quality === resolution.quality ? 'bg-accent' : ''}
                      >
                        {resolution.quality}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Download */}
            {enableDownload && (videoUrl || hlsUrl) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = videoUrl || hlsUrl || '';
                  link.download = title;
                  link.click();
                }}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {playerState.isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
