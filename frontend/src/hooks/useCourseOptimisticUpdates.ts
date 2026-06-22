import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { EnhancedCourse, CourseBulkAction } from '@/types/course-management';

interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete' | 'bulk';
  originalData?: any;
  timestamp: number;
}

interface UseCourseOptimisticUpdatesProps {
  courses: EnhancedCourse[];
  onCoursesChange: (courses: EnhancedCourse[]) => void;
}

export const useCourseOptimisticUpdates = ({
  courses,
  onCoursesChange
}: UseCourseOptimisticUpdatesProps) => {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());
  const [isOptimisticLoading, setIsOptimisticLoading] = useState(false);

  // Create optimistic course
  const optimisticCreateCourse = useCallback(async (
    courseData: Partial<EnhancedCourse>,
    apiCall: () => Promise<EnhancedCourse>
  ) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticCourse: EnhancedCourse = {
      _id: tempId,
      title: courseData.title || 'New Course',
      subtitle: courseData.subtitle,
      description: courseData.description,
      category: courseData.category || '',
      courseLevel: courseData.courseLevel || 'Beginner',
      coursePrice: courseData.coursePrice || 0,
      courseThumbnail: courseData.courseThumbnail,
      enrolledStudents: [],
      totalEnrollment: 0,
      lectures: [],
      creator: '',
      isPublished: courseData.isPublished || false,
      status: 'draft',
      isFree: courseData.isFree || 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Enhanced fields
      totalRevenue: 0,
      averageRating: 0,
      completionRate: 0,
      enrollmentTrend: 'stable',
      analytics: {
        enrollmentCount: 0,
        completionRate: 0,
        averageRating: 0,
        totalRevenue: 0,
        monthlyEnrollments: 0,
        weeklyEnrollments: 0,
        enrollmentGrowth: 0,
        ratingTrend: 0,
        revenueTrend: 0,
        engagementScore: 0,
        dropoffRate: 0,
        averageWatchTime: 0,
        certificatesIssued: 0,
        studentSatisfaction: 0
      },
      ...courseData
    };

    // Add optimistic course to list
    const updatedCourses = [optimisticCourse, ...courses];
    onCoursesChange(updatedCourses);

    // Track pending update
    const update: OptimisticUpdate = {
      id: tempId,
      type: 'create',
      timestamp: Date.now()
    };
    setPendingUpdates(prev => new Map(prev).set(tempId, update));
    setIsOptimisticLoading(true);

    try {
      const createdCourse = await apiCall();
      
      // Replace optimistic course with real course
      const finalCourses = updatedCourses.map(course => 
        course._id === tempId ? createdCourse : course
      );
      onCoursesChange(finalCourses);
      
      toast.success('Course created successfully');
      return createdCourse;
    } catch (error) {
      // Revert optimistic update
      onCoursesChange(courses);
      toast.error('Failed to create course');
      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      setIsOptimisticLoading(false);
    }
  }, [courses, onCoursesChange]);

  // Update optimistic course
  const optimisticUpdateCourse = useCallback(async (
    courseId: string,
    updates: Partial<EnhancedCourse>,
    apiCall: () => Promise<EnhancedCourse>
  ) => {
    const originalCourse = courses.find(c => c._id === courseId);
    if (!originalCourse) return;

    // Apply optimistic update
    const updatedCourses = courses.map(course =>
      course._id === courseId 
        ? { ...course, ...updates, updatedAt: new Date() }
        : course
    );
    onCoursesChange(updatedCourses);

    // Track pending update
    const update: OptimisticUpdate = {
      id: courseId,
      type: 'update',
      originalData: originalCourse,
      timestamp: Date.now()
    };
    setPendingUpdates(prev => new Map(prev).set(courseId, update));
    setIsOptimisticLoading(true);

    try {
      const updatedCourse = await apiCall();
      
      // Replace with server response
      const finalCourses = courses.map(course =>
        course._id === courseId ? updatedCourse : course
      );
      onCoursesChange(finalCourses);
      
      toast.success('Course updated successfully');
      return updatedCourse;
    } catch (error) {
      // Revert optimistic update
      const revertedCourses = courses.map(course =>
        course._id === courseId ? originalCourse : course
      );
      onCoursesChange(revertedCourses);
      toast.error('Failed to update course');
      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(courseId);
        return newMap;
      });
      setIsOptimisticLoading(false);
    }
  }, [courses, onCoursesChange]);

  // Delete optimistic course
  const optimisticDeleteCourse = useCallback(async (
    courseId: string,
    apiCall: () => Promise<void>
  ) => {
    const originalCourse = courses.find(c => c._id === courseId);
    if (!originalCourse) return;

    // Remove course optimistically
    const updatedCourses = courses.filter(course => course._id !== courseId);
    onCoursesChange(updatedCourses);

    // Track pending update
    const update: OptimisticUpdate = {
      id: courseId,
      type: 'delete',
      originalData: originalCourse,
      timestamp: Date.now()
    };
    setPendingUpdates(prev => new Map(prev).set(courseId, update));
    setIsOptimisticLoading(true);

    try {
      await apiCall();
      toast.success('Course deleted successfully');
    } catch (error) {
      // Revert optimistic delete
      const revertedCourses = [...courses];
      // Insert back at original position
      const originalIndex = courses.findIndex(c => c._id === courseId);
      if (originalIndex !== -1) {
        revertedCourses.splice(originalIndex, 0, originalCourse);
      } else {
        revertedCourses.push(originalCourse);
      }
      onCoursesChange(revertedCourses);
      toast.error('Failed to delete course');
      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(courseId);
        return newMap;
      });
      setIsOptimisticLoading(false);
    }
  }, [courses, onCoursesChange]);

  // Bulk optimistic updates
  const optimisticBulkUpdate = useCallback(async (
    courseIds: string[],
    action: CourseBulkAction,
    apiCall: () => Promise<void>
  ) => {
    const originalCourses = courses.filter(c => courseIds.includes(c._id));
    
    // Apply optimistic bulk update
    let updatedCourses = [...courses];
    
    switch (action) {
      case 'publish':
        updatedCourses = courses.map(course =>
          courseIds.includes(course._id)
            ? { ...course, status: 'published', isPublished: true }
            : course
        );
        break;
      case 'unpublish':
        updatedCourses = courses.map(course =>
          courseIds.includes(course._id)
            ? { ...course, status: 'draft', isPublished: false }
            : course
        );
        break;
      case 'archive':
        updatedCourses = courses.map(course =>
          courseIds.includes(course._id)
            ? { ...course, status: 'archived' }
            : course
        );
        break;
      case 'delete':
        updatedCourses = courses.filter(course => !courseIds.includes(course._id));
        break;
      default:
        break;
    }

    onCoursesChange(updatedCourses);

    // Track pending updates
    const bulkUpdateId = `bulk-${Date.now()}`;
    const update: OptimisticUpdate = {
      id: bulkUpdateId,
      type: 'bulk',
      originalData: { courseIds, originalCourses, action },
      timestamp: Date.now()
    };
    setPendingUpdates(prev => new Map(prev).set(bulkUpdateId, update));
    setIsOptimisticLoading(true);

    try {
      await apiCall();
      toast.success(`Successfully ${action}ed ${courseIds.length} course${courseIds.length !== 1 ? 's' : ''}`);
    } catch (error) {
      // Revert bulk update
      onCoursesChange(courses);
      toast.error(`Failed to ${action} courses`);
      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(bulkUpdateId);
        return newMap;
      });
      setIsOptimisticLoading(false);
    }
  }, [courses, onCoursesChange]);

  // Check if a course has pending updates
  const hasPendingUpdate = useCallback((courseId: string) => {
    return pendingUpdates.has(courseId);
  }, [pendingUpdates]);

  // Get pending update info
  const getPendingUpdate = useCallback((courseId: string) => {
    return pendingUpdates.get(courseId);
  }, [pendingUpdates]);

  // Clear all pending updates (useful for cleanup)
  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates(new Map());
    setIsOptimisticLoading(false);
  }, []);

  return {
    optimisticCreateCourse,
    optimisticUpdateCourse,
    optimisticDeleteCourse,
    optimisticBulkUpdate,
    hasPendingUpdate,
    getPendingUpdate,
    clearPendingUpdates,
    isOptimisticLoading,
    pendingUpdatesCount: pendingUpdates.size
  };
};

export default useCourseOptimisticUpdates;
