import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Video,
  Edit,
  Trash2,
  Plus,
  Eye,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Star,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ICourse } from '@/types/course';

interface EnhancedCourseCardProps {
  course: ICourse;
  onEdit: () => void;
  onDelete: () => void;
  onCreateLecture: () => void;
  onViewLectures: () => void;
  lectureCount: number;
  className?: string;
}

const EnhancedCourseCard: React.FC<EnhancedCourseCardProps> = ({
  course,
  onEdit,
  onDelete,
  onCreateLecture,
  onViewLectures,
  lectureCount,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-brand-primary/10 border-2 hover:border-brand-primary/20",
        isExpanded && "ring-2 ring-brand-primary/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Course Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-brand-accent to-brand-primary/10">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-brand-primary/40" />
          </div>
        )}
        
        {/* Status Badge */}
        <Badge 
          className={cn(
            "absolute top-3 left-3 border",
            getStatusColor(course.status)
          )}
        >
          {course.status}
        </Badge>

        {/* Quick Actions Overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <Button
            size="sm"
            variant="secondary"
            onClick={onEdit}
            className="bg-white/90 hover:bg-white text-gray-900"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onViewLectures}
            className="bg-white/90 hover:bg-white text-gray-900"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
              {course.title}
            </CardTitle>
            {course.subtitle && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {course.subtitle}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewLectures}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/teacher/courses/${course._id}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Video className="w-4 h-4 text-brand-primary mr-1" />
              <span className="text-sm font-medium">{lectureCount}</span>
            </div>
            <p className="text-xs text-gray-500">Lectures</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-brand-primary mr-1" />
              <span className="text-sm font-medium">
                {course.enrolledStudents?.length || 0}
              </span>
            </div>
            <p className="text-xs text-gray-500">Students</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-brand-primary mr-1" />
              <span className="text-sm font-medium">
                {formatPrice(course.price || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Price</p>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex gap-2 mb-3">
          <Button
            onClick={onCreateLecture}
            className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Lecture
          </Button>
          
          <Button
            onClick={onViewLectures}
            variant="outline"
            className="flex-1 border-brand-primary text-brand-primary hover:bg-brand-accent"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        </div>

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
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">
                {new Date(course.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900">
                {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </div>
            
            {course.category && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <Badge variant="outline" className="text-xs">
                  {course.category}
                </Badge>
              </div>
            )}
            
            {course.level && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Level:</span>
                <Badge variant="outline" className="text-xs">
                  {course.level}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedCourseCard;
