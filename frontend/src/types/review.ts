// Review Types and Interfaces for LMS Dashboard

export interface IReview {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    profileImg?: string;
  };
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
  };
  teacher: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFilters {
  rating?: number[];
  courseId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'rating' | 'course';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: number;
  responseRate: number;
  sentimentScore: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
}

export interface ReviewAnalytics {
  stats: ReviewStats;
  trends: {
    period: string;
    averageRating: number;
    totalReviews: number;
  }[];
  topCourses: {
    courseId: string;
    courseName: string;
    averageRating: number;
    totalReviews: number;
    thumbnail?: string;
  }[];
  recentActivity: {
    date: string;
    reviews: number;
    averageRating: number;
  }[];
  ratingTrends: {
    date: string;
    rating: number;
  }[];
}

export interface ReviewResponse {
  _id: string;
  review: string;
  teacher: string;
  response: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReviewsResponse {
  reviews: IReview[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  analytics?: ReviewAnalytics;
}

export interface ReviewCardProps {
  review: IReview;
  showCourse?: boolean;
  showActions?: boolean;
  onRespond?: (reviewId: string) => void;
  className?: string;
}

export interface ReviewFiltersProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  courses: Array<{ _id: string; title: string }>;
  isLoading?: boolean;
}

export interface ReviewStatsCardProps {
  stats: ReviewStats;
  isLoading?: boolean;
  className?: string;
}

export interface ReviewAnalyticsProps {
  analytics: ReviewAnalytics;
  isLoading?: boolean;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange?: (range: 'week' | 'month' | 'quarter' | 'year') => void;
}

export interface ReviewListProps {
  reviews: IReview[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showCourse?: boolean;
  showActions?: boolean;
  onRespond?: (reviewId: string) => void;
}

export interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  readonly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export interface RatingDistributionProps {
  distribution: ReviewStats['ratingDistribution'];
  totalReviews: number;
  className?: string;
}

export interface ReviewSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface ReviewSortProps {
  sortBy: ReviewFilters['sortBy'];
  sortOrder: ReviewFilters['sortOrder'];
  onSortChange: (sortBy: ReviewFilters['sortBy'], sortOrder: ReviewFilters['sortOrder']) => void;
  className?: string;
}

export interface ReviewMetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

export interface ReviewTrendChartProps {
  data: ReviewAnalytics['trends'];
  height?: number;
  className?: string;
}

export interface ReviewActivityTimelineProps {
  activities: ReviewAnalytics['recentActivity'];
  className?: string;
}

export interface ReviewExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ReviewFilters;
  includeAnalytics?: boolean;
}

export interface ReviewBulkActionsProps {
  selectedReviews: string[];
  onBulkAction: (action: 'respond' | 'archive' | 'export') => void;
  className?: string;
}

export interface ReviewNotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newReviewAlert: boolean;
  lowRatingAlert: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
}

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface ReviewSentimentAnalysis {
  sentiment: ReviewSentiment;
  confidence: number;
  keywords: string[];
  topics: string[];
}

export interface EnhancedReview extends IReview {
  sentiment?: ReviewSentimentAnalysis;
  isResponded?: boolean;
  responseCount?: number;
  helpfulCount?: number;
  reportCount?: number;
}

export interface ReviewInsight {
  type: 'improvement' | 'strength' | 'concern' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  relatedCourses?: string[];
  data?: Record<string, any>;
}

export interface ReviewDashboardData {
  reviews: PaginatedReviewsResponse;
  analytics: ReviewAnalytics;
  insights: ReviewInsight[];
  notifications: {
    unreadCount: number;
    recent: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
    }>;
  };
}
