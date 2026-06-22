import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReviewFilters, IReview, ReviewStats } from "@/types/review";

interface ReviewState {
  filters: ReviewFilters;
  selectedReviews: string[];
  viewMode: 'list' | 'grid' | 'compact';
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  cache: {
    reviews: IReview[];
    stats: ReviewStats | null;
    lastFetch: string | null;
  };
  ui: {
    showFilters: boolean;
    showAnalytics: boolean;
    sidebarCollapsed: boolean;
    activeTab: 'overview' | 'reviews' | 'analytics' | 'insights';
  };
}

const initialState: ReviewState = {
  filters: {
    rating: [],
    courseId: undefined,
    startDate: undefined,
    endDate: undefined,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  },
  selectedReviews: [],
  viewMode: 'list',
  isLoading: false,
  error: null,
  lastUpdated: null,
  cache: {
    reviews: [],
    stats: null,
    lastFetch: null,
  },
  ui: {
    showFilters: true,
    showAnalytics: true,
    sidebarCollapsed: false,
    activeTab: 'overview',
  },
};

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ReviewFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset page when filters change
      if (Object.keys(action.payload).some(key => key !== 'page')) {
        state.filters.page = 1;
      }
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    setSelectedReviews: (state, action: PayloadAction<string[]>) => {
      state.selectedReviews = action.payload;
    },

    toggleReviewSelection: (state, action: PayloadAction<string>) => {
      const reviewId = action.payload;
      const index = state.selectedReviews.indexOf(reviewId);
      if (index > -1) {
        state.selectedReviews.splice(index, 1);
      } else {
        state.selectedReviews.push(reviewId);
      }
    },

    selectAllReviews: (state, action: PayloadAction<string[]>) => {
      state.selectedReviews = action.payload;
    },

    clearSelectedReviews: (state) => {
      state.selectedReviews = [];
    },

    setViewMode: (state, action: PayloadAction<'list' | 'grid' | 'compact'>) => {
      state.viewMode = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setLastUpdated: (state, action: PayloadAction<string>) => {
      state.lastUpdated = action.payload;
    },

    updateCache: (state, action: PayloadAction<{
      reviews?: IReview[];
      stats?: ReviewStats;
    }>) => {
      if (action.payload.reviews) {
        state.cache.reviews = action.payload.reviews;
      }
      if (action.payload.stats) {
        state.cache.stats = action.payload.stats;
      }
      state.cache.lastFetch = new Date().toISOString();
    },

    clearCache: (state) => {
      state.cache = initialState.cache;
    },

    toggleFilters: (state) => {
      state.ui.showFilters = !state.ui.showFilters;
    },

    toggleAnalytics: (state) => {
      state.ui.showAnalytics = !state.ui.showAnalytics;
    },

    toggleSidebar: (state) => {
      state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
    },

    setActiveTab: (state, action: PayloadAction<'overview' | 'reviews' | 'analytics' | 'insights'>) => {
      state.ui.activeTab = action.payload;
    },

    setUIState: (state, action: PayloadAction<Partial<ReviewState['ui']>>) => {
      state.ui = { ...state.ui, ...action.payload };
    },

    // Pagination helpers
    nextPage: (state) => {
      state.filters.page = (state.filters.page || 1) + 1;
    },

    prevPage: (state) => {
      if (state.filters.page && state.filters.page > 1) {
        state.filters.page = state.filters.page - 1;
      }
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = Math.max(1, action.payload);
    },

    // Search helpers
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.filters.page = 1; // Reset to first page on search
    },

    clearSearch: (state) => {
      state.filters.search = '';
      state.filters.page = 1;
    },

    // Sort helpers
    setSort: (state, action: PayloadAction<{
      sortBy: ReviewFilters['sortBy'];
      sortOrder: ReviewFilters['sortOrder'];
    }>) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
      state.filters.page = 1; // Reset to first page on sort change
    },

    // Rating filter helpers
    toggleRatingFilter: (state, action: PayloadAction<number>) => {
      const rating = action.payload;
      const ratings = state.filters.rating || [];
      const index = ratings.indexOf(rating);
      
      if (index > -1) {
        state.filters.rating = ratings.filter(r => r !== rating);
      } else {
        state.filters.rating = [...ratings, rating];
      }
      state.filters.page = 1; // Reset to first page on filter change
    },

    clearRatingFilters: (state) => {
      state.filters.rating = [];
      state.filters.page = 1;
    },

    // Date range helpers
    setDateRange: (state, action: PayloadAction<{
      startDate?: string;
      endDate?: string;
    }>) => {
      state.filters.startDate = action.payload.startDate;
      state.filters.endDate = action.payload.endDate;
      state.filters.page = 1; // Reset to first page on filter change
    },

    clearDateRange: (state) => {
      state.filters.startDate = undefined;
      state.filters.endDate = undefined;
      state.filters.page = 1;
    },

    // Course filter helpers
    setCourseFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.courseId = action.payload;
      state.filters.page = 1; // Reset to first page on filter change
    },

    clearCourseFilter: (state) => {
      state.filters.courseId = undefined;
      state.filters.page = 1;
    },
  },
});

export const {
  setFilters,
  resetFilters,
  setSelectedReviews,
  toggleReviewSelection,
  selectAllReviews,
  clearSelectedReviews,
  setViewMode,
  setLoading,
  setError,
  setLastUpdated,
  updateCache,
  clearCache,
  toggleFilters,
  toggleAnalytics,
  toggleSidebar,
  setActiveTab,
  setUIState,
  nextPage,
  prevPage,
  setPage,
  setSearch,
  clearSearch,
  setSort,
  toggleRatingFilter,
  clearRatingFilters,
  setDateRange,
  clearDateRange,
  setCourseFilter,
  clearCourseFilter,
} = reviewSlice.actions;

export default reviewSlice.reducer;
