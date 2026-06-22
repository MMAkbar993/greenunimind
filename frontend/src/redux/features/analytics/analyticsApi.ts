import { baseApi } from '@/redux/api/baseApi';
import {
  AdvancedFilters,
  AlertRule,
  AnalyticsApiResponse,
  AnalyticsFilters,
  AnalyticsInsight,
  BenchmarkData,
  CourseAnalyticsDetail,
  CustomDashboardWidget,
  DashboardSummary,
  EngagementMetrics,
  EnrollmentStatistics,
  ExportOptions,
  GeographicAnalytics,
  PaginatedResponse,
  PerformanceMetrics,
  PredictiveAnalytics,
  RecentActivity,
  RevenueAnalytics,
  StudentEngagementDetails,
  TimeBasedAnalytics,
} from '@/types/analytics';
import { TResponseRedux } from '@/types/global';
import { generateSmartCacheKey } from '@/utils/requestThrottling';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // Dashboard Summary - Main endpoint for dashboard overview
    getDashboardSummary: builder.query<AnalyticsApiResponse<DashboardSummary>, string>({
      query: teacherId => {
        // Validate teacherId before making the request
        if (!teacherId || teacherId === 'undefined' || teacherId.length !== 24) {
          throw new Error('Invalid teacher ID provided');
        }

        // Use smart cache key to reduce unnecessary requests
        const cacheKey = generateSmartCacheKey('dashboard', { teacherId }, 300000); // 5 min cache
        return {
          url: `/analytics/teachers/${teacherId}/dashboard`,
          method: 'GET',
          // Remove aggressive cache-busting headers
        };
      },
      keepUnusedDataFor: 300, // Keep data for 5 minutes
      providesTags: ['analytics', 'dashboard'],
      transformResponse: (response: TResponseRedux<DashboardSummary>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Recent Activities with pagination
    getRecentActivities: builder.query<
      AnalyticsApiResponse<PaginatedResponse<RecentActivity>>,
      { teacherId: string; page?: number; limit?: number }
    >({
      query: ({ teacherId, page = 1, limit = 10 }) => {
        const offset = (page - 1) * limit;
        return {
          url: `/analytics/teachers/${teacherId}/activities?limit=${limit}&offset=${offset}`,
          method: 'GET',
          // Remove aggressive cache-busting headers
        };
      },
      keepUnusedDataFor: 180, // Keep data for 3 minutes
      providesTags: ['analytics', 'activities'],
      transformResponse: (response: TResponseRedux<any>) => {
        // Transform the backend response to match our expected format
        const backendData = response.data;
        return {
          success: response.success,
          message: response.message,
          data: {
            data: backendData.activities || [],
            pagination: {
              page:
                Math.floor(
                  (backendData.pagination?.offset || 0) / (backendData.pagination?.limit || 10)
                ) + 1,
              limit: backendData.pagination?.limit || 10,
              total: backendData.total || 0,
              totalPages: Math.ceil(
                (backendData.total || 0) / (backendData.pagination?.limit || 10)
              ),
            },
          },
        };
      },
    }),

    // Mark activities as read
    markActivitiesAsRead: builder.mutation<
      AnalyticsApiResponse<null>,
      { teacherId: string; activityIds: string[] }
    >({
      query: ({ teacherId, activityIds }) => ({
        url: `/analytics/teachers/${teacherId}/activities/bulk-read`,
        method: 'PATCH',
        body: { activityIds },
      }),
      invalidatesTags: ['activities'],
    }),

    // Enrollment Statistics
    getEnrollmentStatistics: builder.query<
      AnalyticsApiResponse<EnrollmentStatistics>,
      { teacherId: string; filters?: AnalyticsFilters }
    >({
      query: ({ teacherId, filters }) => {
        const params = new URLSearchParams();
        if (filters?.period) params.append('period', filters.period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.courseId) params.append('courseId', filters.courseId);
        // Remove cache busting parameter

        return {
          url: `/analytics/teachers/${teacherId}/enrollment-statistics?${params.toString()}`,
          method: 'GET',
          // Remove aggressive cache-busting headers
        };
      },
      keepUnusedDataFor: 300, // Keep data for 5 minutes
      providesTags: ['analytics', 'enrollment'],
      transformResponse: (response: TResponseRedux<EnrollmentStatistics>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Student Engagement Metrics
    getEngagementMetrics: builder.query<
      AnalyticsApiResponse<EngagementMetrics>,
      { teacherId: string; filters?: AnalyticsFilters }
    >({
      query: ({ teacherId, filters }) => {
        const params = new URLSearchParams();
        if (filters?.period) params.append('period', filters.period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.courseId) params.append('courseId', filters.courseId);
        // Remove cache busting parameter

        return {
          url: `/analytics/teachers/${teacherId}/engagement-metrics?${params.toString()}`,
          method: 'GET',
          // Remove aggressive cache-busting headers
        };
      },
      keepUnusedDataFor: 300, // Keep data for 5 minutes
      providesTags: ['analytics', 'engagement'],
      transformResponse: (response: TResponseRedux<EngagementMetrics>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Revenue Analytics
    getRevenueAnalytics: builder.query<
      AnalyticsApiResponse<RevenueAnalytics>,
      { teacherId: string; filters?: AnalyticsFilters }
    >({
      query: ({ teacherId, filters }) => {
        const params = new URLSearchParams();
        if (filters?.period) params.append('period', filters.period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.courseId) params.append('courseId', filters.courseId);

        return {
          url: `/analytics/teachers/${teacherId}/revenue-detailed?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['analytics', 'revenue'],
      transformResponse: (response: TResponseRedux<RevenueAnalytics>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Performance Metrics
    getPerformanceMetrics: builder.query<
      AnalyticsApiResponse<PerformanceMetrics>,
      { teacherId: string; filters?: AnalyticsFilters }
    >({
      query: ({ teacherId, filters }) => {
        // Validate teacherId before making the request
        if (!teacherId || teacherId === 'undefined' || teacherId.length !== 24) {
          throw new Error('Invalid teacher ID provided');
        }

        const params = new URLSearchParams();
        if (filters?.period) params.append('period', filters.period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.courseId) params.append('courseId', filters.courseId);
        // Remove cache busting parameter to enable proper caching

        return {
          url: `/analytics/teachers/${teacherId}/performance-detailed?${params.toString()}`,
          method: 'GET',
          // Remove aggressive cache-busting headers
        };
      },
      keepUnusedDataFor: 180, // Keep data for 3 minutes
      providesTags: ['analytics', 'performance'],
      transformResponse: (response: TResponseRedux<PerformanceMetrics>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Export Analytics Data
    exportAnalytics: builder.mutation<Blob, { teacherId: string; options: ExportOptions }>({
      query: ({ teacherId, options }) => ({
        url: `/analytics/teachers/${teacherId}/export`,
        method: 'POST',
        body: options,
        responseHandler: response => response.blob(),
      }),
    }),

    // Student Engagement Details
    getStudentEngagementDetails: builder.query<
      AnalyticsApiResponse<PaginatedResponse<StudentEngagementDetails>>,
      {
        teacherId: string;
        filters?: AdvancedFilters;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      }
    >({
      query: ({
        teacherId,
        filters,
        page = 1,
        limit = 20,
        sortBy = 'engagementScore',
        sortOrder = 'desc',
      }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        if (filters?.period) params.append('period', filters.period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.courseId) params.append('courseId', filters.courseId);
        if (filters?.categories?.length) params.append('categories', filters.categories.join(','));

        return {
          url: `/analytics/teachers/${teacherId}/student-engagement?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<any>) => ({
        success: response.success,
        message: response.message,
        data: {
          data: response.data.students || [],
          pagination: response.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
      }),
    }),

    // Course Analytics Details
    getCourseAnalyticsDetails: builder.query<
      AnalyticsApiResponse<PaginatedResponse<CourseAnalyticsDetail>>,
      {
        teacherId: string;
        filters?: AdvancedFilters;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      }
    >({
      query: ({
        teacherId,
        filters,
        page = 1,
        limit = 20,
        sortBy = 'enrollmentStats.totalEnrollments',
        sortOrder = 'desc',
      }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        if (filters?.period) params.append('period', filters.period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.categories?.length) params.append('categories', filters.categories.join(','));
        if (filters?.status?.length) params.append('status', filters.status.join(','));

        return {
          url: `/analytics/teachers/${teacherId}/course-details?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<any>) => ({
        success: response.success,
        message: response.message,
        data: {
          data: response.data.courses || [],
          pagination: response.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
      }),
    }),

    // Geographic Analytics
    getGeographicAnalytics: builder.query<
      AnalyticsApiResponse<GeographicAnalytics[]>,
      { teacherId: string; filters?: AnalyticsFilters }
    >({
      query: ({ teacherId, filters }) => {
        const params = new URLSearchParams();
        if (filters?.period) params.append('period', filters.period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        return {
          url: `/analytics/teachers/${teacherId}/geographic?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<GeographicAnalytics[]>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Time-based Analytics
    getTimeBasedAnalytics: builder.query<
      AnalyticsApiResponse<TimeBasedAnalytics>,
      { teacherId: string; period: string; filters?: AnalyticsFilters }
    >({
      query: ({ teacherId, period, filters }) => {
        const params = new URLSearchParams();
        params.append('period', period);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.courseId) params.append('courseId', filters.courseId);

        return {
          url: `/analytics/teachers/${teacherId}/time-based?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<TimeBasedAnalytics>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Predictive Analytics
    getPredictiveAnalytics: builder.query<
      AnalyticsApiResponse<PredictiveAnalytics>,
      { teacherId: string; horizon?: string }
    >({
      query: ({ teacherId, horizon = '3months' }) => ({
        url: `/analytics/teachers/${teacherId}/predictive?horizon=${horizon}`,
        method: 'GET',
      }),
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<PredictiveAnalytics>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Benchmark Data
    getBenchmarkData: builder.query<
      AnalyticsApiResponse<BenchmarkData[]>,
      { teacherId: string; metrics: string[] }
    >({
      query: ({ teacherId, metrics }) => {
        const params = new URLSearchParams();
        params.append('metrics', metrics.join(','));

        return {
          url: `/analytics/teachers/${teacherId}/benchmark?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<BenchmarkData[]>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Analytics Insights
    getAnalyticsInsights: builder.query<
      AnalyticsApiResponse<AnalyticsInsight[]>,
      { teacherId: string; limit?: number }
    >({
      query: ({ teacherId, limit = 10 }) => ({
        url: `/analytics/teachers/${teacherId}/insights?limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<AnalyticsInsight[]>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Custom Dashboard Widgets
    getDashboardWidgets: builder.query<
      AnalyticsApiResponse<CustomDashboardWidget[]>,
      { teacherId: string }
    >({
      query: ({ teacherId }) => ({
        url: `/analytics/teachers/${teacherId}/widgets`,
        method: 'GET',
      }),
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<CustomDashboardWidget[]>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Create/Update Dashboard Widget
    saveDashboardWidget: builder.mutation<
      AnalyticsApiResponse<CustomDashboardWidget>,
      { teacherId: string; widget: Partial<CustomDashboardWidget> }
    >({
      query: ({ teacherId, widget }) => ({
        url: widget.id
          ? `/analytics/teachers/${teacherId}/widgets/${widget.id}`
          : `/analytics/teachers/${teacherId}/widgets`,
        method: widget.id ? 'PUT' : 'POST',
        body: widget,
      }),
      invalidatesTags: ['analytics'],
    }),

    // Delete Dashboard Widget
    deleteDashboardWidget: builder.mutation<
      AnalyticsApiResponse<null>,
      { teacherId: string; widgetId: string }
    >({
      query: ({ teacherId, widgetId }) => ({
        url: `/analytics/teachers/${teacherId}/widgets/${widgetId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['analytics'],
    }),

    // Alert Rules
    getAlertRules: builder.query<AnalyticsApiResponse<AlertRule[]>, { teacherId: string }>({
      query: ({ teacherId }) => ({
        url: `/analytics/teachers/${teacherId}/alerts`,
        method: 'GET',
      }),
      providesTags: ['analytics'],
      transformResponse: (response: TResponseRedux<AlertRule[]>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Create/Update Alert Rule
    saveAlertRule: builder.mutation<
      AnalyticsApiResponse<AlertRule>,
      { teacherId: string; rule: Partial<AlertRule> }
    >({
      query: ({ teacherId, rule }) => ({
        url: rule.id
          ? `/analytics/teachers/${teacherId}/alerts/${rule.id}`
          : `/analytics/teachers/${teacherId}/alerts`,
        method: rule.id ? 'PUT' : 'POST',
        body: rule,
      }),
      invalidatesTags: ['analytics'],
    }),

    // Delete Alert Rule
    deleteAlertRule: builder.mutation<
      AnalyticsApiResponse<null>,
      { teacherId: string; ruleId: string }
    >({
      query: ({ teacherId, ruleId }) => ({
        url: `/analytics/teachers/${teacherId}/alerts/${ruleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['analytics'],
    }),

    // Real-time Analytics Data
    getRealTimeData: builder.query<
      AnalyticsApiResponse<{
        activeUsers: number;
        currentEnrollments: number;
        recentActivity: RecentActivity[];
        liveMetrics: Record<string, number>;
        lastUpdated: string;
      }>,
      { teacherId: string }
    >({
      query: ({ teacherId }) => ({
        url: `/analytics/teachers/${teacherId}/realtime`,
        method: 'GET',
      }),
      providesTags: ['analytics'],
      transformErrorResponse: (response: any) => {
        // Handle 404 errors gracefully for new teachers
        if (response.status === 404) {
          return {
            success: true,
            message: 'No real-time data available',
            data: {
              activeUsers: 0,
              currentEnrollments: 0,
              recentActivity: [],
              liveMetrics: {
                studentsOnline: 0,
                coursesViewed: 0,
                lessonsCompleted: 0,
                questionsAsked: 0,
              },
              lastUpdated: new Date().toISOString(),
            },
          };
        }
        return response;
      },
    }),

    // Analytics Insights
    getInsights: builder.query<
      AnalyticsApiResponse<
        Array<{
          id: string;
          type: string;
          title: string;
          description: string;
          priority: string;
          actionable: boolean;
          action?: {
            text: string;
            url: string;
          };
          createdAt: string;
        }>
      >,
      { teacherId: string; limit?: number }
    >({
      query: ({ teacherId, limit = 5 }) => ({
        url: `/analytics/teachers/${teacherId}/insights?limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['analytics'],
      transformErrorResponse: (response: any) => {
        // Handle 404 errors gracefully for new teachers
        if (response.status === 404) {
          return {
            success: true,
            message: 'No insights available',
            data: [
              {
                id: 'welcome',
                type: 'welcome',
                title: 'Welcome to Your Teaching Journey!',
                description:
                  'Start by creating your first course to unlock powerful analytics and insights.',
                priority: 'high',
                actionable: true,
                action: {
                  text: 'Create Your First Course',
                  url: '/teacher/courses/create',
                },
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetRecentActivitiesQuery,
  useMarkActivitiesAsReadMutation,
  useGetEnrollmentStatisticsQuery,
  useGetEngagementMetricsQuery,
  useGetRevenueAnalyticsQuery,
  useGetPerformanceMetricsQuery,
  useExportAnalyticsMutation,
  useGetStudentEngagementDetailsQuery,
  useGetCourseAnalyticsDetailsQuery,
  useGetGeographicAnalyticsQuery,
  useGetTimeBasedAnalyticsQuery,
  useGetPredictiveAnalyticsQuery,
  useGetBenchmarkDataQuery,
  useGetAnalyticsInsightsQuery,
  useGetDashboardWidgetsQuery,
  useSaveDashboardWidgetMutation,
  useDeleteDashboardWidgetMutation,
  useGetAlertRulesQuery,
  useSaveAlertRuleMutation,
  useDeleteAlertRuleMutation,
  useGetRealTimeDataQuery,
  useGetInsightsQuery,
} = analyticsApi;
