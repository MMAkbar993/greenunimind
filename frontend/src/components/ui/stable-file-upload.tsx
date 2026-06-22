import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CloudUpload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StableFileUploadProps {
  value?: File;
  onValueChange?: (file: File | undefined) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
}

export const StableFileUpload: React.FC<StableFileUploadProps> = ({
  value,
  onValueChange,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  disabled = false,
  placeholder = "Upload Course Thumbnail",
  description = "Drag and drop or browse files"
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
    }
    
    if (accept && !accept.includes(file.type.split('/')[0]) && !accept.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    
    return null;
  }, [maxSize, accept]);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onValueChange?.(file);
  }, [validateFile, onValueChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    handleFileChange(e.dataTransfer.files);
  }, [disabled, handleFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileChange]);

  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleRemoveFile = useCallback(() => {
    setError(null);
    onValueChange?.(undefined);
  }, [onValueChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-blue-200 hover:border-blue-300 bg-blue-50/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleBrowseClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <CloudUpload className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {placeholder}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {description}{' '}
              <Button variant="link" className="p-0 h-auto text-blue-600" type="button">
                browse files
              </Button>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Recommended: 1280x720px, Max {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* File Preview */}
      {value && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {value.type.startsWith('image/') && (
                <img
                  src={URL.createObjectURL(value)}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                  onLoad={(e) => {
                    // Clean up object URL to prevent memory leaks
                    URL.revokeObjectURL((e.target as HTMLImageElement).src);
                  }}
                />
              )}
              <div>
                <p className="font-medium text-sm text-gray-900">{value.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(value.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              disabled={disabled}
              type="button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
