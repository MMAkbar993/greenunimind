import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Play,
  Pause,
  MoreHorizontal,
  GripVertical,
  CheckCircle,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Lecture {
  _id: string;
  lectureTitle: string;
  instruction?: string;
  duration?: number;
  order: number;
  isPublished: boolean;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedLectureManagerProps {
  courseId: string;
  courseTitle: string;
  lectures: Lecture[];
  onCreateLecture: () => void;
  onEditLecture: (lecture: Lecture) => void;
  onDeleteLecture: (lecture: Lecture) => void;
  onReorderLectures: (lectures: Lecture[]) => void;
  className?: string;
}

const EnhancedLectureManager: React.FC<EnhancedLectureManagerProps> = ({
  courseId,
  courseTitle,
  lectures,
  onCreateLecture,
  onEditLecture,
  onDeleteLecture,
  onReorderLectures,
  className
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return lectures.reduce((total, lecture) => total + (lecture.duration || 0), 0);
  };

  const getPublishedCount = () => {
    return lectures.filter(lecture => lecture.isPublished).length;
  };

  const handleDragStart = (e: React.DragEvent, lectureId: string) => {
    setDraggedItem(lectureId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLectureId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetLectureId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = lectures.findIndex(l => l._id === draggedItem);
    const targetIndex = lectures.findIndex(l => l._id === targetLectureId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLectures = [...lectures];
    const [draggedLecture] = newLectures.splice(draggedIndex, 1);
    newLectures.splice(targetIndex, 0, draggedLecture);

    // Update order numbers
    const reorderedLectures = newLectures.map((lecture, index) => ({
      ...lecture,
      order: index + 1
    }));

    onReorderLectures(reorderedLectures);
    setDraggedItem(null);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{courseTitle}</h2>
          <p className="text-gray-600 mt-1">Manage your course lectures</p>
        </div>
        <Button
          onClick={onCreateLecture}
          className="bg-brand-primary hover:bg-brand-primary-dark text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lecture
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{lectures.length}</div>
                <div className="text-sm text-gray-600">Total Lectures</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{getPublishedCount()}</div>
                <div className="text-sm text-gray-600">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(getTotalDuration())}
                </div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round((getPublishedCount() / Math.max(lectures.length, 1)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lectures List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Lectures
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lectures.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No lectures yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start building your course by adding your first lecture.
              </p>
              <Button
                onClick={onCreateLecture}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Lecture
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {lectures
                .sort((a, b) => a.order - b.order)
                .map((lecture, index) => (
                  <div
                    key={lecture._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lecture._id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, lecture._id)}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-move",
                      draggedItem === lecture._id && "opacity-50"
                    )}
                  >
                    {/* Drag Handle */}
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-sm font-medium text-brand-primary">
                        {index + 1}
                      </div>
                    </div>

                    {/* Lecture Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {lecture.lectureTitle}
                        </h4>
                        <Badge
                          variant={lecture.isPublished ? "default" : "secondary"}
                          className={cn(
                            lecture.isPublished 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          )}
                        >
                          {lecture.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      
                      {lecture.instruction && (
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {lecture.instruction}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {lecture.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(lecture.duration)}
                          </span>
                        )}
                        <span>
                          Updated {new Date(lecture.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditLecture(lecture)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hover:bg-green-50 hover:text-green-600"
                      >
                        <Link to={`/teacher/courses/${courseId}/lecture/preview/${lecture._id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditLecture(lecture)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Lecture
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/teacher/courses/${courseId}/lecture/preview/${lecture._id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteLecture(lecture)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedLectureManager;
