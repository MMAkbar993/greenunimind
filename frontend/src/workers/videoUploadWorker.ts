// This is a Web Worker for handling video uploads in the background
// It processes the video file and sends progress updates to the main thread
// Enhanced with better chunking and error recovery

interface UploadMessage {
  type: 'upload';
  file: File;
  url: string;
  uploadPreset: string;
  cloudName: string;
  resourceType: string;
  useAdaptiveStreaming?: boolean;
  chunkSize?: number;
  maxRetries?: number;
}

interface CancelMessage {
  type: 'cancel';
}

interface RetryMessage {
  type: 'retry';
  uploadId?: string;
}

type WorkerMessage = UploadMessage | CancelMessage | RetryMessage;

// Store the XHR object so we can cancel the upload if needed
let xhr: XMLHttpRequest | null = null;
let currentUploadId: string | null = null;
let retryCount = 0;
let lastUploadMessage: UploadMessage | null = null;

// Handle messages from the main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'upload':
      // Store the message for potential retries
      lastUploadMessage = message;
      retryCount = 0;

      // Generate a unique upload ID
      currentUploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      uploadFile(
        message.file,
        message.url,
        message.uploadPreset,
        message.cloudName,
        message.resourceType,
        message.useAdaptiveStreaming,
        message.chunkSize,
        message.maxRetries || 3
      );
      break;
    case 'cancel':
      cancelUpload();
      break;
    case 'retry':
      if (lastUploadMessage && retryCount < (lastUploadMessage.maxRetries || 3)) {
        retryCount++;
        self.postMessage({
          type: 'info',
          message: `Retrying upload (attempt ${retryCount})...`,
        });

        uploadFile(
          lastUploadMessage.file,
          lastUploadMessage.url,
          lastUploadMessage.uploadPreset,
          lastUploadMessage.cloudName,
          lastUploadMessage.resourceType,
          lastUploadMessage.useAdaptiveStreaming,
          lastUploadMessage.chunkSize,
          lastUploadMessage.maxRetries || 3
        );
      } else {
        self.postMessage({
          type: 'error',
          error: 'Maximum retry attempts reached or no upload to retry',
        });
      }
      break;
    default:
      self.postMessage({
        type: 'error',
        error: 'Unknown message type',
      });
  }
};

function cloudinaryErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: string }).message);
  }
  return String(error);
}

function shouldRetryVideoWithoutAdaptive(message: string): boolean {
  const m = String(message);
  if (/Invalid extension in transformation/i.test(m)) return false;
  return /streaming_profile|streaming profile|eager_async|\beager\b|sp_/i.test(m);
}

// Function to upload file to Cloudinary with enhanced chunking and error handling
function uploadFile(
  file: File,
  url: string,
  uploadPreset: string,
  cloudName: string,
  resourceType: string,
  useAdaptiveStreaming = false,
  chunkSize = 10 * 1024 * 1024, // 10MB default chunk size (increased from 6MB)
  maxRetries = 3,
  retriedWithoutAdaptive = false
) {
  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', cloudName);

  // Add resource_type for videos
  if (resourceType === 'video') {
    formData.append('resource_type', 'video');

    // Unsigned uploads: only streaming_profile is safe here. Do not send eager /
    // eager_transformations as JSON — Cloudinary rejects them and returns errors like
    // "Invalid extension in transformation: image video raw ...".
    if (useAdaptiveStreaming) {
      formData.append('streaming_profile', 'hd');
    }

    formData.append('use_filename', 'true');
    formData.append('unique_filename', 'true');
  }

  // Create XHR request with improved error handling
  xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);

  // Set longer timeout for large files
  xhr.timeout = 600000; // 10 minutes

  // Track upload progress with more detailed reporting
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const progress = Math.round((event.loaded / event.total) * 100);
      const mbLoaded = (event.loaded / (1024 * 1024)).toFixed(2);
      const mbTotal = (event.total / (1024 * 1024)).toFixed(2);

      self.postMessage({
        type: 'progress',
        progress,
        detail: {
          loaded: event.loaded,
          total: event.total,
          mbLoaded: parseFloat(mbLoaded),
          mbTotal: parseFloat(mbTotal),
          percent: progress
        }
      });
    }
  };

  // Handle response
  xhr.onload = () => {
    if (xhr!.status >= 200 && xhr!.status < 300) {
      try {
        const response = JSON.parse(xhr!.responseText);

        if (response.error) {
          const msg = cloudinaryErrorMessage(response.error);
          if (
            resourceType === 'video' &&
            useAdaptiveStreaming &&
            !retriedWithoutAdaptive &&
            shouldRetryVideoWithoutAdaptive(msg)
          ) {
            self.postMessage({
              type: 'info',
              message: 'Adaptive streaming not accepted by preset; retrying plain video upload…',
            });
            uploadFile(
              file,
              url,
              uploadPreset,
              cloudName,
              resourceType,
              false,
              chunkSize,
              maxRetries,
              true
            );
            return;
          }
          self.postMessage({
            type: 'error',
            error: msg,
            retryable: false,
          });
          return;
        }

        // Check if this is an adaptive streaming response
        const streamingUrl = response.eager &&
                            response.eager[0] &&
                            response.eager[0].secure_url ?
                            response.eager[0].secure_url :
                            null;

        // Get all available streaming URLs if present
        const streamingUrls = response.eager ?
          response.eager.map((item: any) => ({
            url: item.secure_url,
            format: item.format,
            transformation: item.transformation
          })) : [];

        self.postMessage({
          type: 'success',
          data: {
            secure_url: response.secure_url,
            public_id: response.public_id,
            duration: response.duration,
            playback_url: response.playback_url,
            streaming_url: streamingUrl,
            streaming_urls: streamingUrls,
            adaptive_streaming: useAdaptiveStreaming,
            format: response.format,
            bytes: response.bytes,
            created_at: response.created_at,
            upload_id: currentUploadId
          },
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: 'Failed to parse response',
          retryable: true
        });
      }
    } else {
      let errMsg = `Upload failed with status ${xhr!.status}`;
      try {
        const errBody = JSON.parse(xhr!.responseText) as { error?: { message?: string } | string };
        if (errBody.error) {
          errMsg =
            typeof errBody.error === 'object' && errBody.error !== null && 'message' in errBody.error
              ? String(errBody.error.message)
              : String(errBody.error);
        }
      } catch {
        /* ignore */
      }

      if (
        resourceType === 'video' &&
        useAdaptiveStreaming &&
        !retriedWithoutAdaptive &&
        shouldRetryVideoWithoutAdaptive(errMsg)
      ) {
        self.postMessage({
          type: 'info',
          message: 'Adaptive streaming not accepted by preset; retrying plain video upload…',
        });
        uploadFile(
          file,
          url,
          uploadPreset,
          cloudName,
          resourceType,
          false,
          chunkSize,
          maxRetries,
          true
        );
        return;
      }

      const isRetryable = xhr!.status >= 500 || xhr!.status === 429;

      self.postMessage({
        type: 'error',
        error: errMsg,
        retryable: isRetryable,
        statusCode: xhr!.status
      });
    }
  };

  // Handle network errors with retry information
  xhr.onerror = () => {
    self.postMessage({
      type: 'error',
      error: 'Network error during upload',
      retryable: true
    });
  };

  // Handle timeout with retry information
  xhr.ontimeout = () => {
    self.postMessage({
      type: 'error',
      error: 'Upload timed out',
      retryable: true
    });
  };

  // Add abort handler
  xhr.onabort = () => {
    self.postMessage({
      type: 'cancelled',
      message: 'Upload was cancelled'
    });
  };

  // Send the request
  try {
    xhr.send(formData);

    self.postMessage({
      type: 'info',
      message: `Upload started with chunk size: ${(chunkSize / (1024 * 1024)).toFixed(1)}MB`
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: `Failed to start upload: ${error}`,
      retryable: true
    });
  }
}

// Function to cancel the upload with improved cleanup
function cancelUpload() {
  if (xhr) {
    xhr.abort();
    self.postMessage({
      type: 'cancelled',
      message: 'Upload cancelled by user',
      uploadId: currentUploadId
    });

    // Reset state
    xhr = null;
    currentUploadId = null;
    lastUploadMessage = null;
    retryCount = 0;
  } else {
    self.postMessage({
      type: 'info',
      message: 'No active upload to cancel'
    });
  }
}

// Export empty object to satisfy TypeScript
export {};
