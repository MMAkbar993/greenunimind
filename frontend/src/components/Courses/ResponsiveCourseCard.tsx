import { useState } from "react";
import { 
  Users, 
  DollarSign, 
  Star, 
  Calendar,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { EnhancedCourse } from "@/types/course-management";

interface ResponsiveCourseCardProps {
  course: EnhancedCourse;
  isSelected?: boolean;
  onSelect?: (courseId: string, selected: boolean) => void;
  onEdit?: (course: EnhancedCourse) => void;
  onDuplicate?: (course: EnhancedCourse) => void;
  onDelete?: (course: EnhancedCourse) => void;
  onTogglePublish?: (course: EnhancedCourse) => void;
  onArchive?: (course: EnhancedCourse) => void;
  onClick?: (course: EnhancedCourse) => void;
  className?: string;
  showSelection?: boolean;
  isMobile?: boolean;
}

const ResponsiveCourseCard: React.FC<ResponsiveCourseCardProps> = ({
  course,
  isSelected = false,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublish,
  onArchive,
  onClick,
  className,
  showSelection = false,
  isMobile = false
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, [role="button"], input, select')) {
      return;
    }
    onClick?.(course);
  };

  const handleSelectChange = (checked: boolean) => {
    onSelect?.(course._id, checked);
  };

  return (
    <Card 
      className={cn(
        "dashboard-card transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-brand-primary bg-brand-accent",
        onClick && "cursor-pointer",
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className={cn("p-4", isMobile ? "p-3" : "p-4")}>
        <div className="space-y-4">
          {/* Header with selection and actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {showSelection && (
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={handleSelectChange}
                    aria-label={`Select ${course.title}`}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                  {course.isPublished && (
                    <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                      Live
                    </Badge>
                  )}
                </div>
                
                <h3 className={cn(
                  "font-semibold text-gray-900 leading-tight mb-1 line-clamp-2",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  {course.title}
                </h3>
                
                {course.subtitle && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {course.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {onClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 sm:hidden"
                  onClick={() => onClick(course)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit?.(course)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Course
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate?.(course)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onTogglePublish?.(course)}>
                    {course.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive?.(course)}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
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
          </div>

          {/* Course thumbnail - responsive sizing */}
          <div className={cn(
            "relative rounded-lg overflow-hidden bg-gray-100",
            isMobile ? "aspect-video" : "aspect-video"
          )}>
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
                  <Eye className="w-6 h-6 text-brand-primary mx-auto mb-1" />
                  <p className="text-xs text-gray-600">No thumbnail</p>
                </div>
              </div>
            )}
          </div>

          {/* Metrics - responsive layout */}
          <div className={cn(
            "grid gap-3",
            isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
          )}>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">Students</span>
                {getTrendIcon(course.enrollmentTrend || 'stable')}
              </div>
              <p className={cn("font-bold text-gray-900", isMobile ? "text-sm" : "text-base")}>
                {formatNumber(enrollmentCount)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-gray-700">Revenue</span>
              </div>
              <p className={cn("font-bold text-gray-900", isMobile ? "text-sm" : "text-base")}>
                {course.isFree === 'free' ? 'Free' : formatCurrency(revenue)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-medium text-gray-700">Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn("font-bold text-gray-900", isMobile ? "text-sm" : "text-base")}>
                  {rating.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-2 h-2",
                        star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-gray-700">Updated</span>
              </div>
              <p className={cn("font-bold text-gray-900", isMobile ? "text-sm" : "text-base")}>
                {new Date(course.updatedAt || course.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Completion rate progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Completion Rate</span>
              <span className="text-xs font-bold text-gray-900">
                {completionRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={completionRate} className="h-1.5" />
          </div>

          {/* Action buttons - responsive */}
          <div className={cn(
            "flex gap-2 pt-2",
            isMobile ? "flex-col" : "flex-row"
          )}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(course);
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePublish?.(course);
              }}
            >
              {course.isPublished ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponsiveCourseCard;
