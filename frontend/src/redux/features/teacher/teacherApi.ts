import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setEnrolledStudents, setError, setLoading } from "./teacherSlice";

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all enrolled students for a teacher's courses
    getEnrolledStudents: builder.query({
      query: (teacherId) => {
        if (!teacherId) {
          throw new Error("Teacher ID is required");
        }
        return {
          url: `/teachers/${teacherId}/enrolled-students`,
          method: "GET",
        };
      },
      providesTags: ["enrolledStudents"],
      transformResponse: (response: TResponseRedux<any>) => {
        return {
          data: response.data || [],
        };
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(setEnrolledStudents(data.data));
        } catch (error) {
          dispatch(setError("Failed to fetch enrolled students"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Get student progress for a specific course
    getStudentCourseProgress: builder.query({
      query: ({ studentId, courseId }) => {
        if (!studentId || !courseId) {
          throw new Error("Student ID and Course ID are required");
        }
        return {
          url: `/students/${studentId}/course-progress/${courseId}`,
          method: "GET",
        };
      },
      providesTags: ["courseProgress"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
    }),
  }),
});

export const {
  useGetEnrolledStudentsQuery,
  useGetStudentCourseProgressQuery,
} = teacherApi;
