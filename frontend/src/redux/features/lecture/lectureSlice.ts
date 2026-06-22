import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ILecture {
  _id?: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl: string;
  pdfUrl?: string;
  isPreviewFree: boolean;
  courseId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// For the Redux slice state
export interface ILectureState {
  lectures: ILecture[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: {
    video: number;
    pdf: number;
  };
  optimisticUpdates: {
    [lectureId: string]: Partial<ILecture>;
  };
  lastUpdated: string | null;
  cache: {
    [courseId: string]: {
      lectures: ILecture[];
      lastFetched: string;
    };
  };
}
const initialState: ILectureState = {
  lectures: [],
  isLoading: false,
  error: null,
  uploadProgress: {
    video: 0,
    pdf: 0,
  },
  optimisticUpdates: {},
  lastUpdated: null,
  cache: {},
};

const lectureSlice = createSlice({
  name: "lecture",
  initialState,
  reducers: {
    // For general loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // For error messages
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // For storing lectures list
    setLectures: (state, action: PayloadAction<ILecture[]>) => {
      state.lectures = action.payload;
    },

    // For adding a single lecture
    addLecture: (state, action: PayloadAction<ILecture>) => {
      state.lectures.push(action.payload);
    },

    // For upload progress tracking
    setVideoUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress.video = action.payload;
    },

    setPdfUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress.pdf = action.payload;
    },

    // Reset upload progress
    resetUploadProgress: (state) => {
      state.uploadProgress = {
        video: 0,
        pdf: 0,
      };
    },

    // Reset entire state
    resetLectureState: () => initialState,

    // Enhanced actions for performance optimization
    addOptimisticUpdate: (state, action: PayloadAction<{ lectureId: string; updates: Partial<ILecture> }>) => {
      state.optimisticUpdates[action.payload.lectureId] = action.payload.updates;
    },

    removeOptimisticUpdate: (state, action: PayloadAction<string>) => {
      delete state.optimisticUpdates[action.payload];
    },

    clearOptimisticUpdates: (state) => {
      state.optimisticUpdates = {};
    },

    updateLectureInCache: (state, action: PayloadAction<{ courseId: string; lecture: ILecture }>) => {
      const { courseId, lecture } = action.payload;
      if (state.cache[courseId]) {
        const lectureIndex = state.cache[courseId].lectures.findIndex(l => l._id === lecture._id);
        if (lectureIndex !== -1) {
          state.cache[courseId].lectures[lectureIndex] = lecture;
        } else {
          state.cache[courseId].lectures.push(lecture);
        }
      }
      state.lastUpdated = new Date().toISOString();
    },

    setCacheForCourse: (state, action: PayloadAction<{ courseId: string; lectures: ILecture[] }>) => {
      const { courseId, lectures } = action.payload;
      state.cache[courseId] = {
        lectures,
        lastFetched: new Date().toISOString(),
      };
      state.lastUpdated = new Date().toISOString();
    },

    clearCacheForCourse: (state, action: PayloadAction<string>) => {
      delete state.cache[action.payload];
    },

    clearAllCache: (state) => {
      state.cache = {};
    },
  },
});

export const {
  setLoading,
  setError,
  setLectures,
  addLecture,
  setVideoUploadProgress,
  setPdfUploadProgress,
  resetUploadProgress,
  resetLectureState,
  addOptimisticUpdate,
  removeOptimisticUpdate,
  clearOptimisticUpdates,
  updateLectureInCache,
  setCacheForCourse,
  clearCacheForCourse,
  clearAllCache,
} = lectureSlice.actions;

export default lectureSlice.reducer;
