import React from 'react';
import Video from 'next-video';
import { cn } from '@/lib/utils';

interface VideoResolution {
  url: string;
  quality: string;
  format?: string;
}

interface NextVideoPlayerProps {
  src: string;
  hlsUrl?: string;
  videoResolutions?: VideoResolution[];
  poster?: string;
  title?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: any) => void;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
}

const NextVideoPlayer: React.FC<NextVideoPlayerProps> = ({
  src,
  hlsUrl,
  videoResolutions = [],
  poster,
  title,
  onTimeUpdate,
  onComplete,
  onPlay,
  onPause,
  onError,
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false,
  className
}) => {
  // Determine the best video source
  const getVideoSource = () => {
    // Prefer HLS for adaptive streaming if available
    if (hlsUrl) {
      return hlsUrl;
    }

    // Use highest quality resolution if available
    if (videoResolutions.length > 0) {
      const sortedResolutions = [...videoResolutions].sort((a, b) => {
        const aQuality = parseInt(a.quality.replace('p', ''));
        const bQuality = parseInt(b.quality.replace('p', ''));
        return bQuality - aQuality; // Highest first
      });
      return sortedResolutions[0].url;
    }

    // Fallback to original source
    return src;
  };

  const videoSource = getVideoSource();

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    onTimeUpdate?.(video.currentTime, video.duration);
  };

  const handlePlay = () => {
    onPlay?.();
  };

  const handlePause = () => {
    onPause?.();
  };

  const handleEnded = () => {
    onComplete?.();
  };

  const handleError = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const error = event.currentTarget.error;
    onError?.(error);
  };

  return (
    <div 
      className={cn(
        "relative bg-black rounded-lg overflow-hidden",
        "aspect-video w-full",
        className
      )}
    >
      {title && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <h3 className="text-white font-medium text-lg drop-shadow-lg">
            {title}
          </h3>
        </div>
      )}
      
      <Video
        src={videoSource}
        poster={poster}
        autoPlay={autoPlay}
        controls={controls}
        muted={muted}
        loop={loop}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        className="w-full h-full object-contain"
        style={{
          width: '100%',
          height: '100%',
        }}
        // Additional next-video specific props
        playsInline
        preload="metadata"
      />
    </div>
  );
};

export default NextVideoPlayer;
