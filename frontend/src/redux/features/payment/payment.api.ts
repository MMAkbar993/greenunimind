import { baseApi } from "../../api/baseApi";

const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Payout endpoints
    getPayoutPreferences: builder.query({
      query: (teacherId) => ({
        url: `/payments/payouts/preferences/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["PayoutPreferences"],
    }),

    updatePayoutPreferences: builder.mutation({
      query: ({ teacherId, ...data }) => ({
        url: `/payments/payouts/preferences/${teacherId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["PayoutPreferences"],
    }),

    getPayoutHistory: builder.query({
      query: (teacherId) => ({
        url: `/payments/payouts/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["Payouts"],
    }),

    getPayoutById: builder.query({
      query: (payoutId) => ({
        url: `/payments/payouts/details/${payoutId}`,
        method: "GET",
      }),
      providesTags: (result, error, payoutId) => [
        { type: "Payout", id: payoutId },
      ],
    }),



    // Earnings and transactions
    getTeacherEarnings: builder.query({
      query: (teacherId) => ({
        url: `/payments/earnings/${teacherId}?_t=${Date.now()}`,
        method: "GET",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }),
      keepUnusedDataFor: 0, // Prevent client-side caching
      providesTags: ['analytics'],
    }),

    getTeacherTransactions: builder.query({
      query: ({ teacherId, period = "month" }) => ({
        url: `/payments/transactions/${teacherId}?period=${period}`,
        method: "GET",
      }),
    }),

    getPayoutInfo: builder.query({
      query: ({ teacherId, period }) => ({
        url: `/payments/payout-info/${teacherId}${
          period ? `?period=${period}` : ""
        }`,
        method: "GET",
      }),
    }),



    getTransactionById: builder.query({
      query: (transactionId) => ({
        url: `/payments/transaction/${transactionId}`,
        method: "GET",
      }),
    }),

    getTransactionBySessionId: builder.query({
      query: (sessionId) => ({
        url: `/payments/session/${sessionId}`,
        method: "GET",
      }),
    }),

    getStudentTransactions: builder.query({
      query: (studentId) => ({
        url: `/payments/student-transactions/${studentId}`,
        method: "GET",
      }),
    }),

    getTransactionAnalytics: builder.query({
      query: ({ teacherId, startDate, endDate, groupBy = "day" }) => ({
        url: `/payments/analytics/${teacherId}?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`,
        method: "GET",
      }),
    }),

    // Enhanced financial analytics endpoints
    getTeacherPayouts: builder.query({
      query: (teacherId) => ({
        url: `/payments/teacher-payouts/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["Payouts"],
    }),

    getFinancialSummary: builder.query({
      query: ({ teacherId, period = "30d" }) => ({
        url: `/payments/financial-summary/${teacherId}?period=${period}&_t=${Date.now()}`,
        method: "GET",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }),
      keepUnusedDataFor: 0,
      providesTags: ["analytics"],
    }),

    getEarningsGrowth: builder.query({
      query: ({ teacherId, period = "12m" }) => ({
        url: `/payments/earnings-growth/${teacherId}?period=${period}`,
        method: "GET",
      }),
      providesTags: ["analytics"],
    }),

    getTopPerformingCourses: builder.query({
      query: ({ teacherId, limit = 10 }) => ({
        url: `/payments/top-courses/${teacherId}?limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["performance"],
    }),

    exportFinancialData: builder.mutation({
      query: ({ teacherId, type, format = "csv", period }) => ({
        url: `/payments/export/${teacherId}`,
        method: "POST",
        body: { type, format, period },
        responseHandler: (response) => response.blob(),
      }),
    }),

    getRevenueChart: builder.query({
      query: ({ teacherId, period = "30d", groupBy = "day" }) => ({
        url: `/payments/revenue-chart/${teacherId}?period=${period}&groupBy=${groupBy}`,
        method: "GET",
      }),
      providesTags: ["revenue"],
    }),

    // Invoice management endpoints
    generateInvoice: builder.mutation({
      query: ({ transactionId, ...data }) => ({
        url: `/invoices/generate/${transactionId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["analytics"],
    }),

    getInvoiceByTransaction: builder.query({
      query: (transactionId) => ({
        url: `/invoices/transaction/${transactionId}`,
        method: "GET",
      }),
    }),

    getStudentInvoices: builder.query({
      query: (studentId) => ({
        url: `/invoices/student/${studentId}`,
        method: "GET",
      }),
      providesTags: ["analytics"],
    }),

    resendInvoiceEmail: builder.mutation({
      query: (transactionId) => ({
        url: `/invoices/resend/${transactionId}`,
        method: "POST",
      }),
    }),

    getTeacherInvoiceStats: builder.query({
      query: ({ teacherId, period = "30d" }) => ({
        url: `/invoices/stats/teacher/${teacherId}?period=${period}`,
        method: "GET",
      }),
      providesTags: ["analytics"],
    }),

    bulkGenerateInvoices: builder.mutation({
      query: (transactions) => ({
        url: `/invoices/bulk-generate`,
        method: "POST",
        body: { transactions },
      }),
      invalidatesTags: ["analytics"],
    }),

    // Stripe Connect endpoints
    createStripeAccount: builder.mutation({
      query: (data) => ({
        url: `/stripe-connect/create-account`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["analytics"],
    }),

    createAccountLink: builder.mutation({
      query: (data) => ({
        url: `/stripe-connect/create-account-link`,
        method: "POST",
        body: data,
      }),
    }),

    checkStripeAccountStatus: builder.query({
      query: (forceRefresh = false) => ({
        url: `/stripe-connect/account-status${forceRefresh ? '?forceRefresh=true' : ''}`,
        method: "GET",
      }),
      providesTags: ["analytics"],
      transformErrorResponse: (response: any) => {
        // Handle 404 errors gracefully for new teachers
        if (response.status === 404) {
          return {
            success: true,
            message: 'No Stripe account connected',
            data: {
              isConnected: false,
              isVerified: false,
              onboardingComplete: false,
              requirements: [],
              accountId: null,
              verificationStage: 'not_started',
              estimatedCompletionTime: null
            }
          };
        }
        return response;
      },
    }),

    // Quick status check for real-time updates
    quickStripeStatusCheck: builder.query({
      query: () => ({
        url: `/stripe-connect/quick-status`,
        method: "GET",
      }),
      providesTags: ["analytics"],
    }),

    // Proactive verification check
    proactiveVerificationCheck: builder.mutation({
      query: () => ({
        url: `/stripe-connect/proactive-verification`,
        method: "POST",
      }),
      invalidatesTags: ["analytics"],
    }),

    updateStripeAccount: builder.mutation({
      query: (data) => ({
        url: `/stripe-connect/update-account`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["analytics"],
    }),

    disconnectStripeAccount: builder.mutation({
      query: () => ({
        url: `/stripe-connect/disconnect-account`,
        method: "DELETE",
      }),
      invalidatesTags: ["analytics"],
    }),

    // Enhanced Stripe Connect endpoints
    retryConnection: builder.mutation({
      query: () => ({
        url: `/stripe-connect/retry-connection`,
        method: "POST",
      }),
      invalidatesTags: ["analytics"],
    }),

    getAuditLog: builder.query({
      query: (params = {}) => {
        const { limit = 50, offset = 0, action } = params;
        return {
          url: `/stripe-connect/audit-log?limit=${limit}&offset=${offset}${action ? `&action=${action}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["analytics"],
    }),

    disconnectAccountEnhanced: builder.mutation({
      query: (data = {}) => {
        const { reason } = data;
        return {
          url: `/stripe-connect/disconnect-enhanced`,
          method: "DELETE",
          body: { reason },
        };
      },
      invalidatesTags: ["analytics"],
    }),

    // Payout endpoints
    createPayoutRequest: builder.mutation({
      query: ({ teacherId, amount }) => ({
        url: `/payments/payout-request/${teacherId}`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["analytics"],
    }),

    getUpcomingPayout: builder.query({
      query: (teacherId) => ({
        url: `/payments/upcoming-payout/${teacherId}?_t=${Date.now()}`,
        method: "GET",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }),
      keepUnusedDataFor: 0, // Prevent client-side caching
      providesTags: ["Payouts"],
    }),

    // Legacy endpoints
    getStripeConnectUrl: builder.query({
      query: (teacherId) => ({
        url: `/payments/connect-stripe-url/${teacherId}`,
        method: "GET",
      }),
    }),

    exchangeStripeCode: builder.mutation({
      query: ({ code, teacherId }) => ({
        url: "/payments/exchange-stripe-code",
        method: "POST",
        body: { code, teacherId },
      }),
    }),

    // Payment processing
    createPaymentIntent: builder.mutation({
      query: ({ studentId, courseId, amount }) => ({
        url: "/payments/create-payment-intent",
        method: "POST",
        body: { studentId, courseId, amount },
      }),
    }),

    createCheckoutSession: builder.mutation({
      query: ({ courseId, amount }) => ({
        url: "/payments/create-checkout-session",
        method: "POST",
        body: { courseId, amount },
      }),
    }),
  }),
});

export const {
  // Earnings and transactions
  useGetTeacherEarningsQuery,
  useGetTeacherTransactionsQuery,
  useGetPayoutInfoQuery,
  useGetTransactionByIdQuery,
  useGetTransactionBySessionIdQuery,
  useGetStudentTransactionsQuery,
  useGetTransactionAnalyticsQuery,

  // Enhanced financial analytics
  useGetTeacherPayoutsQuery,
  useGetFinancialSummaryQuery,
  useGetEarningsGrowthQuery,
  useGetTopPerformingCoursesQuery,
  useExportFinancialDataMutation,
  useGetRevenueChartQuery,

  // Invoice management
  useGenerateInvoiceMutation,
  useGetInvoiceByTransactionQuery,
  useGetStudentInvoicesQuery,
  useResendInvoiceEmailMutation,
  useGetTeacherInvoiceStatsQuery,
  useBulkGenerateInvoicesMutation,

  // Stripe Connect
  useCreateStripeAccountMutation,
  useCreateAccountLinkMutation,
  useCheckStripeAccountStatusQuery,
  useQuickStripeStatusCheckQuery,
  useProactiveVerificationCheckMutation,
  useUpdateStripeAccountMutation,
  useDisconnectStripeAccountMutation,
  useRetryConnectionMutation,
  useGetAuditLogQuery,
  useDisconnectAccountEnhancedMutation,

  // Payout management
  useCreatePayoutRequestMutation,
  useGetUpcomingPayoutQuery,

  // Legacy endpoints
  useGetStripeConnectUrlQuery,
  useExchangeStripeCodeMutation,

  // Payment processing
  useCreatePaymentIntentMutation,
  useCreateCheckoutSessionMutation,
} = paymentApi;
