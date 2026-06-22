import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export interface IStudentCourseProgress {
  courseId: string;
  title: string;
  progress: number;
  completedLectures: number;
  totalLectures: number;
}

export interface IEnrolledStudent {
  _id: string;
  name: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  email: string;
  profileImg?: string;
  enrolledCourses: IStudentCourseProgress[];
}

interface TeacherState {
  enrolledStudents: IEnrolledStudent[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TeacherState = {
  enrolledStudents: [],
  isLoading: false,
  error: null,
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setEnrolledStudents: (state, action: PayloadAction<IEnrolledStudent[]>) => {
      state.enrolledStudents = action.payload;
    },
    resetTeacherState: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setEnrolledStudents,
  resetTeacherState,
} = teacherSlice.actions;

export const selectEnrolledStudents = (state: RootState) => state.teacher.enrolledStudents;
export const selectTeacherLoading = (state: RootState) => state.teacher.isLoading;
export const selectTeacherError = (state: RootState) => state.teacher.error;

export default teacherSlice.reducer;
