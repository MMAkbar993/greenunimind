import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Course } from "./courseApi";
import { Lecture } from "../lecture/lectureApi";

// Unified state for course and lecture management
export interface UnifiedCourseState {
  // Course state
  courses: Course[];
  selectedCourse: Course | null;
  coursesLoading: boolean;
  coursesError: string | null;
  
  // Lecture state
  lectures: { [courseId: string]: Lecture[] };
  selectedLecture: Lecture | null;
  lecturesLoading: boolean;
  lecturesError: string | null;
  
  // UI state
  ui: {
    activeTab: 'overview' | 'courses' | 'lectures' | 'analytics';
    viewMode: 'grid' | 'list' | 'table';
    showFilters: boolean;
    showBulkActions: boolean;
    sidebarCollapsed: boolean;
    selectedCourseId: string | null;
    isCreatingCourse: boolean;
    isCreatingLecture: boolean;
    editingCourse: Course | null;
    editingLecture: Lecture | null;
  };
  
  // Filters and search
  filters: {
    search: string;
    category: string[];
    status: string[];
    level: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    page: number;
    limit: number;
  };
  
  // Cache management
  cache: {
    coursesLastFetch: string | null;
    lecturesLastFetch: { [courseId: string]: string };
    totalCourses: number;
    totalLectures: { [courseId: string]: number };
  };
  
  // Optimistic updates
  optimisticUpdates: {
    courses: { [courseId: string]: Partial<Course> };
    lectures: { [lectureId: string]: Partial<Lecture> };
  };
  
  // Bulk operations
  bulkOperations: {
    selectedCourses: string[];
    selectedLectures: string[];
    isProcessing: boolean;
    operation: 'delete' | 'publish' | 'unpublish' | null;
  };
}

const initialState: UnifiedCourseState = {
  courses: [],
  selectedCourse: null,
  coursesLoading: false,
  coursesError: null,
  
  lectures: {},
  selectedLecture: null,
  lecturesLoading: false,
  lecturesError: null,
  
  ui: {
    activeTab: 'overview',
    viewMode: 'table',
    showFilters: true,
    showBulkActions: false,
    sidebarCollapsed: false,
    selectedCourseId: null,
    isCreatingCourse: false,
    isCreatingLecture: false,
    editingCourse: null,
    editingLecture: null,
  },
  
  filters: {
    search: '',
    category: [],
    status: [],
    level: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  },
  
  cache: {
    coursesLastFetch: null,
    lecturesLastFetch: {},
    totalCourses: 0,
    totalLectures: {},
  },
  
  optimisticUpdates: {
    courses: {},
    lectures: {},
  },
  
  bulkOperations: {
    selectedCourses: [],
    selectedLectures: [],
    isProcessing: false,
    operation: null,
  },
};

const unifiedCourseSlice = createSlice({
  name: 'unifiedCourse',
  initialState,
  reducers: {
    // Course actions
    setCoursesLoading: (state, action: PayloadAction<boolean>) => {
      state.coursesLoading = action.payload;
    },
    
    setCoursesError: (state, action: PayloadAction<string | null>) => {
      state.coursesError = action.payload;
    },
    
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
      state.cache.coursesLastFetch = new Date().toISOString();
      state.cache.totalCourses = action.payload.length;
    },
    
    addCourse: (state, action: PayloadAction<Course>) => {
      state.courses.unshift(action.payload);
      state.cache.totalCourses += 1;
    },
    
    updateCourse: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(course => course._id === action.payload._id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
    
    removeCourse: (state, action: PayloadAction<string>) => {
      state.courses = state.courses.filter(course => course._id !== action.payload);
      delete state.lectures[action.payload];
      delete state.cache.lecturesLastFetch[action.payload];
      delete state.cache.totalLectures[action.payload];
      state.cache.totalCourses -= 1;
    },
    
    setSelectedCourse: (state, action: PayloadAction<Course | null>) => {
      state.selectedCourse = action.payload;
      state.ui.selectedCourseId = action.payload?._id || null;
    },
    
    // Lecture actions
    setLecturesLoading: (state, action: PayloadAction<boolean>) => {
      state.lecturesLoading = action.payload;
    },
    
    setLecturesError: (state, action: PayloadAction<string | null>) => {
      state.lecturesError = action.payload;
    },
    
    setLectures: (state, action: PayloadAction<{ courseId: string; lectures: Lecture[] }>) => {
      const { courseId, lectures } = action.payload;
      state.lectures[courseId] = lectures;
      state.cache.lecturesLastFetch[courseId] = new Date().toISOString();
      state.cache.totalLectures[courseId] = lectures.length;
    },
    
    addLecture: (state, action: PayloadAction<{ courseId: string; lecture: Lecture }>) => {
      const { courseId, lecture } = action.payload;
      if (!state.lectures[courseId]) {
        state.lectures[courseId] = [];
      }
      state.lectures[courseId].push(lecture);
      state.cache.totalLectures[courseId] = (state.cache.totalLectures[courseId] || 0) + 1;
    },
    
    updateLecture: (state, action: PayloadAction<{ courseId: string; lecture: Lecture }>) => {
      const { courseId, lecture } = action.payload;
      if (state.lectures[courseId]) {
        const index = state.lectures[courseId].findIndex(l => l._id === lecture._id);
        if (index !== -1) {
          state.lectures[courseId][index] = lecture;
        }
      }
    },
    
    removeLecture: (state, action: PayloadAction<{ courseId: string; lectureId: string }>) => {
      const { courseId, lectureId } = action.payload;
      if (state.lectures[courseId]) {
        state.lectures[courseId] = state.lectures[courseId].filter(l => l._id !== lectureId);
        state.cache.totalLectures[courseId] = Math.max(0, (state.cache.totalLectures[courseId] || 0) - 1);
      }
    },
    
    setSelectedLecture: (state, action: PayloadAction<Lecture | null>) => {
      state.selectedLecture = action.payload;
    },
    
    // UI actions
    setActiveTab: (state, action: PayloadAction<'overview' | 'courses' | 'lectures' | 'analytics'>) => {
      state.ui.activeTab = action.payload;
    },
    
    setViewMode: (state, action: PayloadAction<'grid' | 'list' | 'table'>) => {
      state.ui.viewMode = action.payload;
    },
    
    toggleFilters: (state) => {
      state.ui.showFilters = !state.ui.showFilters;
    },
    
    toggleBulkActions: (state) => {
      state.ui.showBulkActions = !state.ui.showBulkActions;
    },
    
    toggleSidebar: (state) => {
      state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
    },
    
    setCreatingCourse: (state, action: PayloadAction<boolean>) => {
      state.ui.isCreatingCourse = action.payload;
    },
    
    setCreatingLecture: (state, action: PayloadAction<boolean>) => {
      state.ui.isCreatingLecture = action.payload;
    },
    
    setEditingCourse: (state, action: PayloadAction<Course | null>) => {
      state.ui.editingCourse = action.payload;
    },
    
    setEditingLecture: (state, action: PayloadAction<Lecture | null>) => {
      state.ui.editingLecture = action.payload;
    },
    
    // Filter actions
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.filters.page = 1; // Reset to first page when searching
    },
    
    setFilters: (state, action: PayloadAction<Partial<UnifiedCourseState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Optimistic update actions
    addOptimisticCourseUpdate: (state, action: PayloadAction<{ courseId: string; updates: Partial<Course> }>) => {
      const { courseId, updates } = action.payload;
      state.optimisticUpdates.courses[courseId] = updates;
    },
    
    removeOptimisticCourseUpdate: (state, action: PayloadAction<string>) => {
      delete state.optimisticUpdates.courses[action.payload];
    },
    
    addOptimisticLectureUpdate: (state, action: PayloadAction<{ lectureId: string; updates: Partial<Lecture> }>) => {
      const { lectureId, updates } = action.payload;
      state.optimisticUpdates.lectures[lectureId] = updates;
    },
    
    removeOptimisticLectureUpdate: (state, action: PayloadAction<string>) => {
      delete state.optimisticUpdates.lectures[action.payload];
    },
    
    clearOptimisticUpdates: (state) => {
      state.optimisticUpdates.courses = {};
      state.optimisticUpdates.lectures = {};
    },
    
    // Bulk operation actions
    toggleCourseSelection: (state, action: PayloadAction<string>) => {
      const courseId = action.payload;
      const index = state.bulkOperations.selectedCourses.indexOf(courseId);
      if (index === -1) {
        state.bulkOperations.selectedCourses.push(courseId);
      } else {
        state.bulkOperations.selectedCourses.splice(index, 1);
      }
    },
    
    toggleLectureSelection: (state, action: PayloadAction<string>) => {
      const lectureId = action.payload;
      const index = state.bulkOperations.selectedLectures.indexOf(lectureId);
      if (index === -1) {
        state.bulkOperations.selectedLectures.push(lectureId);
      } else {
        state.bulkOperations.selectedLectures.splice(index, 1);
      }
    },
    
    clearSelections: (state) => {
      state.bulkOperations.selectedCourses = [];
      state.bulkOperations.selectedLectures = [];
    },
    
    setBulkOperation: (state, action: PayloadAction<{ operation: 'delete' | 'publish' | 'unpublish' | null; isProcessing: boolean }>) => {
      state.bulkOperations.operation = action.payload.operation;
      state.bulkOperations.isProcessing = action.payload.isProcessing;
    },
    
    // Reset actions
    resetCourseState: (state) => {
      state.courses = [];
      state.selectedCourse = null;
      state.coursesLoading = false;
      state.coursesError = null;
      state.cache.coursesLastFetch = null;
      state.cache.totalCourses = 0;
    },
    
    resetLectureState: (state) => {
      state.lectures = {};
      state.selectedLecture = null;
      state.lecturesLoading = false;
      state.lecturesError = null;
      state.cache.lecturesLastFetch = {};
      state.cache.totalLectures = {};
    },
    
    resetAllState: () => initialState,
  },
});

export const {
  // Course actions
  setCoursesLoading,
  setCoursesError,
  setCourses,
  addCourse,
  updateCourse,
  removeCourse,
  setSelectedCourse,
  
  // Lecture actions
  setLecturesLoading,
  setLecturesError,
  setLectures,
  addLecture,
  updateLecture,
  removeLecture,
  setSelectedLecture,
  
  // UI actions
  setActiveTab,
  setViewMode,
  toggleFilters,
  toggleBulkActions,
  toggleSidebar,
  setCreatingCourse,
  setCreatingLecture,
  setEditingCourse,
  setEditingLecture,
  
  // Filter actions
  setSearch,
  setFilters,
  resetFilters,
  
  // Optimistic update actions
  addOptimisticCourseUpdate,
  removeOptimisticCourseUpdate,
  addOptimisticLectureUpdate,
  removeOptimisticLectureUpdate,
  clearOptimisticUpdates,
  
  // Bulk operation actions
  toggleCourseSelection,
  toggleLectureSelection,
  clearSelections,
  setBulkOperation,
  
  // Reset actions
  resetCourseState,
  resetLectureState,
  resetAllState,
} = unifiedCourseSlice.actions;

export default unifiedCourseSlice.reducer;
