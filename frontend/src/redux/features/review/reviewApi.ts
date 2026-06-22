import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import {
  ReviewFilters,
  ReviewAnalytics,
  ReviewStats,
  PaginatedReviewsResponse,
  ReviewDashboardData,
  ReviewResponse,
  ReviewExportOptions,
  ReviewInsight
} from "@/types/review";

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get teacher reviews with filters and pagination
    getTeacherReviews: builder.query<
      PaginatedReviewsResponse,
      { teacherId: string; filters?: ReviewFilters }
    >({
      query: ({ teacherId, filters = {} }) => {
        const params = new URLSearchParams();
        
        if (filters.rating?.length) {
          params.append('rating', filters.rating.join(','));
        }
        if (filters.courseId) {
          params.append('courseId', filters.courseId);
        }
        if (filters.startDate) {
          params.append('startDate', filters.startDate);
        }
        if (filters.endDate) {
          params.append('endDate', filters.endDate);
        }
        if (filters.search) {
          params.append('search', filters.search);
        }
        if (filters.sortBy) {
          params.append('sortBy', filters.sortBy);
        }
        if (filters.sortOrder) {
          params.append('sortOrder', filters.sortOrder);
        }
        if (filters.page) {
          params.append('page', filters.page.toString());
        }
        if (filters.limit) {
          params.append('limit', filters.limit.toString());
        }

        return {
          url: `/reviews/teacher/${teacherId}?${params.toString()}`,
          method: "GET",
        };
      },
      transformResponse: (response: TResponseRedux<PaginatedReviewsResponse>) => response.data,
      providesTags: ["reviews", "teacher-reviews"],
    }),

    // Get review analytics for teacher
    getReviewAnalytics: builder.query<
      ReviewAnalytics,
      { teacherId: string; timeRange?: string }
    >({
      query: ({ teacherId, timeRange = 'month' }) => ({
        url: `/reviews/teacher/${teacherId}/analytics?timeRange=${timeRange}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<ReviewAnalytics>) => response.data,
      providesTags: ["review-analytics"],
    }),

    // Get review statistics
    getReviewStats: builder.query<
      ReviewStats,
      { teacherId: string }
    >({
      query: ({ teacherId }) => ({
        url: `/reviews/teacher/${teacherId}/stats`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<ReviewStats>) => response.data,
      providesTags: ["review-stats"],
    }),

    // Get dashboard data (reviews + analytics + insights)
    getReviewDashboard: builder.query<
      ReviewDashboardData,
      { teacherId: string; filters?: ReviewFilters }
    >({
      query: ({ teacherId, filters = {} }) => {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, value.toString());
            }
          }
        });

        return {
          url: `/reviews/teacher/${teacherId}/dashboard?${params.toString()}`,
          method: "GET",
        };
      },
      transformResponse: (response: TResponseRedux<ReviewDashboardData>) => response.data,
      providesTags: ["review-dashboard"],
    }),

    // Get course reviews
    getCourseReviews: builder.query<
      PaginatedReviewsResponse,
      { courseId: string; filters?: ReviewFilters }
    >({
      query: ({ courseId, filters = {} }) => {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, value.toString());
            }
          }
        });

        return {
          url: `/reviews/course/${courseId}?${params.toString()}`,
          method: "GET",
        };
      },
      transformResponse: (response: TResponseRedux<PaginatedReviewsResponse>) => response.data,
      providesTags: ["course-reviews"],
    }),

    // Respond to a review
    respondToReview: builder.mutation<
      ReviewResponse,
      { reviewId: string; response: string }
    >({
      query: ({ reviewId, response }) => ({
        url: `/reviews/${reviewId}/respond`,
        method: "POST",
        body: { response },
      }),
      transformResponse: (response: TResponseRedux<ReviewResponse>) => response.data,
      invalidatesTags: ["reviews", "teacher-reviews", "review-analytics"],
    }),

    // Export reviews
    exportReviews: builder.mutation<
      { downloadUrl: string },
      { teacherId: string; options: ReviewExportOptions }
    >({
      query: ({ teacherId, options }) => ({
        url: `/reviews/teacher/${teacherId}/export`,
        method: "POST",
        body: options,
      }),
      transformResponse: (response: TResponseRedux<{ downloadUrl: string }>) => response.data,
    }),

    // Get review insights
    getReviewInsights: builder.query<
      ReviewInsight[],
      { teacherId: string; timeRange?: string }
    >({
      query: ({ teacherId, timeRange = 'month' }) => ({
        url: `/reviews/teacher/${teacherId}/insights?timeRange=${timeRange}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<ReviewInsight[]>) => response.data,
      providesTags: ["review-insights"],
    }),

    // Mark review as helpful
    markReviewHelpful: builder.mutation<
      { success: boolean },
      { reviewId: string }
    >({
      query: ({ reviewId }) => ({
        url: `/reviews/${reviewId}/helpful`,
        method: "POST",
      }),
      transformResponse: (response: TResponseRedux<{ success: boolean }>) => response.data,
      invalidatesTags: ["reviews", "teacher-reviews"],
    }),

    // Report review
    reportReview: builder.mutation<
      { success: boolean },
      { reviewId: string; reason: string }
    >({
      query: ({ reviewId, reason }) => ({
        url: `/reviews/${reviewId}/report`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (response: TResponseRedux<{ success: boolean }>) => response.data,
      invalidatesTags: ["reviews", "teacher-reviews"],
    }),

    // Get review trends
    getReviewTrends: builder.query<
      Array<{ date: string; rating: number; count: number }>,
      { teacherId: string; period: 'week' | 'month' | 'quarter' | 'year' }
    >({
      query: ({ teacherId, period }) => ({
        url: `/reviews/teacher/${teacherId}/trends?period=${period}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<Array<{ date: string; rating: number; count: number }>>) => response.data,
      providesTags: ["review-trends"],
    }),
  }),
});

export const {
  useGetTeacherReviewsQuery,
  useGetReviewAnalyticsQuery,
  useGetReviewStatsQuery,
  useGetReviewDashboardQuery,
  useGetCourseReviewsQuery,
  useRespondToReviewMutation,
  useExportReviewsMutation,
  useGetReviewInsightsQuery,
  useMarkReviewHelpfulMutation,
  useReportReviewMutation,
  useGetReviewTrendsQuery,
} = reviewApi;
