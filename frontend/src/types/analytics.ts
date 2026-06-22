// Analytics Types for Dashboard and Components

export interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  totalEarnings: number;
  avgRating: number;
  monthlyEarnings: number;
  completionRate: number;
  newStudentsThisMonth: number;
  totalReviews: number;
  // Growth indicators
  coursesGrowth: number;
  studentsGrowth: number;
  earningsGrowth: number;
  ratingGrowth: number;
  completionRateGrowth: number;
  performanceScore: string; // "Excellent", "Good", "Average", "Poor"
}

export interface RecentActivity {
  _id: string;
  type: ActivityType;
  priority: ActivityPriority;
  title: string;
  description: string;
  metadata: Record<string, any>;
  actionRequired: boolean;
  actionUrl?: string;
  isRead: boolean;
  relatedEntity: {
    entityType: string;
    entityId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export enum ActivityType {
  ENROLLMENT = 'enrollment',
  COURSE_PUBLISHED = 'course_published',
  REVIEW_RECEIVED = 'review_received',
  PAYMENT_RECEIVED = 'payment_received',
  QUESTION = 'question',
  COURSE_COMPLETED = 'course_completed',
  LECTURE_COMPLETED = 'lecture_completed',
  CERTIFICATE_ISSUED = 'certificate_issued',
  REFUND_REQUESTED = 'refund_requested',
  COURSE_UPDATED = 'course_updated',
  SYSTEM_NOTIFICATION = 'system_notification'
}

export enum ActivityPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface EnrollmentStatistics {
  totalEnrollments: number;
  newEnrollments: number;
  enrollmentTrend: Array<{
    date: string;
    count: number;
  }>;
  topCourses: Array<{
    courseId: string;
    courseName: string;
    enrollments: number;
  }>;
  growthRate: number;
}

export interface EngagementMetrics {
  totalActiveStudents: number;
  averageEngagementScore: number;
  completionRates: Array<{
    courseId: string;
    courseName: string;
    rate: number;
  }>;
  timeSpentTrends: Array<{
    date: string;
    minutes: number;
  }>;
  activityPatterns: Array<{
    hour: number;
    activity: number;
  }>;
  retentionRate: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  paymentTrends: Array<{
    period: string;
    amount: number;
    count: number;
  }>;
  topEarningCourses: Array<{
    courseId: string;
    courseName: string;
    revenue: number;
  }>;
  revenueByPeriod: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  conversionRate: number;
  refundRate: number;
}

export interface PerformanceMetrics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
  ratingTrends: Array<{
    date: string;
    rating: number;
  }>;
  studentSatisfactionScore: number;
  courseCompletionRate: number;
  studentRetentionRate: number;
  qualityMetrics: {
    contentQuality: number;
    instructorRating: number;
    courseStructure: number;
    valueForMoney: number;
  };
  competitiveMetrics: {
    marketPosition: number;
    categoryRanking: number;
    peerComparison: number;
  };
}

export interface DashboardSummary {
  overview: {
    totalRevenue: number;
    totalStudents: number;
    averageRating: number;
    totalCourses: number;
  };
  recentActivities: RecentActivity[];
  topPerformingCourses: Array<{
    _id: string;
    title: string;
    enrollments: number;
    revenue: number;
    rating: number;
  }>;
  insights: Array<{
    type: string;
    message: string;
    priority: string;
    actionable: boolean;
  }>;
}

export interface AnalyticsFilters {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  courseId?: string;
}

// API Response Types
export interface AnalyticsApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Enhanced Analytics Types for Advanced Dashboard

export interface StudentEngagementDetails {
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollmentDate: string;
  lastActiveDate: string;
  totalTimeSpent: number; // in minutes
  coursesEnrolled: number;
  coursesCompleted: number;
  averageProgress: number; // percentage
  engagementScore: number; // 0-100
  activityPattern: {
    preferredTimeSlots: string[];
    averageSessionDuration: number;
    weeklyActivity: number[];
  };
  performanceMetrics: {
    averageQuizScore: number;
    assignmentsCompleted: number;
    certificatesEarned: number;
  };
}

export interface CourseAnalyticsDetail {
  courseId: string;
  courseName: string;
  category: string;
  instructor: string;
  createdDate: string;
  publishedDate: string;
  lastUpdated: string;
  status: 'draft' | 'published' | 'archived';
  enrollmentStats: {
    totalEnrollments: number;
    activeStudents: number;
    completedStudents: number;
    dropoutRate: number;
    averageCompletionTime: number; // in days
  };
  contentMetrics: {
    totalLectures: number;
    totalDuration: number; // in minutes
    averageLectureLength: number;
    quizzes: number;
    assignments: number;
    resources: number;
  };
  engagementMetrics: {
    averageWatchTime: number;
    completionRate: number;
    interactionRate: number;
    discussionPosts: number;
    questionsAsked: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    averagePrice: number;
    discountedSales: number;
    refunds: number;
    netRevenue: number;
  };
  ratingMetrics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    sentimentScore: number;
  };
}

export interface LearningPathAnalytics {
  pathId: string;
  pathName: string;
  coursesInPath: number;
  enrolledStudents: number;
  completedStudents: number;
  averageCompletionTime: number;
  dropoffPoints: Array<{
    courseId: string;
    courseName: string;
    dropoffRate: number;
    position: number;
  }>;
  progressDistribution: Record<string, number>;
}

export interface GeographicAnalytics {
  country: string;
  countryCode: string;
  students: number;
  revenue: number;
  averageEngagement: number;
  topCourses: Array<{
    courseId: string;
    courseName: string;
    enrollments: number;
  }>;
  growthRate: number;
}

export interface TimeBasedAnalytics {
  period: string; // 'hour', 'day', 'week', 'month', 'quarter', 'year'
  data: Array<{
    timestamp: string;
    enrollments: number;
    completions: number;
    revenue: number;
    activeUsers: number;
    newUsers: number;
    sessionDuration: number;
    bounceRate: number;
  }>;
}

export interface CompetitorAnalytics {
  competitorName: string;
  marketShare: number;
  averagePrice: number;
  courseCount: number;
  studentCount: number;
  ratingAverage: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface PredictiveAnalytics {
  enrollmentForecast: Array<{
    period: string;
    predictedEnrollments: number;
    confidence: number;
  }>;
  revenueForecast: Array<{
    period: string;
    predictedRevenue: number;
    confidence: number;
  }>;
  churnPrediction: Array<{
    studentId: string;
    studentName: string;
    churnProbability: number;
    riskFactors: string[];
    recommendedActions: string[];
  }>;
  trendAnalysis: {
    growingCategories: string[];
    decliningCategories: string[];
    emergingTopics: string[];
    seasonalPatterns: Record<string, number>;
  };
}

export interface CustomDashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  description?: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    dataSource: string;
    chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';
    metrics: string[];
    filters?: Record<string, any>;
    refreshInterval?: number; // in seconds
  };
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdvancedFilters extends AnalyticsFilters {
  categories?: string[];
  instructors?: string[];
  priceRange?: { min: number; max: number };
  ratingRange?: { min: number; max: number };
  enrollmentRange?: { min: number; max: number };
  countries?: string[];
  languages?: string[];
  tags?: string[];
  status?: string[];
  ageGroups?: string[];
  deviceTypes?: string[];
  trafficSources?: string[];
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange: { startDate: string; endDate: string };
  filters: AdvancedFilters;
  sections: string[]; // which sections to include
  customFields?: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  threshold: number;
  timeframe: string; // '1h', '24h', '7d', '30d'
  isActive: boolean;
  notifications: {
    email: boolean;
    dashboard: boolean;
    webhook?: string;
  };
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  actionable: boolean;
  recommendedActions?: string[];
  relatedMetrics: string[];
  generatedAt: string;
  expiresAt?: string;
}

export interface BenchmarkData {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}
