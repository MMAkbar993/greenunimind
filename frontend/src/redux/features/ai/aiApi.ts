import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";

export interface AIEnhancementRequest {
  title: string;
  subtitle?: string;
  description?: string;
}

export interface AIEnhancementResponse {
  enhancedTitle?: string;
  enhancedSubtitle?: string;
  enhancedDescription?: string;
}

export interface AICategorySuggestion {
  categoryId: string;
  subcategoryId: string;
  confidence: number;
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    enhanceTitle: builder.mutation<
      { data: { enhancedTitle: string } },
      { title: string }
    >({
      query: (data) => ({
        url: "/ai/enhance-title",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: TResponseRedux<{ enhancedTitle: string }>) => ({
        data: response.data,
      }),
    }),

    enhanceSubtitle: builder.mutation<
      { data: { enhancedSubtitle: string } },
      { title: string; subtitle?: string }
    >({
      query: (data) => ({
        url: "/ai/enhance-subtitle",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: TResponseRedux<{ enhancedSubtitle: string }>) => ({
        data: response.data,
      }),
    }),

    enhanceDescription: builder.mutation<
      { data: { enhancedDescription: string } },
      { title: string; subtitle?: string; description?: string }
    >({
      query: (data) => ({
        url: "/ai/enhance-description",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: TResponseRedux<{ enhancedDescription: string }>) => ({
        data: response.data,
      }),
    }),

    suggestCategory: builder.mutation<
      { data: AICategorySuggestion },
      { title: string; description?: string }
    >({
      query: (data) => ({
        url: "/ai/suggest-category",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: TResponseRedux<AICategorySuggestion>) => ({
        data: response.data,
      }),
    }),

    generateCourseOutline: builder.mutation<
      { data: { outline: string[] } },
      { title: string; description?: string; level?: string }
    >({
      query: (data) => ({
        url: "/ai/generate-outline",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: TResponseRedux<{ outline: string[] }>) => ({
        data: response.data,
      }),
    }),
  }),
});

export const {
  useEnhanceTitleMutation,
  useEnhanceSubtitleMutation,
  useEnhanceDescriptionMutation,
  useSuggestCategoryMutation,
  useGenerateCourseOutlineMutation,
} = aiApi;
