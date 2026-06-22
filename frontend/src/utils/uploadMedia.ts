// src/utils/cloudinaryUpload.ts

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
}

// Generic upload function with progress tracking
export const uploadMedia = (
  resourceType: "image" | "video" | "raw",
  setProgress: (progress: number) => void
): Promise<CloudinaryUploadResponse> => {
  return new Promise((resolve, reject) => {
    if (!window.cloudinary) {
      reject(new Error("Cloudinary widget is not loaded"));
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

    if (!cloudName || !uploadPreset) {
      reject(new Error("Cloudinary environment variables are missing"));
      return;
    }

    const widgetOptions: any = {
      cloudName,
      uploadPreset,
      resourceType,
      sources: ["local", "url", "camera"],
      multiple: false,
      progressCallback: (progress: any) => {
        setProgress(progress);
      },
    };

    if (resourceType === "video") {
      widgetOptions.chunkSize = 6 * 1024 * 1024;
      widgetOptions.maxFileSize = 500 * 1024 * 1024;
    } else if (resourceType === "image") {
      widgetOptions.maxFileSize = 50 * 1024 * 1024;
    } else if (resourceType === "raw") {
      widgetOptions.maxFileSize = 50 * 1024 * 1024;
    }

    const widget = window.cloudinary.createUploadWidget(
      widgetOptions,
      (error: any, result: any) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
          return;
        }

        if (result.event === "success") {
          console.log("Upload Success:", result.info);
          resolve({
            secure_url: result.info.secure_url,
            public_id: result.info.public_id,
          });
        }
      }
    );

    widget.open();
  });
};

// Image upload helper
export const uploadImage = (
  setProgress: (progress: number) => void
): Promise<CloudinaryUploadResponse> => {
  return uploadMedia("image", setProgress);
};

// Video upload helper
export const uploadVideo = (
  setProgress: (progress: number) => void
): Promise<CloudinaryUploadResponse> => {
  return uploadMedia("video", setProgress);
};

// PDF upload helper (now you can upload PDFs)
export const uploadPDF = (
  setProgress: (progress: number) => void
): Promise<CloudinaryUploadResponse> => {
  return uploadMedia("raw", setProgress);
};

// Format file size
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Validates a file type against a list of allowed types
 *
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types
 * @returns True if the file type is allowed
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => file.type.includes(type));
};

/**
 * Validates a file size against a maximum size
 *
 * @param file The file to validate
 * @param maxSizeInBytes The maximum allowed size in bytes
 * @returns True if the file size is within the limit
 */
export const validateFileSize = (file: File, maxSizeInBytes: number): boolean => {
  return file.size <= maxSizeInBytes;
};

/**
 * Gets the file extension from a file name
 *
 * @param fileName The file name
 * @returns The file extension (without the dot)
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Checks if a file is a video file
 *
 * @param file The file to check
 * @returns True if the file is a video
 */
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * Checks if a file is an image file
 *
 * @param file The file to check
 * @returns True if the file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};
