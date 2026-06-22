import { useEffect, useRef } from 'react';

interface PreloadedVideo {
  src: string;
  loaded: boolean;
  element: HTMLVideoElement;
  timestamp: number;
}

// Global cache for preloaded videos
const preloadedVideos = new Map<string, PreloadedVideo>();

// Clean up old preloaded videos (older than 5 minutes)
const cleanupOldVideos = () => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  preloadedVideos.forEach((video, key) => {
    if (now - video.timestamp > maxAge) {
      video.element.src = '';
      preloadedVideos.delete(key);
    }
  });
};

/**
 * Hook to preload videos for smoother playback
 * @param src Current video source
 * @param nextSrc Next video source to preload
 * @param preloadStrategy Preload strategy ('auto', 'metadata', 'none')
 */
export const useVideoPreload = (
  src: string,
  nextSrc?: string,
  preloadStrategy: 'auto' | 'metadata' | 'none' = 'auto'
) => {
  const preloadRef = useRef<HTMLVideoElement | null>(null);
  
  useEffect(() => {
    // Skip if no next source or preload is disabled
    if (!nextSrc || preloadStrategy === 'none' || nextSrc === src) {
      return;
    }
    
    // Clean up old videos
    cleanupOldVideos();
    
    // Check if video is already preloaded
    if (preloadedVideos.has(nextSrc)) {
      return;
    }
    
    // Create a new video element for preloading
    const preloadVideo = document.createElement('video');
    preloadVideo.style.display = 'none';
    preloadVideo.preload = preloadStrategy;
    preloadVideo.muted = true;
    preloadVideo.crossOrigin = 'anonymous';
    
    // Add to DOM temporarily
    document.body.appendChild(preloadVideo);
    
    // Handle load events
    const handleLoaded = () => {
      if (preloadedVideos.has(nextSrc)) {
        preloadedVideos.get(nextSrc)!.loaded = true;
      }
    };
    
    preloadVideo.addEventListener('loadedmetadata', handleLoaded);
    
    // Set source and start loading
    preloadVideo.src = nextSrc;
    
    // Store in cache
    preloadedVideos.set(nextSrc, {
      src: nextSrc,
      loaded: false,
      element: preloadVideo,
      timestamp: Date.now()
    });
    
    preloadRef.current = preloadVideo;
    
    // Clean up
    return () => {
      preloadVideo.removeEventListener('loadedmetadata', handleLoaded);
      document.body.removeChild(preloadVideo);
    };
  }, [nextSrc, preloadStrategy, src]);
  
  // Return the preloaded video if available
  const getPreloadedVideo = (videoSrc: string): HTMLVideoElement | null => {
    const preloaded = preloadedVideos.get(videoSrc);
    if (preloaded && preloaded.loaded) {
      return preloaded.element;
    }
    return null;
  };
  
  return { getPreloadedVideo };
};
