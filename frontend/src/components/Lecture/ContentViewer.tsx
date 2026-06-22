import React, { useState, useEffect } from 'react';
import { Video, FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoPlayer from './VideoPlayer';
import PDFViewer from './PDFViewer';
import { cn } from '@/lib/utils';
import { ILecture } from '@/types/course';

interface ContentViewerProps {
  lecture: ILecture;
  className?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  autoPlay?: boolean;
  enableDownload?: boolean;
  enablePictureInPicture?: boolean;
  enableKeyboardShortcuts?: boolean;
}

interface ContentType {
  type: 'video' | 'pdf' | 'both' | 'none';
  hasVideo: boolean;
  hasPDF: boolean;
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  lecture,
  className,
  onProgress,
  onComplete,
  autoPlay = false,
  enableDownload = false,
  enablePictureInPicture = true,
  enableKeyboardShortcuts = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>('video');
  const [isLoading, setIsLoading] = useState(true);
  // Reserved for future error handling implementation
  // const [error, setError] = useState<string | null>(null);

  // Determine content types available
  const contentType: ContentType = React.useMemo(() => {
    const hasVideo = !!(lecture.videoUrl || lecture.hlsUrl || lecture.videoResolutions?.length);
    const hasPDF = !!lecture.pdfUrl;

    let type: ContentType['type'] = 'none';
    if (hasVideo && hasPDF) {
      type = 'both';
    } else if (hasVideo) {
      type = 'video';
    } else if (hasPDF) {
      type = 'pdf';
    }

    return { type, hasVideo, hasPDF };
  }, [lecture]);

  // Set default active tab based on available content
  useEffect(() => {
    if (contentType.hasVideo) {
      setActiveTab('video');
    } else if (contentType.hasPDF) {
      setActiveTab('pdf');
    }
    setIsLoading(false);
  }, [contentType]);

  // Handle progress tracking for different content types
  const handleVideoProgress = (currentTime: number, duration: number) => {
    if (onProgress) {
      onProgress(currentTime, duration);
    }
  };

  const handlePDFProgress = (page: number, totalPages: number) => {
    if (onProgress) {
      // Convert page progress to time-like progress for consistency
      const progress = (page / totalPages) * 100;
      onProgress(progress, 100);
    }
  };

  const handleVideoComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Get content summary
  const getContentSummary = () => {
    const items = [];
    
    if (contentType.hasVideo) {
      items.push({
        type: 'video',
        icon: <Video className="w-4 h-4" />,
        label: 'Video Content',
        duration: lecture.duration,
      });
    }
    
    if (contentType.hasPDF) {
      items.push({
        type: 'pdf',
        icon: <FileText className="w-4 h-4" />,
        label: 'PDF Document',
        size: null, // Could be added if available
      });
    }

    return items;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={cn("relative bg-gray-100 rounded-lg overflow-hidden", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (contentType.type === 'none') {
    return (
      <div className={cn("relative bg-gray-100 rounded-lg overflow-hidden", className)}>
        <div className="flex items-center justify-center h-64 text-gray-600">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
              <p className="text-sm text-gray-500">
                This lecture doesn't have any video or PDF content yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single content type - render directly without tabs
  if (contentType.type === 'video' || contentType.type === 'pdf') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Content Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {contentType.type === 'video' ? (
                  <Video className="w-5 h-5 text-brand-primary" />
                ) : (
                  <FileText className="w-5 h-5 text-brand-primary" />
                )}
                <span>{lecture.lectureTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                {lecture.isPreviewFree && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Preview
                  </Badge>
                )}
                {enableDownload && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = contentType.type === 'video' 
                        ? (lecture.videoUrl || lecture.hlsUrl)
                        : lecture.pdfUrl;
                      if (url) {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = lecture.lectureTitle;
                        link.click();
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {contentType.type === 'video' && lecture.duration && (
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {formatDuration(lecture.duration)}
                </span>
              )}
              {contentType.type === 'pdf' && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  PDF Document
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Viewer */}
        {contentType.type === 'video' ? (
          <VideoPlayer
            videoUrl={lecture.videoUrl}
            hlsUrl={lecture.hlsUrl}
            videoResolutions={lecture.videoResolutions}
            title={lecture.lectureTitle}
            duration={lecture.duration}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
            autoPlay={autoPlay}
            poster={lecture.thumbnailUrl}
            enableDownload={enableDownload}
            enablePictureInPicture={enablePictureInPicture}
            enableKeyboardShortcuts={enableKeyboardShortcuts}
            className="aspect-video"
          />
        ) : (
          <PDFViewer
            pdfUrl={lecture.pdfUrl!}
            title={lecture.lectureTitle}
            onProgress={handlePDFProgress}
            enableDownload={enableDownload}
            className="h-[600px]"
          />
        )}

        {/* Lecture Instructions */}
        {lecture.instruction && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lecture Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {lecture.instruction}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Multiple content types - render with tabs
  return (
    <div className={cn("space-y-4", className)}>
      {/* Content Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-brand-primary" />
              <span>{lecture.lectureTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              {lecture.isPreviewFree && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Preview
                </Badge>
              )}
              {enableDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Download current tab content
                    const url = activeTab === 'video' 
                      ? (lecture.videoUrl || lecture.hlsUrl)
                      : lecture.pdfUrl;
                    if (url) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = lecture.lectureTitle;
                      link.click();
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {getContentSummary().map((item, index) => (
              <span key={index} className="flex items-center gap-1">
                {item.icon}
                {item.label}
                {item.duration && ` (${formatDuration(item.duration)})`}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {contentType.hasVideo && (
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
          )}
          {contentType.hasPDF && (
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              PDF
            </TabsTrigger>
          )}
        </TabsList>

        {contentType.hasVideo && (
          <TabsContent value="video" className="mt-4">
            <VideoPlayer
              videoUrl={lecture.videoUrl}
              hlsUrl={lecture.hlsUrl}
              videoResolutions={lecture.videoResolutions}
              title={lecture.lectureTitle}
              duration={lecture.duration}
              onProgress={handleVideoProgress}
              onComplete={handleVideoComplete}
              autoPlay={autoPlay && activeTab === 'video'}
              poster={lecture.thumbnailUrl}
              enableDownload={enableDownload}
              enablePictureInPicture={enablePictureInPicture}
              enableKeyboardShortcuts={enableKeyboardShortcuts}
              className="aspect-video"
            />
          </TabsContent>
        )}

        {contentType.hasPDF && (
          <TabsContent value="pdf" className="mt-4">
            <PDFViewer
              pdfUrl={lecture.pdfUrl!}
              title={lecture.lectureTitle}
              onProgress={handlePDFProgress}
              enableDownload={enableDownload}
              className="h-[600px]"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Lecture Instructions */}
      {lecture.instruction && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lecture Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {lecture.instruction}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentViewer;
