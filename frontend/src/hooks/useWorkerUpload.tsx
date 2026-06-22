import { useState, useEffect, useRef, useCallback } from 'react';

interface StreamingUrl {
  url: string;
  format: string;
  transformation: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
  playback_url?: string;
  streaming_url?: string;
  streaming_urls?: StreamingUrl[];
  adaptive_streaming?: boolean;
  format?: string;
  bytes?: number;
  created_at?: string;
  upload_id?: string;
}

interface ProgressDetail {
  loaded: number;
  total: number;
  mbLoaded: number;
  mbTotal: number;
  percent: number;
}

type MediaType = 'image' | 'video' | 'raw';

interface UseWorkerUploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  useAdaptiveStreaming?: boolean;
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (detail: ProgressDetail) => void;
  onInfo?: (message: string) => void;
}

interface UseWorkerUploadReturn {
  uploadMedia: (file: File, resourceType: MediaType) => Promise<CloudinaryUploadResponse | null>;
  cancelUpload: () => void;
  retryUpload: () => void;
  progress: number;
  progressDetail: ProgressDetail | null;
  isUploading: boolean;
  error: string | null;
  info: string | null;
}

const useWorkerUpload = (options?: UseWorkerUploadOptions): UseWorkerUploadReturn => {
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState<ProgressDetail | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const currentUploadIdRef = useRef<string | null>(null);

  // Get Cloudinary credentials from options or environment variables
  const cloudName = options?.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = options?.uploadPreset || import.meta.env.VITE_CLOUDINARY_PRESET;
  const useAdaptiveStreaming = options?.useAdaptiveStreaming !== undefined ? options.useAdaptiveStreaming : true; // Default to true for videos
  const chunkSize = options?.chunkSize || 10 * 1024 * 1024; // 10MB default chunk size
  const maxRetries = options?.maxRetries || 3;
  const onProgress = options?.onProgress;
  const onInfo = options?.onInfo;

  // Initialize worker
  useEffect(() => {
    // Create worker only in browser environment
    if (typeof window !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/videoUploadWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (err) {
        console.error('Failed to initialize Web Worker:', err);
      }
    }

    // Clean up worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Upload media using worker
  const uploadMedia = useCallback(
    async (file: File, resourceType: MediaType): Promise<CloudinaryUploadResponse | null> => {
      if (!workerRef.current) {
        setError('Web Worker not available');
        return null;
      }

      if (!cloudName || !uploadPreset) {
        setError('Cloudinary credentials not available');
        return null;
      }

      // Reset state
      setProgress(0);
      setProgressDetail(null);
      setError(null);
      setInfo('Preparing upload...');
      setIsUploading(true);

      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          setIsUploading(false);
          setError('Web Worker not available');
          reject(new Error('Web Worker not available'));
          return;
        }

        // Set up message handler
        const handleMessage = (event: MessageEvent) => {
          const {
            type,
            progress: uploadProgress,
            detail: progressDetails,
            data,
            error: uploadError,
            message: infoMessage,
            retryable,
            uploadId
          } = event.data;

          switch (type) {
            case 'progress':
              setProgress(uploadProgress);
              if (progressDetails) {
                setProgressDetail(progressDetails);
                onProgress?.(progressDetails);
              }
              break;
            case 'success':
              setIsUploading(false);
              setProgress(100);
              setInfo('Upload completed successfully!');
              if (uploadId) {
                currentUploadIdRef.current = uploadId;
              }
              resolve(data);
              break;
            case 'error': {
              const msg =
                typeof uploadError === 'string' && uploadError.trim()
                  ? uploadError.trim()
                  : uploadError != null
                    ? String(uploadError)
                    : 'Upload failed';
              setIsUploading(false);
              setError(msg);
              setInfo(retryable ? 'Upload failed. You can retry.' : 'Upload failed permanently.');
              reject(new Error(msg));
              break;
            }
            case 'cancelled':
              setIsUploading(false);
              setInfo('Upload cancelled');
              reject(new Error('Upload cancelled'));
              break;
            case 'info':
              setInfo(infoMessage);
              onInfo?.(infoMessage);
              break;
            default:
              break;
          }
        };

        // Add event listener
        workerRef.current.addEventListener('message', handleMessage);

        // Start upload
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

        // Only use adaptive streaming for video files
        const shouldUseAdaptiveStreaming = resourceType === 'video' && useAdaptiveStreaming;

        workerRef.current.postMessage({
          type: 'upload',
          file,
          url,
          uploadPreset,
          cloudName,
          resourceType,
          useAdaptiveStreaming: shouldUseAdaptiveStreaming,
          chunkSize,
          maxRetries
        });

        // Clean up event listener when done
        return () => {
          if (workerRef.current) {
            workerRef.current.removeEventListener('message', handleMessage);
          }
        };
      });
    },
    [cloudName, uploadPreset, useAdaptiveStreaming, chunkSize, maxRetries, onProgress, onInfo]
  );

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (workerRef.current && isUploading) {
      setInfo('Cancelling upload...');
      workerRef.current.postMessage({ type: 'cancel' });
    } else {
      setInfo('No active upload to cancel');
    }
  }, [isUploading]);

  // Retry upload
  const retryUpload = useCallback(() => {
    if (workerRef.current && !isUploading) {
      setInfo('Retrying upload...');
      workerRef.current.postMessage({
        type: 'retry',
        uploadId: currentUploadIdRef.current
      });
    } else if (isUploading) {
      setInfo('Cannot retry while an upload is in progress');
    } else {
      setInfo('No failed upload to retry');
    }
  }, [isUploading]);

  return {
    uploadMedia,
    cancelUpload,
    retryUpload,
    progress,
    progressDetail,
    isUploading,
    error,
    info
  };
};

export default useWorkerUpload;
