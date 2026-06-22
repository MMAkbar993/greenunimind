import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/redux/hooks';
import { setLastPosition as setLastPositionAction } from '@/redux/features/player/playerSlice';
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Download,
  AlertTriangle,
  RefreshCw,
  Loader2,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { debugOnly, Logger } from '@/utils/logger';

interface VideoResolution {
  url: string;
  quality: string;
  format?: string;
}

interface VideoPlayerProps {
  src: string;
  videoResolutions?: VideoResolution[];
  hlsUrl?: string;
  initialPosition?: number;
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
  onDurationChange?: (duration: number) => void;
  onReady?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: { played: number; loaded: number }) => void;
  className?: string;
  poster?: string;
  videoId?: string;
  enableDownload?: boolean;
  enableAnalytics?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
}

interface VideoError {
  type: 'network' | 'format' | 'permission' | 'unknown';
  message: string;
  code?: number;
  retryable: boolean;
}

interface VideoAnalytics {
  watchTime: number;
  completionRate: number;
  bufferingEvents: number;
  qualityChanges: number;
  errorCount: number;
  startTime: number;
}

const CloudinaryVideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  videoResolutions = [],
  hlsUrl,
  initialPosition = 0,
  onTimeUpdate,
  onComplete,
  onDurationChange,
  onReady,
  onError,
  onProgress,
  className,
  poster,
  videoId,
  enableDownload = false,
  enableAnalytics = true,
  autoRetry = true,
  maxRetries = 3,
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);
  const retryCountRef = useRef(0);
  const analyticsRef = useRef<VideoAnalytics>({
    watchTime: 0,
    completionRate: 0,
    bufferingEvents: 0,
    qualityChanges: 0,
    errorCount: 0,
    startTime: Date.now()
  });


  const dispatch = useAppDispatch();

  // Simple announce function for accessibility
  const announce = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, []);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Error handling state
  const [error, setError] = useState<VideoError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Use loaded state in progress display
  console.debug('Video loaded progress:', loaded);

  // Determine the best video source based on available options
  const videoSource = useMemo(() => {
    // Prefer HLS for adaptive streaming if available
    if (hlsUrl && ReactPlayer.canPlay(hlsUrl)) {
      return hlsUrl;
    }

    // Use specific resolution if available and supported
    if (videoResolutions.length > 0) {
      const preferredQuality = currentQuality === 'auto' ? '720p' : currentQuality;
      const resolution = videoResolutions.find(r => r.quality === preferredQuality) || videoResolutions[0];
      if (resolution && ReactPlayer.canPlay(resolution.url)) {
        return resolution.url;
      }
    }

    // Fallback to original source
    return src;
  }, [src, hlsUrl, videoResolutions, currentQuality]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error?.type === 'network' && autoRetry) {
        handleRetry();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError({
        type: 'network',
        message: 'No internet connection. Please check your network and try again.',
        retryable: true
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, autoRetry]);

  // Analytics tracking
  useEffect(() => {
    if (!enableAnalytics) return;

    const interval = setInterval(() => {
      if (isPlaying && playerRef.current) {
        analyticsRef.current.watchTime += 1;

        const currentTime = playerRef.current.getCurrentTime();
        const totalDuration = playerRef.current.getDuration();

        if (totalDuration > 0) {
          analyticsRef.current.completionRate = (currentTime / totalDuration) * 100;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, enableAnalytics]);

  // Error handling and retry logic
  const handleRetry = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      setError({
        type: 'unknown',
        message: 'Maximum retry attempts reached. Please refresh the page or contact support.',
        retryable: false
      });
      return;
    }

    setIsRetrying(true);
    setError(null);
    retryCountRef.current += 1;

    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));

      if (playerRef.current) {
        // Force reload the video
        const currentTime = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(currentTime);
      }

      debugOnly.log(`Video retry attempt ${retryCountRef.current}/${maxRetries}`);
    } catch (err) {
      Logger.error('Video retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  }, [maxRetries]);

  // Enhanced error handler
  const handleVideoError = useCallback((error: any) => {
    analyticsRef.current.errorCount += 1;

    let videoError: VideoError;

    if (!isOnline) {
      videoError = {
        type: 'network',
        message: 'No internet connection. Please check your network and try again.',
        retryable: true
      };
    } else if (error?.target?.error?.code) {
      const code = error.target.error.code;
      switch (code) {
        case 1: // MEDIA_ERR_ABORTED
          videoError = {
            type: 'unknown',
            message: 'Video playback was aborted. Please try again.',
            code,
            retryable: true
          };
          break;
        case 2: // MEDIA_ERR_NETWORK
          videoError = {
            type: 'network',
            message: 'Network error occurred while loading the video. Please check your connection.',
            code,
            retryable: true
          };
          break;
        case 3: // MEDIA_ERR_DECODE
          videoError = {
            type: 'format',
            message: 'Video format is not supported or corrupted. Please try a different quality.',
            code,
            retryable: false
          };
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          videoError = {
            type: 'format',
            message: 'Video format is not supported by your browser. Please try updating your browser.',
            code,
            retryable: false
          };
          break;
        default:
          videoError = {
            type: 'unknown',
            message: 'An unknown error occurred while playing the video.',
            code,
            retryable: true
          };
      }
    } else {
      videoError = {
        type: 'unknown',
        message: 'Failed to load video. Please try refreshing the page.',
        retryable: true
      };
    }

    setError(videoError);
    onError?.(videoError);

    Logger.error('Video player error:', { error: videoError, originalError: error });

    // Auto-retry for retryable errors
    if (videoError.retryable && autoRetry && retryCountRef.current < maxRetries) {
      setTimeout(() => handleRetry(), 2000);
    } else {
      toast.error("Video Error", {
        description: videoError.message,
      });
    }
  }, [isOnline, onError, autoRetry, maxRetries, handleRetry, toast]);

  // Memoize handlers to prevent unnecessary re-renders
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    announce('Video playing');
  }, [announce]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    announce('Video paused');
  }, [announce]);

  const handleProgress = useCallback((state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
      onTimeUpdate?.(state.playedSeconds);

      // Save position to Redux store every 5 seconds
      if (videoId && state.playedSeconds > 0) {
        if (Math.floor(state.playedSeconds) % 5 === 0) {
          dispatch(setLastPositionAction({ videoId, position: state.playedSeconds }));
        }
      }

      onProgress?.({ played: state.played, loaded: state.loaded });
    }
  }, [seeking, onTimeUpdate, videoId, dispatch, onProgress]);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
    onDurationChange?.(duration);
  }, [onDurationChange]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onComplete?.();
  }, [onComplete]);

  const handleReady = useCallback(() => {
    if (!isReadyRef.current) {
      isReadyRef.current = true;
      if (initialPosition > 0 && playerRef.current) {
        playerRef.current.seekTo(initialPosition);
      }
      onReady?.();
    }
  }, [initialPosition, onReady]);

  // Replace the old error handler with the enhanced one
  const handleError = handleVideoError;

  // Handle keyboard controls
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!playerRef.current) return;

    let seekBackward: number;
    let seekForward: number;
    let videoElement: HTMLVideoElement | null;
    let video: HTMLVideoElement | null;
    let percentage: number;

    switch (event.key.toLowerCase()) {
      case ' ':
      case 'k':
        event.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      case 'arrowleft':
        event.preventDefault();
        seekBackward = Math.max(0, played * duration - 10);
        playerRef.current.seekTo(seekBackward);
        break;
      case 'arrowright':
        event.preventDefault();
        seekForward = Math.min(duration, played * duration + 10);
        playerRef.current.seekTo(seekForward);
        break;
      case 'f':
        event.preventDefault();
        videoElement = document.querySelector('video');
        if (videoElement) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            videoElement.requestFullscreen();
          }
        }
        break;
      case 'm':
        event.preventDefault();
        video = document.querySelector('video');
        if (video) {
          video.muted = !video.muted;
        }
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault();
        percentage = parseInt(event.key) / 10;
        playerRef.current.seekTo(percentage);
        break;
    }
  }, [played, duration]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isReadyRef.current = false;
    };
  }, []);

  // Quality selector component
  const QualitySelector = () => {
    if (videoResolutions.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-white" />
        <select
          value={currentQuality}
          onChange={(e) => setCurrentQuality(e.target.value)}
          className="bg-black/50 text-white text-sm rounded px-2 py-1 border border-white/20"
          aria-label="Video quality"
        >
          <option value="auto">Auto</option>
          {videoResolutions.map((resolution) => (
            <option key={resolution.quality} value={resolution.quality}>
              {resolution.quality}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Error display component
  const ErrorDisplay = () => {
    if (!error) return null;

    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">Video Error</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>

          <div className="flex gap-3 justify-center">
            {error.retryable && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="gap-2"
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>

          {!isOnline && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <WifiOff className="h-4 w-4" />
              <span>No internet connection</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading overlay component
  const LoadingOverlay = () => {
    if (!isBuffering && !isRetrying) return null;

    return (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-black/70 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
          <span className="text-white">
            {isRetrying ? 'Retrying...' : 'Loading...'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-video bg-black rounded-lg overflow-hidden", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <ReactPlayer
        ref={playerRef}
        url={videoSource}
        playing={isPlaying}
        controls={false}
        width="100%"
        height="100%"
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleEnded}
        onReady={handleReady}
        onError={handleError}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        config={{
          file: {
            attributes: {
              poster: poster,
              crossOrigin: "anonymous",
            },
            forceVideo: true,
          },
        }}
      />

      {/* Custom controls overlay */}
      {showControls && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:bg-white/20"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            {/* Progress bar */}
            <div className="flex-1">
              <Slider
                value={[played * 100]}
                onValueChange={(value) => {
                  const seekTo = value[0] / 100;
                  setSeeking(true);
                  setPlayed(seekTo);
                  playerRef.current?.seekTo(seekTo);
                  setTimeout(() => setSeeking(false), 100);
                }}
                max={100}
                step={0.1}
                className="w-full"
                aria-label="Video progress"
              />
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted(!muted)}
                className="text-white hover:bg-white/20"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Quality selector */}
            <QualitySelector />

            {/* Download button */}
            {enableDownload && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(videoSource, '_blank')}
                className="text-white hover:bg-white/20"
                aria-label="Download video"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {/* Fullscreen button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                  setIsFullscreen(false);
                } else {
                  containerRef.current?.requestFullscreen();
                  setIsFullscreen(true);
                }
              }}
              className="text-white hover:bg-white/20"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Network status indicator */}
      {!isOnline && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </div>
      )}

      {/* Loading overlay */}
      <LoadingOverlay />

      {/* Error display */}
      <ErrorDisplay />
    </div>
  );
};

export default CloudinaryVideoPlayer;