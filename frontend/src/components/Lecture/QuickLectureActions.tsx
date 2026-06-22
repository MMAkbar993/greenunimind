import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Video, BookOpen, Eye, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ICourse } from '@/types/course';

interface QuickLectureActionsProps {
  course: ICourse;
  variant?: 'button' | 'dropdown' | 'inline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLectureCount?: boolean;
  className?: string;
}

const QuickLectureActions: React.FC<QuickLectureActionsProps> = ({
  course,
  variant = 'button',
  size = 'default',
  showLectureCount = true,
  className,
}) => {
  const navigate = useNavigate();

  const lectureCount = course.lectures?.length || 0;

  const handleCreateLecture = () => {
    navigate(`/teacher/courses/${course._id}/lecture/create`);
  };

  const handleViewLectures = () => {
    navigate(`/teacher/courses/${course._id}/manage?tab=lectures`);
  };

  const handleEditCourse = () => {
    navigate(`/teacher/courses/edit-course/${course._id}`);
  };

  if (variant === 'button') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={handleCreateLecture}
          size={size}
          className="bg-brand-primary hover:bg-brand-primary-dark text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lecture
        </Button>
        
        {showLectureCount && lectureCount > 0 && (
          <Button
            variant="outline"
            size={size}
            onClick={handleViewLectures}
          >
            <Video className="h-4 w-4 mr-2" />
            View Lectures
            <Badge variant="secondary" className="ml-2">
              {lectureCount}
            </Badge>
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Course Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleCreateLecture}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lecture
          </DropdownMenuItem>
          
          {lectureCount > 0 && (
            <DropdownMenuItem onClick={handleViewLectures}>
              <Video className="h-4 w-4 mr-2" />
              View Lectures ({lectureCount})
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleEditCourse}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate(`/courses/${course._id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Course
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreateLecture}
          className="text-brand-primary hover:text-brand-primary-dark hover:bg-brand-accent"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Lecture
        </Button>
        
        {lectureCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewLectures}
            className="text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            {lectureCount} lecture{lectureCount !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default QuickLectureActions;
