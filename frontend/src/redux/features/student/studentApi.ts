import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setError, setLoading } from "./studentSlice";

export const studentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnrolledCourses: builder.query({
      query: (params) => {
        const studentId = typeof params === 'string' ? params : params?.studentId;

        if (!studentId) {
          throw new Error('Student ID is required');
        }

        return {
          url: `/students/${studentId}/enrolled-courses-progress`,
          method: "GET",
        };
      },
      providesTags: (result, error, params) => {
        const studentId = typeof params === 'string' ? params : params?.studentId;
        return [
          { type: "enrolledCourses", id: studentId },
          "enrolledCourses"
        ];
      },
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
    }),

    getCourseProgress: builder.query({
      query: ({ studentId, courseId }) => {
        // Check if studentId and courseId are valid before making the request
        if (!studentId || !courseId) {
          throw new Error('Student ID and Course ID are required');
        }
        return {
          url: `/students/${studentId}/course-progress/${courseId}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { studentId, courseId }) => [
        { type: "courseProgress", id: `${studentId}-${courseId}` },
        "courseProgress"
      ],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
    }),

    // Mark a lecture as complete
    markLectureComplete: builder.mutation({
      query: ({ studentId, courseId, lectureId }) => {
        // Check if all required parameters are valid
        if (!studentId || !courseId || !lectureId) {
          throw new Error('Student ID, Course ID, and Lecture ID are required');
        }
        return {
          url: `/students/${studentId}/mark-lecture-complete`,
          method: "POST",
          body: { courseId, lectureId },
        };
      },
      invalidatesTags: (result, error, { studentId, courseId }) => [
        { type: "courseProgress", id: `${studentId}-${courseId}` },
        { type: "enrolledCourses", id: studentId },
        "courseProgress",
        "enrolledCourses"
      ],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));

        // Optimistic update for course progress
        const progressPatchResult = dispatch(
          studentApi.util.updateQueryData('getCourseProgress',
            { studentId: args.studentId, courseId: args.courseId },
            (draft) => {
              if (draft?.data?.completedLectures) {
                if (!draft.data.completedLectures.includes(args.lectureId)) {
                  draft.data.completedLectures.push(args.lectureId);
                }
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch (error) {
          // Revert optimistic update on error
          progressPatchResult.undo();
          console.error("Error marking lecture as complete:", error);
          dispatch(setError("Error marking lecture as complete"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    // Generate certificate - backend streams back a PDF (or a JSON error), so
    // the response is read as a blob unless the server responded with JSON.
    generateCertificate: builder.mutation<Blob, { studentId: string; courseId: string }>({
      query: ({ studentId, courseId }) => {
        // Check if studentId and courseId are valid
        if (!studentId || !courseId) {
          throw new Error('Student ID and Course ID are required');
        }
        return {
          url: `/students/${studentId}/generate-certificate/${courseId}`,
          method: "POST",
          responseHandler: async (response: Response) => {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              return response.json();
            }
            return response.blob();
          },
          cache: "no-cache",
        };
      },
      invalidatesTags: ["courseProgress", "enrolledCourses"],
    }),
  }),
});

export const {
  useGetEnrolledCoursesQuery,
  useGetCourseProgressQuery,
  useMarkLectureCompleteMutation,
  useGenerateCertificateMutation,
} = studentApi;
