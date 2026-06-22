import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Loading skeleton for review stats overview
export const ReviewStatsLoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6", className)}>
    {/* Metrics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-12 h-6 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Rating Overview */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Average Rating Display */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Skeleton className="h-12 w-16 mx-auto mb-2" />
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-5 h-5" />
              ))}
            </div>
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card className="dashboard-card lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-4" />
                <Skeleton className="flex-1 h-2 rounded-full" />
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Loading skeleton for individual review card
export const ReviewCardLoadingSkeleton = ({ className }: { className?: string }) => (
  <Card className={cn("dashboard-card", className)}>
    <CardContent className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-3 h-3" />
              ))}
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);

// Loading skeleton for review list
export const ReviewListLoadingSkeleton = ({ 
  count = 5, 
  className 
}: { 
  count?: number; 
  className?: string; 
}) => (
  <div className={cn("space-y-4", className)}>
    {[...Array(count)].map((_, index) => (
      <ReviewCardLoadingSkeleton key={index} />
    ))}
  </div>
);

// Loading skeleton for filters section
export const ReviewFiltersLoadingSkeleton = ({ className }: { className?: string }) => (
  <Card className={cn("dashboard-card", className)}>
    <CardContent className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          <Skeleton className="h-10 w-full sm:w-80" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Loading skeleton for trend chart
export const ReviewTrendChartLoadingSkeleton = ({ 
  height = 300, 
  className 
}: { 
  height?: number; 
  className?: string; 
}) => (
  <Card className={cn("dashboard-card", className)}>
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="w-full" style={{ height: `${height}px` }} />
    </CardContent>
  </Card>
);

// Loading skeleton for tabs
export const ReviewTabsLoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6", className)}>
    {/* Tab Headers */}
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-10 flex-1 rounded-md" />
      ))}
    </div>
    
    {/* Tab Content */}
    <div className="space-y-6">
      <ReviewStatsLoadingSkeleton />
      <ReviewTrendChartLoadingSkeleton />
    </div>
  </div>
);

// Loading skeleton for entire reviews page
export const ReviewPageLoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6", className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>

    {/* Tabs */}
    <ReviewTabsLoadingSkeleton />
  </div>
);

// Error state component
export const ReviewErrorState = ({ 
  title = "Failed to load reviews",
  message = "There was an error loading the reviews. Please try again.",
  onRetry,
  className 
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) => (
  <div className={cn("text-center py-12", className)}>
    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 max-w-md mx-auto mb-6">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
      >
        Try Again
      </button>
    )}
  </div>
);

// Empty state component
export const ReviewEmptyState = ({ 
  title = "No reviews yet",
  message = "When students leave reviews for your courses, they'll appear here.",
  className 
}: {
  title?: string;
  message?: string;
  className?: string;
}) => (
  <div className={cn("text-center py-12", className)}>
    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 max-w-md mx-auto">{message}</p>
  </div>
);
