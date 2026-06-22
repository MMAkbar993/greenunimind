import { RootState } from "@/redux/store";
import { createSlice } from "@reduxjs/toolkit";

export type TCourse = {
  _id?: string;
  title: string;
  subTitle?: string;
  description?: string;
  category: string;
  courseLevel: "Beginner" | "Medium" | "Advance";
  coursePrice: number;
  courseThumbnail: string;
  enrolledStudents: string[];
  lectures: string[];
  creator: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const initialState = {
  course: null,
  loading: false,
  error: null,
};

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCourse: (state, action) => {
      state.course = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCourse, setLoading, setError } = courseSlice.actions;

export default courseSlice.reducer;

export const selectCurrentCourse = (state: RootState) => state.course.course;
