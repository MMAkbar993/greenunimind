/**
 * Cloudinary Streaming Utilities
 *
 * This file contains utilities for working with Cloudinary's adaptive streaming features.
 */

/**
 * Generates an HLS streaming URL from a Cloudinary video URL
 *
 * @param url The original Cloudinary video URL
 * @returns The HLS streaming URL
 */
export const getHlsUrl = (url: string): string => {
  if (!url) return '';

  // Check if this is already an HLS URL
  if (url.includes('.m3u8') || url.includes('streaming_upload')) {
    return url;
  }

  // Check if this is a Cloudinary URL
  if (url.includes('cloudinary.com')) {
    // Replace the file extension with m3u8 for HLS streaming
    return url.replace(/\.(mp4|mov|webm|mkv|avi)/, '.m3u8');
  }

  // Return the original URL if it's not a Cloudinary URL
  return url;
};

/**
 * Generates a DASH streaming URL from a Cloudinary video URL
 *
 * @param url The original Cloudinary video URL
 * @returns The DASH streaming URL
 */
export const getDashUrl = (url: string): string => {
  if (!url) return '';

  // Check if this is already a DASH URL
  if (url.includes('.mpd') || url.includes('streaming_upload')) {
    return url;
  }

  // Check if this is a Cloudinary URL
  if (url.includes('cloudinary.com')) {
    // Replace the file extension with mpd for DASH streaming
    return url.replace(/\.(mp4|mov|webm|mkv|avi)/, '.mpd');
  }

  // Return the original URL if it's not a Cloudinary URL
  return url;
};

/**
 * Generates a Cloudinary video URL with adaptive streaming transformation
 *
 * @param publicId The Cloudinary public ID of the video
 * @param options Options for the transformation
 * @returns The transformed URL
 */
export const getAdaptiveStreamingUrl = (
  publicId: string,
  options: {
    cloudName?: string;
    maxWidth?: number;
    maxHeight?: number;
    format?: 'hls' | 'dash';
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
    streamingProfile?: 'auto' | 'auto:maxres' | 'full_hd' | 'hd' | 'sd';
    dpr?: 'auto' | number;
    enableCache?: boolean;
  } = {}
): string => {
  if (!publicId) return '';

  const {
    cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'hls',
    quality = 'auto',
    streamingProfile = 'auto:maxres',
    dpr = 'auto',
    enableCache = true
  } = options;

  if (!cloudName) {
    console.error('Cloudinary cloud name is required');
    return '';
  }

  // Base URL
  const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;

  // Transformation for adaptive streaming with quality settings
  const transformation = `sp_${streamingProfile}/q_${quality}/w_${maxWidth},h_${maxHeight},c_limit`;

  // File extension based on format
  const extension = format === 'hls' ? 'm3u8' : 'mpd';

  // Add DPR parameter
  const dprParam = dpr === 'auto' ? 'dpr_auto' : `dpr_${dpr}`;

  // Add cache control parameters if enabled
  let cacheParam = '';
  if (enableCache) {
    // Add a timestamp that changes only once per day to improve caching
    // but still allow for updates
    const dailyTimestamp = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    cacheParam = `/_t_${dailyTimestamp}`;
  }

  // Construct the URL with all parameters
  return `${baseUrl}/${transformation},${dprParam}${cacheParam}/${publicId}.${extension}`;
};

/**
 * Checks if a URL is a streaming URL (HLS or DASH)
 *
 * @param url The URL to check
 * @returns True if the URL is a streaming URL
 */
export const isStreamingUrl = (url: string): boolean => {
  if (!url) return false;

  return url.includes('.m3u8') ||
         url.includes('.mpd') ||
         url.includes('streaming_upload') ||
         url.includes('sp_auto');
};

/**
 * Generates a poster image URL from a Cloudinary video URL
 *
 * @param url The Cloudinary video URL
 * @returns The poster image URL
 */
export const getPosterUrl = (url: string): string => {
  if (!url) return '';

  // Check if this is a Cloudinary URL
  if (url.includes('cloudinary.com')) {
    // Replace video with image and the file extension with jpg
    const posterUrl = url
      .replace('/video/', '/image/')
      .replace(/\.(mp4|mov|webm|mkv|avi|m3u8|mpd)/, '.jpg');

    // Add transformation for the poster image
    return posterUrl.replace('/upload/', '/upload/w_1280,h_720,c_fill,q_auto,f_auto/');
  }

  // Return empty string if it's not a Cloudinary URL
  return '';
};

/**
 * Interface for Cloudinary video transformation options
 */
export interface CloudinaryVideoOptions {
  cloudName?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
  format?: 'hls' | 'dash' | 'mp4';
  streamingProfile?: 'auto' | 'auto:maxres' | 'full_hd' | 'hd' | 'sd';
  dpr?: 'auto' | number;
  enableCache?: boolean;
  bufferAhead?: number;
}

/**
 * Generates a Cloudinary video URL with transformations
 *
 * @param publicId The Cloudinary public ID of the video
 * @param options Options for the transformation
 * @returns The transformed URL
 */
export const getTransformedVideoUrl = (
  publicId: string,
  options: CloudinaryVideoOptions = {}
): string => {
  if (!publicId) return '';

  const {
    cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 'auto',
    format = 'hls',
    streamingProfile = 'auto:maxres',
    dpr = 'auto',
    enableCache = true
  } = options;

  if (!cloudName) {
    console.error('Cloudinary cloud name is required');
    return '';
  }

  // Base URL
  const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;

  // Quality transformation
  const qualityTransform = quality === 'auto' ? 'q_auto' : `q_${quality}`;

  // Streaming profile for adaptive streaming
  const streamingTransform = format === 'mp4' ? '' : `/sp_${streamingProfile}`;

  // DPR parameter
  const dprParam = dpr === 'auto' ? 'dpr_auto' : `dpr_${dpr}`;

  // Transformation for video
  const transformation = `${qualityTransform}${streamingTransform}/w_${maxWidth},h_${maxHeight},c_limit,${dprParam}`;

  // File extension based on format
  let extension: string;
  if (format === 'mp4') {
    extension = 'mp4';
  } else {
    extension = format === 'hls' ? 'm3u8' : 'mpd';
  }

  // Add cache control parameters if enabled
  let cacheParam = '';
  if (enableCache) {
    // Add a timestamp that changes only once per day to improve caching
    const dailyTimestamp = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    cacheParam = `/_t_${dailyTimestamp}`;
  }

  // Construct the URL
  return `${baseUrl}/${transformation}${cacheParam}/${publicId}.${extension}`;
};

/**
 * Gets the optimal streaming URL for a video based on device capabilities
 *
 * @param publicId The Cloudinary public ID of the video
 * @param options Options for the transformation
 * @returns The optimal streaming URL
 */
export const getOptimalStreamingUrl = (
  publicId: string,
  options: CloudinaryVideoOptions = {}
): string => {
  // Check if the browser supports HLS natively (Safari)
  const supportsHlsNatively = typeof document !== 'undefined' &&
    document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== '';

  // Check if the browser supports MSE (needed for hls.js)
  const supportsMSE = typeof window !== 'undefined' &&
    'MediaSource' in window;

  // Determine the best format based on browser capabilities
  let format: 'hls' | 'dash' | 'mp4' = 'mp4'; // Default to MP4 as fallback

  if (supportsHlsNatively || supportsMSE) {
    format = 'hls'; // Use HLS if supported (either natively or via hls.js)
  } else if (supportsMSE) {
    format = 'dash'; // Use DASH as second choice if MSE is supported
  }

  // Get the transformed URL with the optimal format
  return getTransformedVideoUrl(publicId, {
    ...options,
    format
  });
};
