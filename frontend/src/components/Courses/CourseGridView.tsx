import { useState } from "react";
import { BookOpen, Plus, Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CourseGridViewProps, EnhancedCourse } from "@/types/course-management";
import CoursePerformanceCard from "./CoursePerformanceCard";

const CourseGridView: React.FC<CourseGridViewProps> = ({
  courses,
  isLoading = false,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAnalytics,
  onCreateNew,
  sortBy = 'updatedAt',
  sortOrder = 'desc',
  onSortChange,
  className
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'enrollments', label: 'Enrollments' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'rating', label: 'Rating' },
    { value: 'status', label: 'Status' }
  ];

  const handleSortChange = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange?.(field as any, newOrder);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="dashboard-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  
                  <Skeleton className="h-32 w-full rounded-lg" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-semibold text-gray-900">
            Courses ({courses.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Controls */}
          <Select 
            value={`${sortBy}-${sortOrder}`} 
            onValueChange={(value) => {
              const [field, order] = value.split('-');
              onSortChange?.(field as any, order as 'asc' | 'desc');
            }}
          >
            <SelectTrigger className="w-40">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <div key={option.value}>
                  <SelectItem value={`${option.value}-asc`}>
                    {option.label} (A-Z)
                  </SelectItem>
                  <SelectItem value={`${option.value}-desc`}>
                    {option.label} (Z-A)
                  </SelectItem>
                </div>
              ))}
            </SelectContent>
          </Select>

          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Course
            </Button>
          )}
        </div>
      </div>

      {/* Course Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              onMouseEnter={() => setHoveredCard(course._id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={cn(
                "transition-transform duration-200",
                hoveredCard === course._id && "scale-105"
              )}
            >
              <CoursePerformanceCard
                course={course}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onViewAnalytics={onViewAnalytics}
                className={cn(
                  "h-full",
                  hoveredCard === course._id && "shadow-xl"
                )}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="dashboard-card">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Get started by creating your first course or adjust your filters to see existing courses.
              </p>
              {onCreateNew && (
                <Button onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      {courses.length > 0 && (
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Portfolio Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-primary">
                  {courses.length}
                </p>
                <p className="text-sm text-gray-600">Total Courses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {courses.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {(courses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / courses.length).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {courses.filter(course => course.status === 'published').length}
                </p>
                <p className="text-sm text-gray-600">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseGridView;
