import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/utils/toast';
import { Upload, X, Video, Check, AlertCircle, Film, Clapperboard } from 'lucide-react';
import useWorkerUpload from '@/hooks/useWorkerUpload';
import { formatBytes } from '@/utils/uploadMedia';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoUploaderProps {
  onUploadComplete: (url: string, publicId: string, duration?: number, streamingUrl?: string) => void;
  onRemove?: () => void;
  existingUrl?: string;
  className?: string;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete,
  onRemove,
  existingUrl,
  className,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);
  const [useAdaptiveStreaming, setUseAdaptiveStreaming] = useState(true);
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file');
  const [videoUrl, setVideoUrl] = useState('');


  // Use our custom worker upload hook with adaptive streaming
  const { uploadMedia, progress, isUploading, error, cancelUpload } = useWorkerUpload({
    useAdaptiveStreaming: useAdaptiveStreaming,
    chunkSize: 10 * 1024 * 1024 // 10MB chunks for faster uploads
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.includes('video/')) {
      toast.error('Invalid File Type', {
        description: 'Please upload a valid video file.',
      });
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File Too Large', {
        description: 'Video must be less than 500MB.',
      });
      return;
    }

    // Set the file and create a preview URL
    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Clean up the object URL when component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Validate file type
      if (!file.type.includes('video/')) {
        toast.error('Invalid File Type', {
          description: 'Please upload a valid video file.',
        });
        return;
      }

      // Validate file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        toast.error('File Too Large', {
          description: 'Video must be less than 500MB.',
        });
        return;
      }

      // Set the file and create a preview URL
      setVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Handle file upload
  const handleUpload = useCallback(async () => {
    if (uploadTab === 'file' && !videoFile) {
      toast.error('No File Selected', {
        description: 'Please select a video file to upload.',
      });
      return;
    }

    if (uploadTab === 'url' && !videoUrl) {
      toast.error('No URL Provided', {
        description: 'Please enter a valid video URL.',
      });
      return;
    }

    try {
      toast.loading('Upload Started', {
        description: useAdaptiveStreaming ?
          'Your video is being uploaded and prepared for adaptive streaming...' :
          'Your video is being uploaded in the background.',
      });

      if (uploadTab === 'file' && videoFile) {
        // Upload the file using our worker
        const result = await uploadMedia(videoFile, 'video');

        if (result && result.secure_url) {
          toast.success('Upload Complete', {
            description: useAdaptiveStreaming ?
              'Your video has been uploaded and optimized for adaptive streaming.' :
              'Your video has been uploaded successfully.',
          });

          // Call the callback with the upload result
          onUploadComplete(
            result.secure_url,
            result.public_id,
            result.duration,
            result.streaming_url
          );
        }
      } else if (uploadTab === 'url' && videoUrl) {
        // For URL uploads, we just pass the URL directly
        // In a real implementation, you might want to validate the URL or process it
        onUploadComplete(videoUrl, '', undefined, undefined);

        toast.success('URL Added', {
          description: 'The video URL has been added successfully.',
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload Failed', {
        description: error || 'There was a problem uploading your video.',
      });
    }
  }, [videoFile, videoUrl, uploadTab, uploadMedia, onUploadComplete, toast, error, useAdaptiveStreaming]);

  // Handle file removal
  const handleRemove = () => {
    if (isUploading) {
      // Cancel the upload if it's in progress
      cancelUpload();
    }

    setVideoFile(null);
    setPreviewUrl(null);
    setVideoUrl('');

    if (onRemove) {
      onRemove();
    }
  };

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== existingUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, existingUrl]);

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs defaultValue="file" value={uploadTab} onValueChange={(value) => setUploadTab(value as 'file' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="url">Video URL</TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video File</CardTitle>
              <CardDescription>
                Upload a video file from your device. Supported formats: MP4, WebM, MOV.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* File input */}
              <div
                className={`flex items-center justify-center w-full`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <label
                  htmlFor="video-upload"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
                    ${isUploading ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}
                    ${previewUrl ? 'border-green-300 bg-green-50' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {!previewUrl ? (
                      <>
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          MP4, WebM, or MOV (Max. 500MB)
                        </p>
                      </>
                    ) : (
                      <>
                        <Video className="w-10 h-10 mb-3 text-green-500" />
                        <p className="mb-2 text-sm text-green-600 font-medium">
                          {videoFile ? videoFile.name : 'Video selected'}
                        </p>
                        {videoFile && (
                          <p className="text-xs text-gray-500">
                            {formatBytes(videoFile.size)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <input
                    id="video-upload"
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Adaptive streaming option */}
              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  id="adaptive-streaming"
                  checked={useAdaptiveStreaming}
                  onCheckedChange={setUseAdaptiveStreaming}
                  disabled={isUploading}
                />
                <Label htmlFor="adaptive-streaming" className="cursor-pointer">
                  Use adaptive streaming (HLS)
                </Label>
              </div>

              {useAdaptiveStreaming && (
                <p className="text-xs text-gray-500 mt-2">
                  Adaptive streaming automatically adjusts video quality based on the viewer's network speed.
                  This provides the best viewing experience across all devices and network conditions.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  {isUploading ? 'Cancel Upload' : 'Remove'}
                </Button>
              )}

              {previewUrl && !isUploading && (
                <Button
                  type="button"
                  variant="default"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle>Add Video URL</CardTitle>
              <CardDescription>
                Add a URL to an existing video from YouTube, Vimeo, or other sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="video-url">Video URL</Label>
                  <div className="flex">
                    <input
                      id="video-url"
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Supported platforms: YouTube, Vimeo, Cloudinary, or direct MP4/WebM URLs
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {videoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVideoUrl('')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}

              <Button
                type="button"
                variant="default"
                onClick={handleUpload}
                disabled={!videoUrl}
              >
                <Film className="w-4 h-4 mr-2" />
                Add URL
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {useAdaptiveStreaming ? 'Uploading & Processing...' : 'Uploading...'}
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500">
            {useAdaptiveStreaming ?
              'Your video is being uploaded and prepared for adaptive streaming. This may take a few minutes depending on the file size.' :
              'Your video is being uploaded. Please don\'t close this window.'}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center p-3 text-sm text-red-800 rounded-lg bg-red-50">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
