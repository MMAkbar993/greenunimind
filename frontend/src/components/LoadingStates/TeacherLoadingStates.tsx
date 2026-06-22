import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, BookOpen, BarChart3, MessageSquare, Star } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
  message?: string;
}

// Generic loading spinner with message
export const LoadingSpinner: React.FC<LoadingStateProps> = ({ 
  className, 
  message = "Loading..." 
}) => (
  <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

// Dashboard analytics loading state
export const AnalyticsLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={`grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 ${className}`}>
    {Array.from({ length: 6 }).map((_, index) => (
      <Card key={index} className="dashboard-stat-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Messages loading state
export const MessagesLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={`h-full bg-white ${className}`}>
    <div className="p-4 border-b border-gray-200">
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Reviews loading state
export const ReviewsLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Card key={index}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-4" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Courses loading state
export const CoursesLoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="dashboard-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Inline loading state for buttons and small components
export const InlineLoadingState: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}> = ({ size = 'md', message, className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

// Section-specific loading states with icons
export const SectionLoadingState: React.FC<{
  section: 'dashboard' | 'analytics' | 'messages' | 'reviews' | 'courses';
  message?: string;
  className?: string;
}> = ({ section, message, className }) => {
  const getSectionIcon = () => {
    switch (section) {
      case 'analytics':
        return <BarChart3 className="w-8 h-8 text-blue-500" />;
      case 'messages':
        return <MessageSquare className="w-8 h-8 text-green-500" />;
      case 'reviews':
        return <Star className="w-8 h-8 text-yellow-500" />;
      case 'courses':
        return <BookOpen className="w-8 h-8 text-purple-500" />;
      default:
        return <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />;
    }
  };

  const getSectionMessage = () => {
    if (message) return message;
    
    switch (section) {
      case 'analytics':
        return 'Loading analytics data...';
      case 'messages':
        return 'Loading messages...';
      case 'reviews':
        return 'Loading reviews...';
      case 'courses':
        return 'Loading courses...';
      default:
        return 'Loading...';
    }
  };

  return (
    <Card className={`border-0 bg-gray-50/50 ${className}`}>
      <CardContent className="p-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm">
          {getSectionIcon()}
        </div>
        <p className="text-sm text-gray-600 mb-2">{getSectionMessage()}</p>
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
};

// Progressive loading state that shows different stages
export const ProgressiveLoadingState: React.FC<{
  stage: 'initializing' | 'fetching' | 'processing' | 'finalizing';
  className?: string;
}> = ({ stage, className }) => {
  const stages = {
    initializing: { message: 'Initializing...', progress: 25 },
    fetching: { message: 'Fetching data...', progress: 50 },
    processing: { message: 'Processing...', progress: 75 },
    finalizing: { message: 'Almost ready...', progress: 90 }
  };

  const currentStage = stages[stage];

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      <p className="text-sm text-gray-600 mb-3">{currentStage.message}</p>
      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${currentStage.progress}%` }}
        />
      </div>
    </div>
  );
};
