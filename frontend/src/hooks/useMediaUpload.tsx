import { useState, useRef, useEffect } from "react";

interface VideoResolution {
  url: string;
  quality: string; // e.g., '1080p', '720p', '480p', etc.
  format?: string; // e.g., 'mp4', 'webm', etc.
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
  playback_url?: string;
  videoResolutions?: VideoResolution[];
  hlsUrl?: string;
}

interface CloudinaryDeleteResponse {
  result: string;
}

interface WorkerMessage {
  type: string;
  result?: any;
  progress?: number;
  bytesUploaded?: number;
  totalBytes?: number;
  error?: string;
}

type MediaType = "image" | "video" | "raw";

let cloudinaryUploadConfigWarned = false;

/** Cloudinary returns this when the preset is signed-only; client uploads need an Unsigned preset. */
function formatCloudinaryClientError(message: string): string {
  const m = message?.trim() || "Upload failed";
  if (/preset must be whitelisted|whitelisted for unsigned|unsigned uploads/i.test(m)) {
    return `${m} — Fix in Cloudinary Console: Settings → Upload → Upload presets → edit the preset in VITE_CLOUDINARY_PRESET → Signing mode: Unsigned. Enable Video (and Raw if you upload PDF/audio) on that preset.`;
  }
  if (/Invalid extension in transformation/i.test(m)) {
    if (/image\s+video\s+raw|for pdf, audio, files/i.test(m)) {
      return `${m} — The preset "Format" (or similar) field is set to Cloudinary's UI description text ("Image Video Raw (for PDF, audio, files)") instead of a real delivery extension. The API then treats that phrase as an invalid transformation extension. In Console: Upload → Upload presets → edit the preset → clear that Format value or use the proper format controls (e.g. Auto / allow image+video+raw via the intended settings, not pasted help text). Save and retry. Optional: create a new unsigned preset with default format behavior and set VITE_CLOUDINARY_VIDEO_PRESET for video-only uploads.`;
    }
    return `${m} — Check the upload preset in Cloudinary Console (Upload → Upload presets): Incoming / Eager transformations or format rules may be invalid for this asset type. Optional: VITE_CLOUDINARY_VIDEO_PRESET for a separate minimal unsigned video preset.`;
  }
  return m;
}

/** Errors where retrying without streaming_profile may help (not used for invalid-extension / preset-format issues). */
function shouldRetryVideoAfterAdaptiveRejection(message: string): boolean {
  const m = String(message);
  if (/Invalid extension in transformation/i.test(m)) return false;
  return /streaming_profile|streaming profile|eager_async|\beager\b|sp_/i.test(m);
}

export const useMedia = () => {
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [bytesUploaded, setBytesUploaded] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET || '';
  /** Optional: unsigned preset dedicated to video when VITE_CLOUDINARY_PRESET is image-oriented or has bad video transforms (e.g. ml_default). */
  const videoUploadPreset =
    (import.meta.env.VITE_CLOUDINARY_VIDEO_PRESET || uploadPreset || '').trim();
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '';
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || '';

  /** Unsigned uploads only require cloud name + preset (see Cloudinary upload preset). */
  const canUpload = !!(cloudName && uploadPreset);

  useEffect(() => {
    if (!canUpload && !cloudinaryUploadConfigWarned) {
      cloudinaryUploadConfigWarned = true;
      console.warn(
        "Cloudinary upload env not set. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_PRESET to .env. Optional: VITE_CLOUDINARY_VIDEO_PRESET (unsigned video-only preset), VITE_CLOUDINARY_API_SECRET for deleting/replacing existing assets."
      );
    }
  }, [canUpload]);

  // Initialize web worker for video uploads (only when uploads are possible)
  useEffect(() => {
    if (!canUpload) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      return;
    }
    if (!workerRef.current && window.Worker) {
      workerRef.current = new Worker('/worker.js');

      workerRef.current.postMessage({
        type: 'INIT',
        payload: {
          cloudName,
          uploadPreset: videoUploadPreset,
          apiKey,
          chunkSize: 5 * 1024 * 1024 // 5MB chunks
        }
      });
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [canUpload, cloudName, uploadPreset, videoUploadPreset, apiKey]);

  const deleteFromCloudinary = async (publicId: string): Promise<CloudinaryDeleteResponse> => {
    const timestamp = Date.now();
    const signature = await generateSignature(publicId, timestamp);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("signature", signature);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete media: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error deleting media:", err);
      throw new Error("Failed to delete old media file");
    }
  };

  const generateSignature = async (publicId: string, timestamp: number): Promise<string> => {
    // In a real app, you should generate this signature on your backend
    // This is a simplified version for demonstration
    const message = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const uploadToCloudinary = (
    file: File,
    resourceType: MediaType,
    useAdaptiveStreaming: boolean = false
  ): Promise<CloudinaryUploadResponse> => {
    if (!canUpload) {
      return Promise.reject(
        new Error(
          "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_PRESET in your .env file (unsigned upload preset in Cloudinary)."
        )
      );
    }
    // Video uploads use the web worker when available (keeps UI responsive; adaptive flag only affects streaming_profile)
    if (resourceType === "video" && workerRef.current) {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error("Web worker not available"));
          return;
        }

        // Set up message handler for worker responses
        const messageHandler = (event: MessageEvent<WorkerMessage>) => {
          const { type, result, progress, bytesUploaded, totalBytes, error } = event.data;

          switch (type) {
            case 'UPLOAD_PROGRESS':
              if (progress !== undefined) {
                setProgress(progress);
              }
              if (bytesUploaded !== undefined && totalBytes !== undefined) {
                setBytesUploaded(bytesUploaded);
                setTotalBytes(totalBytes);
              }
              break;

            case 'UPLOAD_COMPLETE':
              workerRef.current?.removeEventListener('message', messageHandler);
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
                duration: result.duration,
                videoResolutions: result.videoResolutions,
                hlsUrl: result.videoResolutions?.find((r: VideoResolution) => r.format === 'hls')?.url
              });
              break;

            case 'UPLOAD_ERROR': {
              workerRef.current?.removeEventListener('message', messageHandler);
              const raw =
                typeof error === "string" && error.trim()
                  ? error.trim()
                  : error != null
                    ? String(error)
                    : "";
              reject(new Error(formatCloudinaryClientError(raw || "Upload failed")));
              break;
            }
          }
        };

        // Add event listener for worker messages
        workerRef.current.addEventListener('message', messageHandler);

        // Start the upload with the standard upload API (not chunked)
        workerRef.current.postMessage({
          type: "UPLOAD",
          payload: {
            file,
            options: {
              adaptive: useAdaptiveStreaming,
            },
          },
        });
      });
    }

    // For non-video uploads or when worker is not available, use the standard method
    return new Promise((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        resourceType === "video" ? videoUploadPreset : uploadPreset
      );

      // Only add resource_type for videos
      if (resourceType === 'video') {
        formData.append("resource_type", "video");

        // Add adaptive streaming parameters for videos
        if (useAdaptiveStreaming) {
          // Note: both eager and eager_async are not allowed with unsigned uploads, so we don't add them
          formData.append("streaming_profile", "hd");
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);

      // Set CORS headers if needed
      xhr.withCredentials = false; // Important for CORS

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
          setBytesUploaded(event.loaded);
          setTotalBytes(event.total);
        }
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);

          // Check if Cloudinary returned an error
          if (response.error) {
            console.error("Cloudinary error:", response.error);
            const msg =
              typeof response.error === "object" && response.error !== null && "message" in response.error
                ? String((response.error as { message?: string }).message)
                : String(response.error);
            reject(new Error(formatCloudinaryClientError(msg)));
            return;
          }

          // Process video resolutions if this is a video
          let videoResolutions: VideoResolution[] | undefined;
          let hlsUrl: string | undefined;

          if (resourceType === 'video' && useAdaptiveStreaming) {
            videoResolutions = processVideoResolutions(response);
            const hlsVariant = videoResolutions.find(r => r.format === 'hls');
            if (hlsVariant) {
              hlsUrl = hlsVariant.url;
            }
          }

          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            duration: response.duration,
            playback_url: response.playback_url,
            videoResolutions,
            hlsUrl
          });
        } else {
          // Try to parse the error response
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error?.message) {
              errorMessage = formatCloudinaryClientError(errorResponse.error.message);
            } else {
              errorMessage += `: ${xhr.responseText}`;
            }
            reject(new Error(errorMessage));
          } catch (e) {
            // If we can't parse the response, just use the status
            reject(new Error(errorMessage));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.send(formData);
    });
  };

  /**
   * Process Cloudinary response to extract different resolution URLs
   * @param {Object} result - Cloudinary upload response
   * @returns {Array} - Array of video resolutions
   */
  interface CloudinaryEagerTransformation {
    url: string;
    secure_url?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
  }

  interface CloudinaryResult {
    secure_url: string;
    public_id: string;
    format: string;
    eager?: CloudinaryEagerTransformation[];
    [key: string]: unknown;
  }

  const processVideoResolutions = (result: CloudinaryResult): VideoResolution[] => {
    const resolutions: VideoResolution[] = [];

    // Add the original URL
    resolutions.push({
      url: result.secure_url,
      quality: 'original',
      format: result.format
    });

    // With unsigned uploads, we can't use eager transformations
    // Instead, we'll manually create URLs for different resolutions using Cloudinary's URL transformation API

    // Extract base URL and public ID for transformations
    const baseUrlRoot = result.secure_url.split('/upload/')[0];
    const publicId = result.public_id;
    const format = result.format;

    // Add HLS URL if streaming_profile was used
    const hlsUrl = `${baseUrlRoot}/upload/sp_hd/${publicId}.m3u8`;
    resolutions.push({
      url: hlsUrl,
      quality: 'adaptive',
      format: 'hls'
    });

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
  };

  const uploadMedia = async (
    file: File,
    oldPublicId?: string,
    useAdaptiveStreaming: boolean = true
  ): Promise<CloudinaryUploadResponse> => {
    setProgress(0);
    setBytesUploaded(0);
    setTotalBytes(file.size);
    setError(null);
    setIsUploading(true);

    try {
      // Determine resource type based on file MIME type
      let resourceType: MediaType = "raw"; // Default for PDF and other files
      if (file.type.startsWith("image/")) {
        resourceType = "image";
      } else if (file.type.startsWith("video/")) {
        resourceType = "video";
      }

      // Step 1: Delete old media if exists (requires API secret for signed destroy)
      if (oldPublicId && apiSecret) {
        try {
          await deleteFromCloudinary(oldPublicId);
          console.log("Old media deleted successfully");
        } catch (deleteError) {
          console.warn("Failed to delete old media, proceeding with upload:", deleteError);
          // Continue with upload even if deletion fails
        }
      } else if (oldPublicId && !apiSecret) {
        console.warn("Skipping delete of old media: VITE_CLOUDINARY_API_SECRET is not set");
      }

      // Step 2: Upload new media
      // For videos, use adaptive streaming if requested.
      // Some Cloudinary presets reject streaming transformations on unsigned uploads,
      // so we gracefully retry without adaptive params when that happens.
      const useAdaptive = resourceType === 'video' && useAdaptiveStreaming;
      let uploadedData: CloudinaryUploadResponse;
      try {
        uploadedData = await uploadToCloudinary(file, resourceType, useAdaptive);
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : String(uploadError);
        const shouldRetryWithoutAdaptive =
          resourceType === "video" &&
          useAdaptive &&
          shouldRetryVideoAfterAdaptiveRejection(message);

        if (!shouldRetryWithoutAdaptive) {
          throw uploadError;
        }

        console.warn(
          "Adaptive streaming transformation was rejected by Cloudinary preset. Retrying video upload without adaptive streaming.",
          uploadError
        );
        uploadedData = await uploadToCloudinary(file, resourceType, false);
      }

      setProgress(100);
      setIsUploading(false);
      return uploadedData;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during upload.";
      setError(errorMessage);
      setIsUploading(false);
      throw err instanceof Error ? err : new Error(errorMessage);
    }
  };

  // Return additional information for progress tracking
  return {
    uploadMedia,
    progress,
    isUploading,
    error,
    bytesUploaded,
    totalBytes
  };
};