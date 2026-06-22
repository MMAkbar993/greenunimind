import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Volume, Volume1, Volume2, VolumeX, FastForward, Rewind } from 'lucide-react';

interface VolumeOverlayProps {
  volume: number;
  visible: boolean;
  className?: string;
}

export const VolumeOverlay: React.FC<VolumeOverlayProps> = ({
  volume,
  visible,
  className
}) => {
  const volumePercentage = Math.round(volume * 100);

  // Choose the appropriate volume icon based on level
  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-8 w-8" />;
    if (volume < 0.3) return <Volume className="h-8 w-8" />;
    if (volume < 0.7) return <Volume1 className="h-8 w-8" />;
    return <Volume2 className="h-8 w-8" />;
  };

  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
    >
      <VolumeIcon />
      <div className="text-xl font-semibold mt-2">{volumePercentage}%</div>
    </div>
  );
};

interface SeekOverlayProps {
  seconds: number;
  direction: 'forward' | 'backward';
  visible: boolean;
  className?: string;
}

export const SeekOverlay: React.FC<SeekOverlayProps> = ({
  seconds,
  direction,
  visible,
  className
}) => {
  return (
    <div
      className={cn(
        "absolute top-1/2 transform -translate-y-1/2 bg-black/70 text-white rounded-lg p-4 flex items-center justify-center transition-opacity duration-300",
        direction === 'forward' ? "right-1/4 -translate-x-1/2" : "left-1/4 translate-x-1/2",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
    >
      {direction === 'forward' ? (
        <FastForward className="h-8 w-8 mr-2" />
      ) : (
        <Rewind className="h-8 w-8 mr-2" />
      )}
      <div className="text-xl font-semibold">{seconds}s</div>
    </div>
  );
};

interface OverlayManagerProps {
  player: any; // VideoJS player instance
  className?: string;
}

export const OverlayManager: React.FC<OverlayManagerProps> = ({
  player,
  className
}) => {
  const [volumeVisible, setVolumeVisible] = useState(false);
  const [volume, setVolume] = useState(1);
  const [seekVisible, setSeekVisible] = useState(false);
  const [seekDirection, setSeekDirection] = useState<'forward' | 'backward'>('forward');
  const [seekSeconds, setSeekSeconds] = useState(0);

  useEffect(() => {
    if (!player) return;

    // Volume change handler
    const handleVolumeChange = () => {
      try {
        // Check if volume method exists
        if (typeof player.volume === 'function') {
          const newVolume = player.volume();
          setVolume(newVolume);
          setVolumeVisible(true);

          // Hide after 1.5 seconds
          setTimeout(() => {
            setVolumeVisible(false);
          }, 1500);
        }
      } catch (e) {
        console.error('Error in volume change handler:', e);
      }
    };

    // Seeking handler
    const handleSeeking = () => {
      try {
        // This will be triggered by the custom seek events we'll add
        setSeekVisible(true);

        // Hide after 1.5 seconds
        setTimeout(() => {
          setSeekVisible(false);
        }, 1500);
      } catch (e) {
        console.error('Error in seeking handler:', e);
      }
    };

    // Add event listeners with error handling
    try {
      // Check if the player has event handling methods
      if (typeof player.on === 'function') {
        player.on('volumechange', handleVolumeChange);
        player.on('customseek', handleSeeking);

        // Clean up function
        return () => {
          try {
            if (typeof player.off === 'function') {
              player.off('volumechange', handleVolumeChange);
              player.off('customseek', handleSeeking);
            }
          } catch (e) {
            console.error('Error removing event listeners:', e);
          }
        };
      } else {
        // For players without event handling, set up a manual volume display
        // This is a fallback for Cloudinary player or other players
        console.log('Player does not support event handling, using fallback');

        // Try to get initial volume
        if (typeof player.volume === 'function') {
          setVolume(player.volume());
        }

        // No cleanup needed for this case
        return undefined;
      }
    } catch (e) {
      console.error('Error setting up event listeners:', e);
      return undefined;
    }
  }, [player]);

  // Method to show seek overlay (to be called from VideoJsPlayer)
  const showSeekOverlay = (seconds: number, direction: 'forward' | 'backward') => {
    setSeekDirection(direction);
    setSeekSeconds(seconds);
    setSeekVisible(true);

    // Hide after 1.5 seconds
    setTimeout(() => {
      setSeekVisible(false);
    }, 1500);
  };

  // Expose the method to the parent component with error handling
  try {
    if (player) {
      player.showSeekOverlay = showSeekOverlay;
    }
  } catch (e) {
    console.error('Error exposing showSeekOverlay method:', e);
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <VolumeOverlay volume={volume} visible={volumeVisible} />
      <SeekOverlay
        seconds={seekSeconds}
        direction={seekDirection}
        visible={seekVisible}
      />
    </div>
  );
};
