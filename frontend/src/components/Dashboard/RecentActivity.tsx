import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useGetRecentActivitiesQuery, useMarkActivitiesAsReadMutation } from '@/redux/features/analytics/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Clock,
  Users,
  BookOpen,
  Star,
  DollarSign,
  MessageCircle,
  Award,
  RefreshCw,
  CheckCheck,
  AlertCircle,
  FileText,
  Bell,
  ExternalLink
} from 'lucide-react';
import { RecentActivity as ActivityType, ActivityType as ActivityTypeEnum, ActivityPriority } from '@/types/analytics';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { RecentActivityEmptyState } from '@/components/EmptyStates/TeacherEmptyStates';
import { useActivityErrorHandling } from '@/hooks/useErrorHandling';

interface RecentActivityProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ 
  limit = 10, 
  showHeader = true, 
  className 
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [page] = useState(1);
  
  const {
    data: activitiesData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useGetRecentActivitiesQuery(
    { 
      teacherId: user?._id as string, 
      page, 
      limit 
    },
    {
      skip: !user?._id,
      pollingInterval: 120000, // Poll every 2 minutes for updates
    }
  );

  const [markAsRead] = useMarkActivitiesAsReadMutation();

  const activities = activitiesData?.data?.data || [];
  const unreadActivities = activities.filter(activity => !activity.isRead);

  // Use comprehensive error handling
  const {
    shouldShowError,
    shouldShowEmptyState,
    shouldShowLoading,
    shouldShowContent,
    errorMessage
  } = useActivityErrorHandling(isLoading, error, activities);

  const getActivityIcon = (type: ActivityTypeEnum) => {
    const iconClass = "w-4 h-4";
    
    switch (type) {
      case ActivityTypeEnum.ENROLLMENT:
        return <Users className={iconClass} />;
      case ActivityTypeEnum.COURSE_PUBLISHED:
        return <BookOpen className={iconClass} />;
      case ActivityTypeEnum.REVIEW_RECEIVED:
        return <Star className={iconClass} />;
      case ActivityTypeEnum.PAYMENT_RECEIVED:
        return <DollarSign className={iconClass} />;
      case ActivityTypeEnum.QUESTION:
        return <MessageCircle className={iconClass} />;
      case ActivityTypeEnum.COURSE_COMPLETED:
        return <Award className={iconClass} />;
      case ActivityTypeEnum.LECTURE_COMPLETED:
        return <CheckCheck className={iconClass} />;
      case ActivityTypeEnum.CERTIFICATE_ISSUED:
        return <Award className={iconClass} />;
      case ActivityTypeEnum.REFUND_REQUESTED:
        return <AlertCircle className={iconClass} />;
      case ActivityTypeEnum.COURSE_UPDATED:
        return <FileText className={iconClass} />;
      case ActivityTypeEnum.SYSTEM_NOTIFICATION:
        return <Bell className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getActivityColor = (type: ActivityTypeEnum, priority: ActivityPriority) => {
    if (priority === ActivityPriority.URGENT) {
      return "bg-red-100 text-red-600 border-red-200";
    }
    if (priority === ActivityPriority.HIGH) {
      return "bg-orange-100 text-orange-600 border-orange-200";
    }

    switch (type) {
      case ActivityTypeEnum.ENROLLMENT:
        return "bg-blue-100 text-blue-600 border-blue-200";
      case ActivityTypeEnum.COURSE_PUBLISHED:
        return "bg-green-100 text-green-600 border-green-200";
      case ActivityTypeEnum.REVIEW_RECEIVED:
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      case ActivityTypeEnum.PAYMENT_RECEIVED:
        return "bg-purple-100 text-purple-600 border-purple-200";
      case ActivityTypeEnum.QUESTION:
        return "bg-indigo-100 text-indigo-600 border-indigo-200";
      case ActivityTypeEnum.COURSE_COMPLETED:
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getPriorityBadge = (priority: ActivityPriority) => {
    const variants = {
      [ActivityPriority.LOW]: "bg-gray-100 text-gray-600",
      [ActivityPriority.MEDIUM]: "bg-blue-100 text-blue-600",
      [ActivityPriority.HIGH]: "bg-orange-100 text-orange-600",
      [ActivityPriority.URGENT]: "bg-red-100 text-red-600",
    };

    return (
      <Badge variant="secondary" className={cn("text-xs", variants[priority])}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const handleMarkAllAsRead = async () => {
    if (unreadActivities.length === 0) return;

    try {
      await markAsRead({
        teacherId: user?._id as string,
        activityIds: unreadActivities.map(activity => activity._id)
      }).unwrap();
      
      toast.success(`Marked ${unreadActivities.length} activities as read`);
    } catch (error) {
      toast.error('Failed to mark activities as read');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Activities refreshed');
  };

  // Show loading state
  if (shouldShowLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ActivitySkeleton />
        </CardContent>
      </Card>
    );
  }

  // Show error only for real API errors
  if (shouldShowError) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Activities</h3>
            <p className="text-muted-foreground mb-4">
              {errorMessage || 'There was an error loading your recent activities.'}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state for new teachers
  if (shouldShowEmptyState) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <RecentActivityEmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              Recent Activity
              {unreadActivities.length > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-600">
                  {unreadActivities.length} new
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-1"
              >
                <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                Refresh
              </Button>
              {unreadActivities.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {shouldShowContent && (
          <div className="space-y-4">
            {activities.map((activity: ActivityType) => (
              <div
                key={activity._id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  activity.isRead 
                    ? "bg-gray-50 hover:bg-gray-100" 
                    : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border",
                  getActivityColor(activity.type, activity.priority)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium text-sm",
                        activity.isRead ? "text-gray-900" : "text-gray-900 font-semibold"
                      )}>
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                        {activity.priority !== ActivityPriority.LOW && (
                          getPriorityBadge(activity.priority)
                        )}
                      </div>
                    </div>
                    {activity.actionUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="flex-shrink-0"
                      >
                        <Link to={activity.actionUrl}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ActivitySkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((index) => (
      <div key={index} className="flex items-start gap-3 p-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export default RecentActivity;
