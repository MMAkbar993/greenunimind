import { useState } from "react";
import {
  Users,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Eye,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  Calendar,
  Clock
} from "lucide-react";
import QuickLectureActions from "@/components/Lecture/QuickLectureActions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EnhancedCourse } from "@/types/course-management";

interface CoursePerformanceCardProps {
  course: EnhancedCourse;
  onEdit?: (course: EnhancedCourse) => void;
  onDuplicate?: (course: EnhancedCourse) => void;
  onDelete?: (course: EnhancedCourse) => void;
  onViewAnalytics?: (course: EnhancedCourse) => void;
  className?: string;
}

const CoursePerformanceCard: React.FC<CoursePerformanceCardProps> = ({
  course,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAnalytics,
  className
}) => {
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const enrollmentCount = course.enrolledStudents?.length || 0;
  const revenue = course.totalRevenue || 0;
  const rating = course.averageRating || 0;
  const completionRate = course.completionRate || 0;

  return (
    <Card className={cn("dashboard-card hover:shadow-lg transition-all duration-200 group", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-medium border", getStatusColor(course.status))}
              >
                {course.status}
              </Badge>
              {course.isFree === 'free' && (
                <Badge variant="secondary" className="text-xs">
                  Free
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1 line-clamp-2">
              {course.title}
            </h3>
            
            {course.subtitle && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {course.subtitle}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(course.updatedAt || course.createdAt || Date.now()).toLocaleDateString()}
              </div>
              {course.lectures && course.lectures.length > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {course.lectures.length} lectures
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewAnalytics?.(course)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(course)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(course)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(course)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Course Thumbnail */}
        <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-video">
          {course.courseThumbnail && !imageError ? (
            <img
              src={course.courseThumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-primary/20">
              <div className="text-center">
                <Eye className="w-8 h-8 text-brand-primary mx-auto mb-2" />
                <p className="text-sm text-gray-600">No thumbnail</p>
              </div>
            </div>
          )}
          
          {/* Overlay with quick stats */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-sm font-medium">Quick View</p>
              <p className="text-xs opacity-90">Click to see details</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Students</span>
                {getTrendIcon(course.enrollmentTrend || 'stable')}
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatNumber(enrollmentCount)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Revenue</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {course.isFree === 'free' ? 'Free' : formatCurrency(revenue)}
              </p>
            </div>
          </div>

          {/* Rating and Completion */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {rating.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-3 h-3",
                        star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Completion</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">
                  {completionRate.toFixed(0)}%
                </p>
                <Progress 
                  value={completionRate} 
                  className="h-1.5"
                />
              </div>
            </div>
          </div>

          {/* Mini Performance Chart */}
          {enrollmentCount > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">30-day trend</span>
                <span className="text-xs text-gray-500">Enrollments</span>
              </div>
              <div className="h-8 flex items-end gap-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const height = Math.random() * 100; // Mock data
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-brand-primary/20 rounded-sm transition-all duration-200 hover:bg-brand-primary/40"
                      style={{ height: `${Math.max(height, 10)}%` }}
                      title={`Day ${i + 1}: ${Math.floor(height)} enrollments`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Lecture Actions */}
          <div className="pt-2 border-t">
            <QuickLectureActions
              course={course as any}
              variant="inline"
              size="sm"
              showLectureCount={true}
              className="justify-center"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit?.(course)}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewAnalytics?.(course)}
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Analytics
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoursePerformanceCard;
