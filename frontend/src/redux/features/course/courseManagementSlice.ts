import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { 
  CourseFilters, 
  CourseViewMode, 
  CourseSortField, 
  CourseTableColumn,
  EnhancedCourse,
  CourseStats,
  CourseBulkAction,
  CourseStatus
} from "@/types/course-management";

interface CourseManagementState {
  filters: CourseFilters;
  selectedCourses: string[];
  viewMode: CourseViewMode;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Table configuration
  tableColumns: CourseTableColumn[];
  columnOrder: string[];
  
  // UI state
  ui: {
    showFilters: boolean;
    showBulkActions: boolean;
    showAnalytics: boolean;
    sidebarCollapsed: boolean;
    activeTab: 'overview' | 'courses' | 'analytics' | 'insights';
    tableView: 'comfortable' | 'compact' | 'spacious';
  };
  
  // Cache
  cache: {
    courses: EnhancedCourse[];
    stats: CourseStats | null;
    lastFetch: string | null;
    totalCount: number;
  };
  
  // Saved filters
  savedFilters: Array<{
    id: string;
    name: string;
    filters: CourseFilters;
    isDefault: boolean;
    createdAt: string;
  }>;
  
  // Bulk operations
  bulkOperation: {
    isActive: boolean;
    action: CourseBulkAction | null;
    progress: number;
    total: number;
    completed: number;
    failed: number;
    errors: Array<{ courseId: string; error: string }>;
  };
}

const defaultTableColumns: CourseTableColumn[] = [
  {
    key: 'title',
    label: 'Course',
    sortable: true,
    filterable: true,
    width: 300,
    minWidth: 200,
    visible: true,
    resizable: true,
    align: 'left',
    type: 'text'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    width: 120,
    minWidth: 100,
    visible: true,
    resizable: true,
    align: 'center',
    type: 'status'
  },
  {
    key: 'enrollments',
    label: 'Students',
    sortable: true,
    filterable: true,
    width: 100,
    minWidth: 80,
    visible: true,
    resizable: true,
    align: 'right',
    type: 'number'
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    filterable: true,
    width: 100,
    minWidth: 80,
    visible: true,
    resizable: true,
    align: 'right',
    type: 'currency'
  },
  {
    key: 'revenue',
    label: 'Revenue',
    sortable: true,
    filterable: false,
    width: 120,
    minWidth: 100,
    visible: true,
    resizable: true,
    align: 'right',
    type: 'currency'
  },
  {
    key: 'rating',
    label: 'Rating',
    sortable: true,
    filterable: true,
    width: 100,
    minWidth: 80,
    visible: true,
    resizable: true,
    align: 'center',
    type: 'rating'
  },
  {
    key: 'updatedAt',
    label: 'Last Updated',
    sortable: true,
    filterable: true,
    width: 140,
    minWidth: 120,
    visible: true,
    resizable: true,
    align: 'right',
    type: 'date'
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    filterable: false,
    width: 120,
    minWidth: 120,
    visible: true,
    resizable: false,
    align: 'center',
    type: 'text'
  }
];

const initialState: CourseManagementState = {
  filters: {
    search: '',
    status: [],
    category: [],
    level: [],
    priceRange: { min: 0, max: 10000 },
    isFree: undefined,
    dateRange: {},
    enrollmentRange: { min: 0, max: 10000 },
    ratingRange: { min: 0, max: 5 },
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    tags: [],
    instructor: '',
    language: '',
    duration: { min: 0, max: 1000 }
  },
  selectedCourses: [],
  viewMode: 'table',
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  tableColumns: defaultTableColumns,
  columnOrder: defaultTableColumns.map(col => col.key),
  
  ui: {
    showFilters: true,
    showBulkActions: false,
    showAnalytics: true,
    sidebarCollapsed: false,
    activeTab: 'overview',
    tableView: 'comfortable'
  },
  
  cache: {
    courses: [],
    stats: null,
    lastFetch: null,
    totalCount: 0
  },
  
  savedFilters: [
    {
      id: 'all-courses',
      name: 'All Courses',
      filters: {
        search: '',
        status: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: 1,
        limit: 20
      },
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'published-courses',
      name: 'Published Courses',
      filters: {
        search: '',
        status: ['published'],
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: 1,
        limit: 20
      },
      isDefault: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'draft-courses',
      name: 'Draft Courses',
      filters: {
        search: '',
        status: ['draft'],
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: 1,
        limit: 20
      },
      isDefault: false,
      createdAt: new Date().toISOString()
    }
  ],
  
  bulkOperation: {
    isActive: false,
    action: null,
    progress: 0,
    total: 0,
    completed: 0,
    failed: 0,
    errors: []
  }
};

const courseManagementSlice = createSlice({
  name: "courseManagement",
  initialState,
  reducers: {
    // Filter management
    setFilters: (state, action: PayloadAction<Partial<CourseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      if (Object.keys(action.payload).some(key => key !== 'page')) {
        state.filters.page = 1;
      }
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.filters.page = 1;
    },

    clearSearch: (state) => {
      state.filters.search = '';
      state.filters.page = 1;
    },

    setSort: (state, action: PayloadAction<{
      sortBy: CourseSortField;
      sortOrder: 'asc' | 'desc';
    }>) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
      state.filters.page = 1;
    },

    // Selection management
    setSelectedCourses: (state, action: PayloadAction<string[]>) => {
      state.selectedCourses = action.payload;
      state.ui.showBulkActions = action.payload.length > 0;
    },

    toggleCourseSelection: (state, action: PayloadAction<string>) => {
      const courseId = action.payload;
      const index = state.selectedCourses.indexOf(courseId);
      if (index > -1) {
        state.selectedCourses.splice(index, 1);
      } else {
        state.selectedCourses.push(courseId);
      }
      state.ui.showBulkActions = state.selectedCourses.length > 0;
    },

    selectAllCourses: (state, action: PayloadAction<string[]>) => {
      state.selectedCourses = action.payload;
      state.ui.showBulkActions = action.payload.length > 0;
    },

    clearSelectedCourses: (state) => {
      state.selectedCourses = [];
      state.ui.showBulkActions = false;
    },

    // View mode management
    setViewMode: (state, action: PayloadAction<CourseViewMode>) => {
      state.viewMode = action.payload;
    },

    // Table configuration
    updateTableColumn: (state, action: PayloadAction<{
      key: string;
      updates: Partial<CourseTableColumn>;
    }>) => {
      const { key, updates } = action.payload;
      const columnIndex = state.tableColumns.findIndex(col => col.key === key);
      if (columnIndex > -1) {
        state.tableColumns[columnIndex] = { ...state.tableColumns[columnIndex], ...updates };
      }
    },

    reorderColumns: (state, action: PayloadAction<string[]>) => {
      state.columnOrder = action.payload;
    },

    resetTableColumns: (state) => {
      state.tableColumns = defaultTableColumns;
      state.columnOrder = defaultTableColumns.map(col => col.key);
    },

    // UI state management
    toggleFilters: (state) => {
      state.ui.showFilters = !state.ui.showFilters;
    },

    toggleAnalytics: (state) => {
      state.ui.showAnalytics = !state.ui.showAnalytics;
    },

    toggleSidebar: (state) => {
      state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
    },

    setActiveTab: (state, action: PayloadAction<'overview' | 'courses' | 'analytics' | 'insights'>) => {
      state.ui.activeTab = action.payload;
    },

    setTableView: (state, action: PayloadAction<'comfortable' | 'compact' | 'spacious'>) => {
      state.ui.tableView = action.payload;
    },

    setUIState: (state, action: PayloadAction<Partial<CourseManagementState['ui']>>) => {
      state.ui = { ...state.ui, ...action.payload };
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setLastUpdated: (state, action: PayloadAction<string>) => {
      state.lastUpdated = action.payload;
    },

    // Cache management
    updateCache: (state, action: PayloadAction<{
      courses?: EnhancedCourse[];
      stats?: CourseStats;
      totalCount?: number;
    }>) => {
      if (action.payload.courses) {
        state.cache.courses = action.payload.courses;
      }
      if (action.payload.stats) {
        state.cache.stats = action.payload.stats;
      }
      if (action.payload.totalCount !== undefined) {
        state.cache.totalCount = action.payload.totalCount;
      }
      state.cache.lastFetch = new Date().toISOString();
    },

    clearCache: (state) => {
      state.cache = initialState.cache;
    },

    // Saved filters management
    saveFilter: (state, action: PayloadAction<{
      name: string;
      filters: CourseFilters;
    }>) => {
      const { name, filters } = action.payload;
      const id = `filter-${Date.now()}`;
      state.savedFilters.push({
        id,
        name,
        filters,
        isDefault: false,
        createdAt: new Date().toISOString()
      });
    },

    deleteFilter: (state, action: PayloadAction<string>) => {
      const filterId = action.payload;
      state.savedFilters = state.savedFilters.filter(filter => 
        filter.id !== filterId && !filter.isDefault
      );
    },

    loadFilter: (state, action: PayloadAction<string>) => {
      const filterId = action.payload;
      const savedFilter = state.savedFilters.find(filter => filter.id === filterId);
      if (savedFilter) {
        state.filters = { ...savedFilter.filters };
      }
    },

    // Bulk operations
    startBulkOperation: (state, action: PayloadAction<{
      action: CourseBulkAction;
      total: number;
    }>) => {
      state.bulkOperation = {
        isActive: true,
        action: action.payload.action,
        progress: 0,
        total: action.payload.total,
        completed: 0,
        failed: 0,
        errors: []
      };
    },

    updateBulkProgress: (state, action: PayloadAction<{
      completed: number;
      failed?: number;
      errors?: Array<{ courseId: string; error: string }>;
    }>) => {
      state.bulkOperation.completed = action.payload.completed;
      if (action.payload.failed !== undefined) {
        state.bulkOperation.failed = action.payload.failed;
      }
      if (action.payload.errors) {
        state.bulkOperation.errors.push(...action.payload.errors);
      }
      state.bulkOperation.progress = 
        (state.bulkOperation.completed + state.bulkOperation.failed) / state.bulkOperation.total * 100;
    },

    completeBulkOperation: (state) => {
      state.bulkOperation.isActive = false;
      state.bulkOperation.action = null;
      state.selectedCourses = [];
      state.ui.showBulkActions = false;
    },

    cancelBulkOperation: (state) => {
      state.bulkOperation = initialState.bulkOperation;
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

    // Status filter helpers
    toggleStatusFilter: (state, action: PayloadAction<CourseStatus>) => {
      const status = action.payload;
      const statuses = state.filters.status || [];
      const index = statuses.indexOf(status);
      
      if (index > -1) {
        state.filters.status = statuses.filter(s => s !== status);
      } else {
        state.filters.status = [...statuses, status];
      }
      state.filters.page = 1;
    },

    clearStatusFilters: (state) => {
      state.filters.status = [];
      state.filters.page = 1;
    },

    // Category filter helpers
    toggleCategoryFilter: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      const categories = state.filters.category || [];
      const index = categories.indexOf(category);
      
      if (index > -1) {
        state.filters.category = categories.filter(c => c !== category);
      } else {
        state.filters.category = [...categories, category];
      }
      state.filters.page = 1;
    },

    clearCategoryFilters: (state) => {
      state.filters.category = [];
      state.filters.page = 1;
    },

    // Price range helpers
    setPriceRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.filters.priceRange = action.payload;
      state.filters.page = 1;
    },

    clearPriceRange: (state) => {
      state.filters.priceRange = { min: 0, max: 10000 };
      state.filters.page = 1;
    },

    // Date range helpers
    setDateRange: (state, action: PayloadAction<{
      startDate?: string;
      endDate?: string;
    }>) => {
      state.filters.dateRange = action.payload;
      state.filters.page = 1;
    },

    clearDateRange: (state) => {
      state.filters.dateRange = {};
      state.filters.page = 1;
    }
  },
});

export const {
  setFilters,
  resetFilters,
  setSearch,
  clearSearch,
  setSort,
  setSelectedCourses,
  toggleCourseSelection,
  selectAllCourses,
  clearSelectedCourses,
  setViewMode,
  updateTableColumn,
  reorderColumns,
  resetTableColumns,
  toggleFilters,
  toggleAnalytics,
  toggleSidebar,
  setActiveTab,
  setTableView,
  setUIState,
  setLoading,
  setError,
  setLastUpdated,
  updateCache,
  clearCache,
  saveFilter,
  deleteFilter,
  loadFilter,
  startBulkOperation,
  updateBulkProgress,
  completeBulkOperation,
  cancelBulkOperation,
  nextPage,
  prevPage,
  setPage,
  toggleStatusFilter,
  clearStatusFilters,
  toggleCategoryFilter,
  clearCategoryFilters,
  setPriceRange,
  clearPriceRange,
  setDateRange,
  clearDateRange,
} = courseManagementSlice.actions;

export default courseManagementSlice.reducer;
