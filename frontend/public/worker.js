// worker.js - Web Worker for handling Cloudinary video uploads in the background
// This worker handles chunked uploads to improve performance and reliability

// Configuration variables that will be set when the worker is initialized
let cloudName = '';
let uploadPreset = '';
let apiKey = '';
let chunkSize = 5 * 1024 * 1024; // 5MB chunks by default

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      // Initialize the worker with configuration
      cloudName = payload.cloudName;
      uploadPreset = payload.uploadPreset;
      apiKey = payload.apiKey;
      if (payload.chunkSize) {
        chunkSize = payload.chunkSize;
      }
      self.postMessage({ type: 'INITIALIZED' });
      break;

    case 'UPLOAD':
      try {
        const result = await uploadVideoWithChunks(payload.file, payload.options);
        self.postMessage({ type: 'UPLOAD_COMPLETE', result });
      } catch (error) {
        self.postMessage({
          type: 'UPLOAD_ERROR',
          error: serializeWorkerError(error),
        });
      }
      break;

    default:
      self.postMessage({ type: 'ERROR', message: 'Unknown command' });
  }
});

function serializeWorkerError(error) {
  if (error instanceof Error) return error.message || String(error);
  if (error && typeof error === 'object') {
    if (error.error && typeof error.error === 'object' && error.error.message) {
      return String(error.error.message);
    }
    if (typeof error.message === 'string') return error.message;
  }
  return String(error != null ? error : 'Upload failed');
}

/**
 * Upload a video file to Cloudinary using direct upload (not chunked)
 * @param {File} file - The video file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary response
 */
async function uploadVideoWithChunks(file, options = {}) {
  const useAdaptive = options.adaptive === true;
  return uploadVideoOnce(file, useAdaptive, false);
}

function shouldRetryVideoWithoutAdaptive(message) {
  const m = String(message);
  // Same error often appears with streaming_profile off — usually upload preset / format config, not adaptive.
  if (/Invalid extension in transformation/i.test(m)) return false;
  return /streaming_profile|streaming profile|eager_async|\beager\b|sp_/i.test(m);
}

function uploadVideoOnce(file, useAdaptive, retriedWithoutAdaptive) {
  // Use the standard upload API instead of chunked upload to avoid CORS issues
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'video');

  // HD streaming profile triggers extra transcoding on Cloudinary (slower end-to-end).
  if (useAdaptive) {
    formData.append('streaming_profile', 'hd');
  }

  // Create an XMLHttpRequest to track upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);

    // Set CORS headers
    xhr.withCredentials = false; // Important for CORS

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        self.postMessage({
          type: 'UPLOAD_PROGRESS',
          progress,
          bytesUploaded: event.loaded,
          totalBytes: event.total
        });
      }
    };

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        let result;
        try {
          result = JSON.parse(xhr.responseText);
        } catch (parseErr) {
          reject(new Error('Invalid response from Cloudinary'));
          return;
        }

        // Check if Cloudinary returned an error
        if (result.error) {
          console.error("Cloudinary error:", result.error);
          const msg = result.error.message || 'Cloudinary upload failed';
          if (useAdaptive && !retriedWithoutAdaptive && shouldRetryVideoWithoutAdaptive(msg)) {
            self.postMessage({
              type: 'UPLOAD_PROGRESS',
              progress: 0,
              bytesUploaded: 0,
              totalBytes: file.size,
            });
            uploadVideoOnce(file, false, true).then(resolve, reject);
            return;
          }
          reject(new Error(msg));
          return;
        }

        const videoResolutions = processVideoResolutions(result, useAdaptive);

        resolve({
          ...result,
          videoResolutions
        });
      } else {
        // Try to parse the error response
        let errorMessage = `Upload failed with status ${xhr.status}`;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.error && errorResponse.error.message) {
            errorMessage = errorResponse.error.message;
          }
        } catch (e) {
          /* keep errorMessage */
        }
        if (useAdaptive && !retriedWithoutAdaptive && shouldRetryVideoWithoutAdaptive(errorMessage)) {
          self.postMessage({
            type: 'UPLOAD_PROGRESS',
            progress: 0,
            bytesUploaded: 0,
            totalBytes: file.size,
          });
          uploadVideoOnce(file, false, true).then(resolve, reject);
          return;
        }
        reject(new Error(errorMessage));
      }
    };

    xhr.onerror = function() {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}

/**
 * Process Cloudinary response to extract different resolution URLs
 * @param {Object} result - Cloudinary upload response
 * @returns {Array} - Array of video resolutions
 */
function processVideoResolutions(result, includeHls) {
  const resolutions = [];

  resolutions.push({
    url: result.secure_url,
    quality: 'original',
    format: result.format
  });

  const baseUrlRoot = result.secure_url.split('/upload/')[0];
  const publicId = result.public_id;
  const format = result.format;

  if (includeHls) {
    const hlsUrl = `${baseUrlRoot}/upload/sp_hd/${publicId}.m3u8`;
    resolutions.push({
      url: hlsUrl,
      quality: 'adaptive',
      format: 'hls'
    });
  }

  // Add derived URLs for different resolutions
  // These URLs are constructed using Cloudinary's transformation parameters
  const baseUrl = `${baseUrlRoot}/upload/`;

  // Common resolutions
  const qualities = [
    { name: '1080p', height: 1080 },
    { name: '720p', height: 720 },
    { name: '480p', height: 480 },
    { name: '360p', height: 360 }
  ];

  qualities.forEach(quality => {
    resolutions.push({
      url: `${baseUrl}h_${quality.height}/${publicId}.${format}`,
      quality: quality.name,
      format
    });
  });

  return resolutions;
}
