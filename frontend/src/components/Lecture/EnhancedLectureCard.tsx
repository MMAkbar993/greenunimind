import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  FileText,
  Clock,
  Eye,
  Edit,
  Play,
  Download,
  MoreHorizontal,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Star,
  Settings,
  Headphones,
  FileType
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/formatDuration';

interface Lecture {
  _id: string;
  lectureTitle: string;
  description?: string;
  videoUrl?: string;
  audioUrl?: string;
  articleContent?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  order: number;
  isPreviewFree?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface EnhancedLectureCardProps {
  lecture: Lecture;
  index: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  showActions?: boolean;
  variant?: 'student' | 'teacher';
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
  onDownload?: () => void;
  className?: string;
}

const EnhancedLectureCard: React.FC<EnhancedLectureCardProps> = ({
  lecture,
  index,
  isCompleted = false,
  isLocked = false,
  showActions = true,
  variant = 'teacher',
  onPlay,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getContentType = () => {
    const hasVideo = !!lecture.videoUrl;
    const hasAudio = !!lecture.audioUrl;
    const hasArticle = !!lecture.articleContent?.trim();
    const hasPdf = !!lecture.pdfUrl;
    if (hasVideo && (hasAudio || hasArticle || hasPdf)) return 'mixed';
    if (hasVideo) return 'video';
    if (hasAudio) return 'audio';
    if (hasArticle) return 'article';
    if (hasPdf) return 'pdf';
    return 'empty';
  };

  const contentType = getContentType();

  const getStatusColor = (status: string) => {
    if (isCompleted) return "bg-green-100 text-green-800 border-green-200";
    if (isLocked) return "bg-gray-100 text-gray-800 border-gray-200";
    if (lecture.isPreviewFree) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getStatusText = () => {
    if (isCompleted) return "Completed";
    if (isLocked) return "Locked";
    if (lecture.isPreviewFree) return "Preview";
    return "Available";
  };

  const formatDurationDisplay = (duration?: number) => {
    if (!duration) return "N/A";
    return formatDuration(duration);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 border-2 hover:border-blue-500/20",
        isExpanded && "ring-2 ring-blue-500/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Lecture Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
        {lecture.thumbnailUrl ? (
          <img
            src={lecture.thumbnailUrl}
            alt={lecture.lectureTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-3 mx-auto">
                {contentType === 'video' && <Video className="w-8 h-8 text-white" />}
                {contentType === 'audio' && <Headphones className="w-8 h-8 text-white" />}
                {contentType === 'article' && <FileType className="w-8 h-8 text-white" />}
                {contentType === 'pdf' && <FileText className="w-8 h-8 text-white" />}
                {contentType === 'mixed' && (
                  <div className="flex gap-1">
                    <Video className="w-6 h-6 text-white" />
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                )}
                {contentType === 'empty' && <div className="w-8 h-8 bg-white/30 rounded-full" />}
              </div>
              <div className="text-white/90 text-sm font-medium">
                Lecture {index + 1}
              </div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <Badge
          className={cn(
            "absolute top-3 left-3 border",
            getStatusColor(getStatusText())
          )}
        >
          {getStatusText()}
        </Badge>

        {/* Quick Actions Overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              variant === 'student' ? onPlay?.() : onPreview?.();
            }}
            disabled={isLocked}
            className="bg-white/90 hover:bg-white text-gray-900"
          >
            <Play className="w-4 h-4 mr-1" />
            {variant === 'student' ? 'Watch' : 'Preview'}
          </Button>
          {variant === 'teacher' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="bg-white/90 hover:bg-white text-gray-900"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
              {lecture.lectureTitle}
            </h3>
            {lecture.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {lecture.description}
              </p>
            )}
          </div>

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
              {onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              {variant === 'teacher' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Lecture
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Lecture Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-sm font-medium text-blue-600 mr-1">#</span>
              <span className="text-sm font-medium">{index + 1}</span>
            </div>
            <p className="text-xs text-gray-500">Order</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-sm font-medium">
                {formatDurationDisplay(lecture.duration)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Duration</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-sm font-medium">
                {getStatusText()}
              </span>
            </div>
            <p className="text-xs text-gray-500">Status</p>
          </div>
        </div>

        {/* Primary Actions */}
        {showActions && (
          <div className="flex gap-2 mb-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                variant === 'student' ? onPlay?.() : onPreview?.();
              }}
              disabled={isLocked}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Play className="w-4 h-4 mr-1" />
              {variant === 'student' ? 'Watch' : 'Preview'}
            </Button>

            {variant === 'teacher' && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                variant="outline"
                className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}

        {/* Expandable Section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-gray-600 hover:text-gray-900"
        >
          <span className="text-sm">
            {isExpanded ? 'Less details' : 'More details'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Content Type:</span>
              <Badge variant="outline" className="text-xs">
                {contentType === 'mixed' ? 'Multiple' :
                 contentType === 'video' ? 'Video' :
                 contentType === 'audio' ? 'Audio' :
                 contentType === 'article' ? 'Article' :
                 contentType === 'pdf' ? 'PDF' : 'Empty'}
              </Badge>
            </div>

            {lecture.isPreviewFree && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Preview:</span>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  Free Preview Available
                </Badge>
              </div>
            )}

            {lecture.createdAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">
                  {new Date(lecture.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {lecture.updatedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900">
                  {new Date(lecture.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedLectureCard;
