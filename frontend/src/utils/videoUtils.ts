/**
 * Optimizes a Cloudinary URL for better video streaming
 * @param url Original Cloudinary URL
 * @param options Options for optimization
 * @returns Optimized URL
 */
export const optimizeCloudinaryUrl = (
  url: string,
  options: {
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
    streaming?: 'auto' | 'sd' | 'hd' | 'full_hd' | '4k' | 'maxres' | 'auto:maxres';
    dpr?: 'auto' | number;
    enableCache?: boolean;
    chunkSize?: number;
    fetchFormat?: 'auto' | 'mp4' | 'webm';
  } = {}
): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Clean the URL first - remove any duplicate extensions and trailing spaces
  let cleanedUrl = url.trim()
    .replace(/\.mp4\.mp4/g, '.mp4')
    .replace(/\.m3u8\.m3u8/g, '.m3u8')
    .replace(/\.mp4\.m3u8/g, '.m3u8');

  // Check if URL is valid
  try {
    new URL(cleanedUrl);
  } catch (e) {
    console.warn('Invalid URL format:', url);
    return url;
  }

  try {
    // For Cloudinary URLs, we'll try to add streaming profile for better playback
    // Extract the base URL, transformations, version and public ID

    // Check if this is an HLS URL
    const isHls = cleanedUrl.includes('.m3u8') ||
                 cleanedUrl.includes('f_m3u8') ||
                 cleanedUrl.includes('sp_hd');

    // Default extension based on URL type
    const defaultExt = isHls ? '.m3u8' : '.mp4';

    // More flexible regex to handle different Cloudinary URL formats
    const regex = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)([^/]*)\/?((v\d+\/)?[^.]+)(\.[^.]+)?$/;
    const match = cleanedUrl.match(regex);

    if (!match) {
      // Try alternative regex for URLs without version number
      const altRegex = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)([^/]*)\/?([^.]+)(\.[^.]+)?$/;
      const altMatch = cleanedUrl.match(altRegex);

      if (!altMatch) {
        // If still no match, return the original URL but don't log an error
        return cleanedUrl;
      }

      // Use the alternative match
      const [, baseUrl, transformations, publicId, extension] = altMatch;
      const ext = extension || defaultExt;

      // Process the URL with the alternative match
      const hasStreamingProfile = transformations.includes('sp_');
      const hasQuality = transformations.includes('q_');

      let newTransformations = transformations;

      // For HLS URLs, use sp_hd instead of sp_auto:maxres to avoid errors
      const streamingProfile = isHls ? 'hd' : (options.streaming || 'auto');

      // Add streaming profile if not present and not an HLS URL with sp_hd already
      if (!hasStreamingProfile && options.streaming && !(isHls && transformations.includes('sp_hd'))) {
        newTransformations += (newTransformations ? ',' : '') + `sp_${streamingProfile}`;
      }

      // Add quality if not present
      if (!hasQuality && options.quality) {
        newTransformations += (newTransformations ? ',' : '') + `q_${options.quality || 'auto'}`;
      }

      // Construct the new URL
      const optimizedUrl = `${baseUrl}${newTransformations ? newTransformations + '/' : ''}${publicId}${ext}`;
      console.log('Optimized Cloudinary URL:', optimizedUrl);
      return optimizedUrl;
    }

    const [, baseUrl, transformations, versionAndPublicId, , extension] = match;
    const ext = extension || defaultExt;

    // Add streaming profile if not already present
    const hasStreamingProfile = transformations.includes('sp_');
    const hasQuality = transformations.includes('q_');

    let newTransformations = transformations;

    // For HLS URLs, use sp_hd instead of sp_auto:maxres to avoid errors
    const streamingProfile = isHls ? 'hd' : (options.streaming || 'auto');

    // Add streaming profile if not present and not an HLS URL with sp_hd already
    if (!hasStreamingProfile && options.streaming && !(isHls && transformations.includes('sp_hd'))) {
      newTransformations += (newTransformations ? ',' : '') + `sp_${streamingProfile}`;
    }

    // Add quality if not present
    if (!hasQuality && options.quality) {
      newTransformations += (newTransformations ? ',' : '') + `q_${options.quality || 'auto'}`;
    }

    // Construct the new URL
    const optimizedUrl = `${baseUrl}${newTransformations ? newTransformations + '/' : ''}${versionAndPublicId}${ext}`;
    console.log('Optimized Cloudinary URL:', optimizedUrl);
    return optimizedUrl;
  } catch (error) {
    // Don't log the error to reduce console noise
    return cleanedUrl;
  }
};

/**
 * Detects if a URL is an HLS stream
 * @param url URL to check
 * @returns True if URL is an HLS stream
 */
export const isHlsStream = (url: string): boolean => {
  if (!url) return false;

  // Clean the URL first to avoid false negatives due to duplicate extensions
  const cleanedUrl = url.trim()
    .replace(/\.mp4\.mp4/g, '.mp4')
    .replace(/\.m3u8\.m3u8/g, '.m3u8')
    .replace(/\.mp4\.m3u8/g, '.m3u8');

  // Check for explicit HLS indicators
  if (cleanedUrl.endsWith('.m3u8') ||
      cleanedUrl.includes('playlist.m3u8') ||
      cleanedUrl.includes('/manifest.m3u8')) {
    return true;
  }

  // Check for Cloudinary streaming profile indicators - more comprehensive check
  if (cleanedUrl.includes('cloudinary.com')) {
    // Check for streaming profile in URL path
    if (cleanedUrl.includes('/sp_hd/') ||
        cleanedUrl.includes('/sp_full_hd/') ||
        cleanedUrl.includes('/sp_4k/') ||
        cleanedUrl.includes('/sp_auto/') ||
        cleanedUrl.includes('/sp_auto:maxres/')) {
      return true;
    }

    // Check for streaming profile in URL parameters
    if (cleanedUrl.includes('sp=hd') ||
        cleanedUrl.includes('sp=full_hd') ||
        cleanedUrl.includes('sp=4k') ||
        cleanedUrl.includes('sp=auto') ||
        cleanedUrl.includes('sp=auto:maxres') ||
        cleanedUrl.includes('sp_hd') ||
        cleanedUrl.includes('sp_full_hd') ||
        cleanedUrl.includes('sp_4k') ||
        cleanedUrl.includes('sp_auto') ||
        cleanedUrl.includes('sp_auto:maxres')) {
      return true;
    }

    // Check for streaming_profile parameter
    if (cleanedUrl.includes('streaming_profile=hd') ||
        cleanedUrl.includes('streaming_profile=full_hd') ||
        cleanedUrl.includes('streaming_profile=4k') ||
        cleanedUrl.includes('streaming_profile=auto')) {
      return true;
    }
  }

  // Check for format=m3u8 parameter
  if (cleanedUrl.includes('f_m3u8') ||
      cleanedUrl.includes('format=m3u8') ||
      cleanedUrl.includes('f=m3u8')) {
    return true;
  }

  // Check for HLS-specific query parameters
  if (cleanedUrl.includes('playlist_type=') ||
      cleanedUrl.includes('segment_time=') ||
      cleanedUrl.includes('hls=true') ||
      cleanedUrl.includes('hls=1')) {
    return true;
  }

  return false;
};

/**
 * Extracts video ID from a Cloudinary URL
 * @param url Cloudinary URL
 * @returns Video ID
 */
export const getCloudinaryVideoId = (url: string): string | null => {
  if (!url.includes('cloudinary.com')) {
    return null;
  }

  // Extract video ID from URL
  const match = url.match(/\/v\d+\/([^/]+)\./);
  if (match && match[1]) {
    return match[1];
  }

  return null;
};

/**
 * Generates quality variants for a Cloudinary video
 * @param url Base Cloudinary URL
 * @returns Array of quality options
 */
export const generateCloudinaryQualities = (url: string): { label: string; src: string }[] => {
  if (!url || !url.includes('cloudinary.com')) {
    return [];
  }

  // Clean the URL first
  const cleanedUrl = url.trim()
    .replace(/\.mp4\.mp4/g, '.mp4')
    .replace(/\.m3u8\.m3u8/g, '.m3u8')
    .replace(/\.mp4\.m3u8/g, '.m3u8');

  // Determine if this is an HLS URL
  const isHls = isHlsStream(cleanedUrl);

  // Extract base URL and public ID
  const match = cleanedUrl.match(/(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*?)\/([^/.]+)(\.[^.]+)?$/);
  if (!match) {
    console.log('Could not parse Cloudinary URL, returning original only');
    return [{ label: 'auto', src: cleanedUrl }];
  }

  const [, baseUrl, , publicId, extension] = match; // Skip transformations
  const format = isHls ? 'm3u8' : (extension?.substring(1) || 'mp4');

  // For HLS, we should use the streaming profile
  if (isHls) {
    return [
      { label: 'auto (adaptive)', src: `${baseUrl}sp_hd/${publicId}.${format}` }
    ];
  }

  // For MP4, create quality variants
  return [
    { label: 'auto', src: cleanedUrl },
    { label: '1080p', src: `${baseUrl}h_1080,q_auto/${publicId}.mp4` },
    { label: '720p', src: `${baseUrl}h_720,q_auto/${publicId}.mp4` },
    { label: '480p', src: `${baseUrl}h_480,q_auto/${publicId}.mp4` },
    { label: '360p', src: `${baseUrl}h_360,q_auto/${publicId}.mp4` }
  ];
};

/**
 * Converts an array of VideoResolution objects to quality options for the video player
 * @param videoResolutions Array of VideoResolution objects from the backend
 * @param defaultUrl Fallback URL if no resolutions are provided
 * @returns Array of quality options
 */
export const convertResolutionsToQualityOptions = (
  videoResolutions?: Array<{ url: string; quality: string; format?: string }>,
  defaultUrl?: string
): { label: string; src: string }[] => {
  if (!videoResolutions || videoResolutions.length === 0) {
    return defaultUrl ? [{ label: 'auto', src: defaultUrl }] : [];
  }

  // Map the resolutions to quality options
  return videoResolutions.map(resolution => ({
    label: resolution.quality,
    src: resolution.url
  }));
};

/**
 * Checks if a URL is from Cloudinary
 * @param url URL to check
 * @returns True if URL is from Cloudinary
 */
export const isCloudinaryUrl = (url: string): boolean => {
  if (!url) return false;

  // Clean the URL first
  const cleanedUrl = url.trim();

  // Check if the URL contains cloudinary.com
  return cleanedUrl.includes('cloudinary.com') ||
         cleanedUrl.includes('cloudinary.net') ||
         cleanedUrl.includes('cld.video');
};
