// Course Management Types and Interfaces for Enterprise LMS Dashboard

import { ICourse } from "./course";

// Enhanced Course Interface with Analytics
export interface EnhancedCourse extends ICourse {
  analytics?: CourseAnalytics;
  performance?: CoursePerformance;
  isSelected?: boolean;
  lastActivity?: string;
  completionRate?: number;
  averageRating?: number;
  totalRevenue?: number;
  enrollmentTrend?: 'up' | 'down' | 'stable';
}

// Course Analytics Data
export interface CourseAnalytics {
  enrollmentCount: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  monthlyEnrollments: number;
  weeklyEnrollments: number;
  enrollmentGrowth: number;
  ratingTrend: number;
  revenueTrend: number;
  engagementScore: number;
  dropoffRate: number;
  averageWatchTime: number;
  certificatesIssued: number;
  studentSatisfaction: number;
}

// Course Performance Metrics
export interface CoursePerformance {
  views: number;
  enrollments: number;
  completions: number;
  revenue: number;
  rating: number;
  reviews: number;
  conversionRate: number;
  retentionRate: number;
  engagementRate: number;
  refundRate: number;
  popularityScore: number;
  competitiveRank: number;
}

// Course Filters Interface
export interface CourseFilters {
  search?: string;
  status?: CourseStatus[];
  category?: string[];
  level?: CourseLevel[];
  priceRange?: {
    min: number;
    max: number;
  };
  isFree?: boolean;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  enrollmentRange?: {
    min: number;
    max: number;
  };
  ratingRange?: {
    min: number;
    max: number;
  };
  sortBy?: CourseSortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  tags?: string[];
  instructor?: string;
  language?: string;
  duration?: {
    min: number; // in minutes
    max: number;
  };
}

// Course Status Types
export type CourseStatus = 'draft' | 'published' | 'archived' | 'pending' | 'rejected';

// Course Level Types
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// Course Sort Fields
export type CourseSortField = 
  | 'title' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'enrollments' 
  | 'revenue' 
  | 'rating' 
  | 'status'
  | 'price'
  | 'completionRate';

// Course View Modes
export type CourseViewMode = 'table' | 'grid' | 'list' | 'compact';

// Course Table Column Configuration
export interface CourseTableColumn {
  key: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  width?: number;
  minWidth?: number;
  visible: boolean;
  resizable: boolean;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'status' | 'currency' | 'rating';
}

// Bulk Actions
export type CourseBulkAction = 
  | 'publish' 
  | 'unpublish' 
  | 'archive' 
  | 'delete' 
  | 'duplicate' 
  | 'export'
  | 'updateCategory'
  | 'updatePrice';

// Course Statistics
export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
  averageCompletionRate: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
  topPerformingCourse: string;
  recentActivity: number;
}

// Course Dashboard Data
export interface CourseDashboardData {
  courses: PaginatedCoursesResponse;
  stats: CourseStats;
  analytics: CourseAnalytics[];
  insights: CourseInsight[];
  notifications: {
    unreadCount: number;
    recent: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
      courseId?: string;
    }>;
  };
}

// Paginated Courses Response
export interface PaginatedCoursesResponse {
  courses: EnhancedCourse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  filters?: CourseFilters;
}

// Course Insights
export interface CourseInsight {
  type: 'performance' | 'engagement' | 'revenue' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  relatedCourses?: string[];
  data?: Record<string, any>;
  priority: number;
  category: string;
}

// Course Export Options
export interface CourseExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  columns: string[];
  filters?: CourseFilters;
  includeAnalytics?: boolean;
  includeStudentData?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Course Action Results
export interface CourseActionResult {
  success: boolean;
  message: string;
  courseId?: string;
  errors?: string[];
  warnings?: string[];
}

// Bulk Action Results
export interface BulkActionResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{
    courseId: string;
    error: string;
  }>;
  warnings: Array<{
    courseId: string;
    warning: string;
  }>;
}

// Course Form Data
export interface CourseFormData {
  title: string;
  subtitle?: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  thumbnail?: File | string;
  tags: string[];
  language: string;
  duration?: number;
  requirements?: string[];
  learningObjectives?: string[];
  targetAudience?: string;
  status: CourseStatus;
}

// Course Validation Errors
export interface CourseValidationErrors {
  title?: string[];
  subtitle?: string[];
  description?: string[];
  categoryId?: string[];
  subcategoryId?: string[];
  level?: string[];
  price?: string[];
  thumbnail?: string[];
  tags?: string[];
  language?: string[];
  duration?: string[];
  requirements?: string[];
  learningObjectives?: string[];
  targetAudience?: string[];
}

// Component Props Interfaces

export interface CourseTableProps {
  courses: EnhancedCourse[];
  columns: CourseTableColumn[];
  isLoading?: boolean;
  selectedCourses: string[];
  onSelectionChange: (courseIds: string[]) => void;
  onSort: (field: CourseSortField, order: 'asc' | 'desc') => void;
  onColumnResize: (columnKey: string, width: number) => void;
  onColumnToggle: (columnKey: string, visible: boolean) => void;
  onRowClick?: (course: EnhancedCourse) => void;
  onBulkAction?: (action: CourseBulkAction, courseIds: string[]) => void;
  className?: string;
}

export interface CourseFiltersProps {
  filters: CourseFilters;
  onFiltersChange: (filters: Partial<CourseFilters>) => void;
  categories: Array<{ _id: string; name: string }>;
  isLoading?: boolean;
  savedFilters?: Array<{ name: string; filters: CourseFilters }>;
  onSaveFilter?: (name: string, filters: CourseFilters) => void;
  onLoadFilter?: (filters: CourseFilters) => void;
}

export interface CourseStatsCardProps {
  stats: CourseStats;
  isLoading?: boolean;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange?: (range: 'week' | 'month' | 'quarter' | 'year') => void;
  className?: string;
}

export interface CourseCardProps {
  course: EnhancedCourse;
  isSelected?: boolean;
  onSelect?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
  onPublish?: (courseId: string) => void;
  onDuplicate?: (courseId: string) => void;
  showActions?: boolean;
  showAnalytics?: boolean;
  className?: string;
}

export interface CourseSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  className?: string;
}

export interface CourseBulkActionsProps {
  selectedCourses: string[];
  onBulkAction: (action: CourseBulkAction) => void;
  isLoading?: boolean;
  className?: string;
}

export interface CourseAnalyticsChartProps {
  data: CourseAnalytics[];
  type: 'enrollment' | 'revenue' | 'rating' | 'completion';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  height?: number;
  className?: string;
}

export interface CoursePerformanceIndicatorProps {
  value: number;
  target?: number;
  type: 'enrollment' | 'revenue' | 'rating' | 'completion';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: EnhancedCourse;
  mode: 'create' | 'edit' | 'view' | 'duplicate';
  onSave: (courseData: CourseFormData) => void;
  isLoading?: boolean;
  errors?: CourseValidationErrors;
}

export interface CourseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: EnhancedCourse[];
  onConfirm: () => void;
  isLoading?: boolean;
}

// Notification Types
export interface CourseNotification {
  id: string;
  type: 'enrollment' | 'completion' | 'review' | 'revenue' | 'system';
  title: string;
  message: string;
  courseId?: string;
  courseName?: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

// Course Activity Log
export interface CourseActivity {
  id: string;
  courseId: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Course Comparison Data
export interface CourseComparison {
  courseId: string;
  courseName: string;
  metrics: {
    enrollments: number;
    revenue: number;
    rating: number;
    completionRate: number;
    engagementRate: number;
  };
  trends: {
    enrollmentTrend: number;
    revenueTrend: number;
    ratingTrend: number;
  };
}

// Course Recommendation
export interface CourseRecommendation {
  type: 'pricing' | 'content' | 'marketing' | 'category';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  courseIds: string[];
  actionItems: string[];
  expectedOutcome: string;
  priority: number;
}
