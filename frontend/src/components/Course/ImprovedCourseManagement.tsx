import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCreatorCourseQuery } from '@/redux/features/course/courseApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { ICourse } from '@/types/course';
import EnhancedDashboardHeader from './EnhancedDashboardHeader';
import EnhancedCourseCard from './EnhancedCourseCard';
import FloatingActionButton from '@/components/ui/floating-action-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImprovedCourseManagementProps {
  className?: string;
}

const ImprovedCourseManagement: React.FC<ImprovedCourseManagementProps> = ({
  className
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Fetch user and courses data
  const { data: userData } = useGetMeQuery(undefined);
  const {
    data: coursesData,
    isLoading,
    isError,
    refetch
  } = useGetCreatorCourseQuery(
    { id: userData?.data?._id },
    { skip: !userData?.data?._id }
  );

  const courses = coursesData?.data || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalLectures = courses.reduce((sum, course) => 
      sum + (course.lectures?.length || 0), 0
    );
    
    return {
      courseCount: courses.length,
      lectureCount: totalLectures,
      publishedCourses: courses.filter(c => c.status === 'published').length,
      draftCourses: courses.filter(c => c.status === 'draft').length
    };
  }, [courses]);

  // Filter and search courses
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.subtitle?.toLowerCase().includes(query) ||
        course.category?.toLowerCase().includes(query)
      );
    }

    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(course =>
        selectedFilters.includes(course.status)
      );
    }

    return filtered;
  }, [courses, searchQuery, selectedFilters]);

  // Event handlers
  const handleCreateCourse = () => {
    navigate('/teacher/courses/create');
  };

  const handleEditCourse = (course: ICourse) => {
    navigate(`/teacher/courses/edit-course/${course._id}`);
  };

  const handleDeleteCourse = (course: ICourse) => {
    // TODO: Implement delete confirmation modal
    console.log('Delete course:', course._id);
  };

  const handleCreateLecture = (courseId: string) => {
    navigate(`/teacher/courses/${courseId}/lecture/create`);
  };

  const handleViewLectures = (course: ICourse) => {
    navigate(`/teacher/courses/${course._id}/details`);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load courses. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 pb-20", className)}>
      {/* Enhanced Header */}
      <EnhancedDashboardHeader
        title="Course Management"
        subtitle="Manage your courses and lectures in one unified interface"
        courseCount={stats.courseCount}
        lectureCount={stats.lectureCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
      />

      {/* Course Grid/List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            {searchQuery || selectedFilters.length > 0 
              ? 'No courses found' 
              : 'No courses yet'
            }
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchQuery || selectedFilters.length > 0
              ? 'Try adjusting your search criteria or filters to find courses.'
              : 'Start your teaching journey by creating your first course. Share your knowledge with students around the world.'
            }
          </p>
          {!searchQuery && selectedFilters.length === 0 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCreateCourse}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Create Your First Course
              </button>
              <button
                onClick={() => navigate('/teacher/courses/templates')}
                className="border border-brand-primary text-brand-primary hover:bg-brand-accent px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Browse Templates
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <EnhancedCourseCard
                  key={course._id}
                  course={course}
                  onEdit={() => handleEditCourse(course)}
                  onDelete={() => handleDeleteCourse(course)}
                  onCreateLecture={() => handleCreateLecture(course._id)}
                  onViewLectures={() => handleViewLectures(course)}
                  lectureCount={course.lectures?.length || 0}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {course.title}
                      </h3>
                      {course.subtitle && (
                        <p className="text-gray-600 mb-3">{course.subtitle}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{course.lectures?.length || 0} lectures</span>
                        <span>{course.enrolledStudents?.length || 0} students</span>
                        <span className="capitalize">{course.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCreateLecture(course._id)}
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Add Lecture
                      </button>
                      <button
                        onClick={() => handleViewLectures(course)}
                        className="border border-brand-primary text-brand-primary hover:bg-brand-accent px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};

export default ImprovedCourseManagement;
