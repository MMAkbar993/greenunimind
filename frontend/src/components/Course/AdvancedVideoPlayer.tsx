import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/utils/toast';
import { SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize, Play, Pause, Download } from 'lucide-react';

// Debug log
console.log('AdvancedVideoPlayer component loaded - VERSION 2 - NO VIDEOJS');

interface AdvancedVideoPlayerProps {
  src: string;
  initialPosition?: number;
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
  onDurationChange?: (duration: number) => void;
  className?: string;
  poster?: string;
}

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  src,
  initialPosition = 0,
  onTimeUpdate,
  onComplete,
  onDurationChange,
  className,
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasTriggeredCompletion, setHasTriggeredCompletion] = useState(false);
  const [hasShownNearCompleteToast, setHasShownNearCompleteToast] = useState(false);


  // Initialize video
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Reset states
    setHasTriggeredCompletion(false);
    setHasShownNearCompleteToast(false);
    setCurrentTime(0);
    setIsPlaying(false);

    // Set initial position
    if (initialPosition > 0) {
      videoElement.currentTime = initialPosition;
    }

    // Set initial volume
    videoElement.volume = volume;
    videoElement.muted = isMuted;

    // Set initial playback rate
    videoElement.playbackRate = playbackRate;

    // Load the video
    videoElement.load();

    // Clean up
    return () => {
      if (videoElement) {
        videoElement.pause();
      }
    };
  }, [src, initialPosition, volume, isMuted, playbackRate]);

  // Handle time updates
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const newCurrentTime = Math.floor(videoElement.currentTime);
      setCurrentTime(newCurrentTime);
      onTimeUpdate?.(newCurrentTime);

      // Check for near completion (90%)
      if (!hasShownNearCompleteToast && duration > 0 && newCurrentTime / duration > 0.9) {
        setHasShownNearCompleteToast(true);
        toast.info("Almost Done!", {
          description: "You're almost finished with this lecture. Keep watching to complete it.",
        });
      }

      // Check for completion (95%)
      if (!hasTriggeredCompletion && duration > 0 && newCurrentTime / duration > 0.95) {
        setHasTriggeredCompletion(true);
        toast.success("Lecture Completed!", {
          description: "Great job! This lecture has been marked as complete.",
        });

        if (onComplete) {
          onComplete();
        }
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [duration, hasShownNearCompleteToast, hasTriggeredCompletion, onComplete, onTimeUpdate, toast]);

  // Handle video ended
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleEnded = () => {
      setIsPlaying(false);
      if (!hasTriggeredCompletion) {
        setHasTriggeredCompletion(true);
        toast.success("Lecture Completed!", {
          description: "Great job! You've finished this lecture.",
        });

        if (onComplete) {
          onComplete();
        }
      }
    };

    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [hasTriggeredCompletion, onComplete, toast]);

  // Handle duration change
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      const videoDuration = videoElement.duration;
      setDuration(videoDuration);
      onDurationChange?.(videoDuration);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onDurationChange]);

  // Handle play/pause state
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Play/Pause toggle
  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play().catch(error => {
        console.error('Error playing video:', error);
        toast.error("Playback Error", {
          description: "There was a problem playing this video. Please try again.",
        });
      });
    }
  };

  // Volume toggle
  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    videoElement.muted = newMutedState;
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoElement.volume = newVolume;

    // If volume is set to 0, mute the video
    if (newVolume === 0) {
      setIsMuted(true);
      videoElement.muted = true;
    } else if (isMuted) {
      // If volume is increased from 0, unmute the video
      setIsMuted(false);
      videoElement.muted = false;
    }
  };

  // Seek to time
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    videoElement.currentTime = newTime;
  };

  // Skip forward 10 seconds
  const skipForward = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
    videoElement.currentTime = newTime;
  };

  // Skip backward 10 seconds
  const skipBackward = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newTime = Math.max(0, videoElement.currentTime - 10);
    videoElement.currentTime = newTime;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Change playback rate
  const changePlaybackRate = (rate: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    setPlaybackRate(rate);
    videoElement.playbackRate = rate;
  };

  // Download video
  const downloadVideo = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = src.split('/').pop() || 'video';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Format time (convert seconds to MM:SS format)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-lg overflow-hidden bg-black aspect-video group",
        className
      )}
    >
      {/* Main video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Custom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-300 opacity-100 group-hover:opacity-100">
        {/* Progress bar */}
        <div className="flex items-center mb-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #4b5563 ${(currentTime / (duration || 1)) * 100}%, #4b5563 100%)`,
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Skip backward button */}
            <button
              onClick={skipBackward}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label="Skip backward 10 seconds"
            >
              <SkipBack size={20} />
            </button>

            {/* Skip forward button */}
            <button
              onClick={skipForward}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward size={20} />
            </button>

            {/* Volume control */}
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`,
                }}
              />
            </div>

            {/* Time display */}
            <div className="text-white text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Playback rate */}
            <div className="relative group">
              <button className="text-white text-xs hover:text-blue-400 transition-colors">
                {playbackRate}x
              </button>
              <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-gray-800 rounded p-1 shadow-lg">
                <div className="flex flex-col space-y-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`text-xs px-2 py-1 rounded ${playbackRate === rate ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={downloadVideo}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label="Download video"
            >
              <Download size={20} />
            </button>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Big play button overlay (shown when video is paused) */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="rounded-full bg-black/50 p-4">
            <Play size={48} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedVideoPlayer;
