import React from 'react';
import { CheckCircle, Clock, Play, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  isCompleted?: boolean;
  showPercentage?: boolean;
  showTime?: boolean;
  currentTime?: number;
  totalTime?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
  syncStatus?: 'synced' | 'pending' | 'error' | 'offline';
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  isCompleted = false,
  showPercentage = true,
  showTime = false,
  currentTime = 0,
  totalTime = 0,
  size = 'md',
  variant = 'default',
  syncStatus = 'synced',
  className,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'space-y-1',
          progress: 'h-1',
          text: 'text-xs',
          icon: 'w-3 h-3',
        };
      case 'lg':
        return {
          container: 'space-y-3',
          progress: 'h-3',
          text: 'text-base',
          icon: 'w-5 h-5',
        };
      default:
        return {
          container: 'space-y-2',
          progress: 'h-2',
          text: 'text-sm',
          icon: 'w-4 h-4',
        };
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'pending':
        return <Clock className={cn(sizeClasses.icon, 'text-yellow-500 animate-pulse')} />;
      case 'error':
        return <AlertCircle className={cn(sizeClasses.icon, 'text-red-500')} />;
      case 'offline':
        return <WifiOff className={cn(sizeClasses.icon, 'text-gray-400')} />;
      default:
        return <Wifi className={cn(sizeClasses.icon, 'text-green-500')} />;
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isCompleted ? (
          <CheckCircle className={cn(sizeClasses.icon, 'text-green-500')} />
        ) : (
          <div className="relative">
            <div className={cn(
              'rounded-full border-2 border-gray-200',
              size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
            )}>
              <div
                className="rounded-full bg-brand-primary transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  height: '100%',
                }}
              />
            </div>
          </div>
        )}
        {showPercentage && (
          <span className={cn(sizeClasses.text, 'font-medium text-gray-600')}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn(sizeClasses.container, className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle className={cn(sizeClasses.icon, 'text-green-500')} />
            ) : (
              <Play className={cn(sizeClasses.icon, 'text-brand-primary')} />
            )}
            <span className={cn(sizeClasses.text, 'font-medium')}>
              {isCompleted ? 'Completed' : 'In Progress'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {showTime && totalTime > 0 && (
              <span className={cn(sizeClasses.text, 'text-gray-500 font-mono')}>
                {formatTime(currentTime)} / {formatTime(totalTime)}
              </span>
            )}
            {showPercentage && (
              <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-xs">
                {Math.round(progress)}%
              </Badge>
            )}
            {getSyncStatusIcon()}
          </div>
        </div>
        
        <Progress 
          value={progress} 
          className={cn(sizeClasses.progress, 'bg-gray-200')}
        />
        
        {syncStatus !== 'synced' && (
          <div className="flex items-center gap-1">
            <span className={cn(sizeClasses.text, 'text-gray-500')}>
              {syncStatus === 'pending' && 'Syncing...'}
              {syncStatus === 'error' && 'Sync failed'}
              {syncStatus === 'offline' && 'Offline mode'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(sizeClasses.container, className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompleted && (
            <CheckCircle className={cn(sizeClasses.icon, 'text-green-500')} />
          )}
          {showPercentage && (
            <span className={cn(sizeClasses.text, 'font-medium text-gray-900')}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
        
        {showTime && totalTime > 0 && (
          <span className={cn(sizeClasses.text, 'text-gray-500 font-mono')}>
            {formatTime(currentTime)} / {formatTime(totalTime)}
          </span>
        )}
      </div>
      
      <Progress 
        value={progress} 
        className={cn(sizeClasses.progress, 'bg-gray-200')}
      />
    </div>
  );
};

// Course Progress Summary Component
interface CourseProgressSummaryProps {
  totalLectures: number;
  completedLectures: number;
  overallProgress: number;
  totalDuration: number;
  watchedDuration: number;
  className?: string;
}

export const CourseProgressSummary: React.FC<CourseProgressSummaryProps> = ({
  totalLectures,
  completedLectures,
  overallProgress,
  totalDuration,
  watchedDuration,
  className,
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
        <Badge variant={overallProgress >= 90 ? 'default' : 'secondary'}>
          {Math.round(overallProgress)}% Complete
        </Badge>
      </div>
      
      <ProgressIndicator
        progress={overallProgress}
        isCompleted={overallProgress >= 90}
        showPercentage={false}
        variant="default"
        size="lg"
      />
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <span className="text-gray-500">Lectures</span>
          <p className="font-medium">
            {completedLectures} of {totalLectures} completed
          </p>
        </div>
        
        <div className="space-y-1">
          <span className="text-gray-500">Watch Time</span>
          <p className="font-medium">
            {formatDuration(watchedDuration)} of {formatDuration(totalDuration)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Lecture Progress Card Component
interface LectureProgressCardProps {
  lectureTitle: string;
  progress: number;
  isCompleted: boolean;
  duration?: number;
  currentTime?: number;
  lastWatched?: Date;
  syncStatus?: 'synced' | 'pending' | 'error' | 'offline';
  onClick?: () => void;
  className?: string;
}

export const LectureProgressCard: React.FC<LectureProgressCardProps> = ({
  lectureTitle,
  progress,
  isCompleted,
  duration = 0,
  currentTime = 0,
  lastWatched,
  syncStatus = 'synced',
  onClick,
  className,
}) => {
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <div
      className={cn(
        'p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer',
        isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200',
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900 line-clamp-2">{lectureTitle}</h4>
          {isCompleted && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />}
        </div>
        
        <ProgressIndicator
          progress={progress}
          isCompleted={isCompleted}
          showTime={duration > 0}
          currentTime={currentTime}
          totalTime={duration}
          syncStatus={syncStatus}
          variant="default"
          size="sm"
        />
        
        {lastWatched && (
          <p className="text-xs text-gray-500">
            Last watched {formatRelativeTime(lastWatched)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;
