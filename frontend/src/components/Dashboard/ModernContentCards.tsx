import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardContentCard } from '@/components/ui/dashboard-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Plus,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

// Types for course data
interface Course {
  _id: string;
  title: string;
  status: 'published' | 'draft';
  updatedAt: string;
  createdAt: string;
  enrollmentCount?: number;
  rating?: number;
  lectureCount?: number;
  thumbnail?: string;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'review' | 'completion' | 'message';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    studentName?: string;
    courseName?: string;
    rating?: number;
  };
}

// Recent Courses Component
interface RecentCoursesProps {
  courses: Course[];
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

export const RecentCoursesCard: React.FC<RecentCoursesProps> = ({
  courses,
  isLoading = false,
  className,
  maxItems = 5,
}) => {
  const displayCourses = courses.slice(0, maxItems);

  const getStatusBadge = (status: string) => {
    return status === 'published' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Published
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        <Clock className="w-3 h-3 mr-1" />
        Draft
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <DashboardContentCard
        id="recent-courses"
        title="Recent Courses"
        icon={<BookOpen className="w-4 h-4" />}
        className={className}
      >
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
            >
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </DashboardContentCard>
    );
  }

  return (
    <DashboardContentCard
      id="recent-courses"
      title="Recent Courses"
      description={`${courses.length} total courses`}
      icon={<BookOpen className="w-4 h-4" />}
      headerAction={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/teacher/courses" className="text-green-600 hover:text-green-700">
            View All
          </Link>
        </Button>
      }
      className={className}
    >
      {displayCourses.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">You haven't created any courses yet.</p>
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link to="/teacher/courses/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Course
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayCourses.map(course => (
            <div
              key={course._id}
              className={cn(
                'flex items-center justify-between p-3 border border-gray-100 rounded-lg',
                'hover:border-gray-200 hover:bg-gray-50 transition-colors duration-200',
                '@media (prefers-reduced-motion: reduce) { transition: none; }'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                  {getStatusBadge(course.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(course.updatedAt)}
                  </span>
                  {course.enrollmentCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.enrollmentCount} students
                    </span>
                  )}
                  {course.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {course.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/teacher/courses/${course._id}/details`}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/teacher/courses/edit-course/${course._id}`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardContentCard>
  );
};

// Recent Activity Component
interface RecentActivityProps {
  activities: RecentActivity[];
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

export const RecentActivityCard: React.FC<RecentActivityProps> = ({
  activities,
  isLoading = false,
  className,
  maxItems = 5,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'review':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'completion':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'message':
        return <AlertCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return time.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <DashboardContentCard
        id="recent-activity"
        title="Recent Activity"
        icon={<TrendingUp className="w-4 h-4" />}
        className={className}
      >
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </DashboardContentCard>
    );
  }

  return (
    <DashboardContentCard
      id="recent-activity"
      title="Recent Activity"
      description="Latest updates and interactions"
      icon={<TrendingUp className="w-4 h-4" />}
      className={className}
    >
      {displayActivities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No recent activity to display.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayActivities.map(activity => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-tight">{activity.title}</p>
                <p className="text-xs text-gray-600 leading-tight mt-1">{activity.description}</p>
                {activity.metadata?.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-600">
                      {activity.metadata.rating}/5 stars
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardContentCard>
  );
};

// Course Performance Overview
interface CoursePerformanceProps {
  courses: Array<
    Course & {
      enrollmentCount: number;
      rating: number;
      completionRate: number;
      revenue: number;
    }
  >;
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

export const CoursePerformanceCard: React.FC<CoursePerformanceProps> = ({
  courses,
  isLoading = false,
  className,
  maxItems = 3,
}) => {
  const topCourses = courses.sort((a, b) => b.revenue - a.revenue).slice(0, maxItems);

  if (isLoading) {
    return (
      <DashboardContentCard
        id="course-performance"
        title="Top Performing Courses"
        icon={<TrendingUp className="w-4 h-4" />}
        className={className}
      >
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 border border-gray-100 rounded-lg">
              <Skeleton className="h-4 w-48 mb-2" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </DashboardContentCard>
    );
  }

  return (
    <DashboardContentCard
      id="course-performance"
      title="Top Performing Courses"
      description="Based on revenue and engagement"
      icon={<TrendingUp className="w-4 h-4" />}
      headerAction={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/teacher/analytics" className="text-green-600 hover:text-green-700">
            View Analytics
          </Link>
        </Button>
      }
      className={className}
    >
      {topCourses.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No course performance data available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topCourses.map((course, index) => (
            <div
              key={course._id}
              className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 truncate flex-1">{course.title}</h4>
                <Badge variant="outline" className="ml-2">
                  #{index + 1}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600 text-xs">Students</p>
                  <p className="font-semibold text-gray-900">{course.enrollmentCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-xs">Rating</p>
                  <p className="font-semibold text-gray-900 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {course.rating.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-xs">Revenue</p>
                  <p className="font-semibold text-green-600">${course.revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardContentCard>
  );
};
