import { baseApi } from "../../api/baseApi";

const payoutApi = baseApi.injectEndpoints({
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
      providesTags: (result, error, payoutId) => [{ type: "Payout", id: payoutId }],
    }),

    createPayoutRequest: builder.mutation({
      query: ({ teacherId, amount }) => ({
        url: `/payments/payouts/${teacherId}`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["Payouts", "PayoutPreferences"],
    }),
  }),
});

export const {
  useGetPayoutPreferencesQuery,
  useUpdatePayoutPreferencesMutation,
  useGetPayoutHistoryQuery,
  useGetPayoutByIdQuery,
  useCreatePayoutRequestMutation,
} = payoutApi;
