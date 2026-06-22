import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export interface ICourseProgress {
  courseId: string;
  completedLectures: string[];
  certificateGenerated?: boolean;
  enrolledAt?: Date;
}

export interface IEnrolledCourse {
  _id: string;
  title: string;
  description: string;
  courseThumbnail: string;
  instructor: {
    _id: string;
    name: string;
  };
  totalLectures: number;
  completedLectures: number;
  progress: number;
  certificateGenerated: boolean;
}

interface StudentState {
  enrolledCourses: IEnrolledCourse[];
  courseProgress: {
    totalLectures: number;
    completedLectures: number;
    percentage: number;
    certificateGenerated: boolean;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  enrolledCourses: [],
  courseProgress: null,
  isLoading: false,
  error: null,
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setEnrolledCourses: (state, action: PayloadAction<IEnrolledCourse[]>) => {
      state.enrolledCourses = action.payload;
    },
    setCourseProgress: (
      state,
      action: PayloadAction<{
        totalLectures: number;
        completedLectures: number;
        percentage: number;
        certificateGenerated: boolean;
      }>
    ) => {
      state.courseProgress = action.payload;
    },
    resetStudentState: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setEnrolledCourses,
  setCourseProgress,
  resetStudentState,
} = studentSlice.actions;

export const selectEnrolledCourses = (state: RootState) => state.student.enrolledCourses;
export const selectCourseProgress = (state: RootState) => state.student.courseProgress;
export const selectStudentLoading = (state: RootState) => state.student.isLoading;
export const selectStudentError = (state: RootState) => state.student.error;

export default studentSlice.reducer;
