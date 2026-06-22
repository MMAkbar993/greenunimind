import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setError, setLoading, addOptimisticUpdate, removeOptimisticUpdate } from "./lectureSlice";
import { toast } from "sonner";
import { courseApi } from "../course/courseApi";
import { store } from "@/redux/store";

// Enhanced types for better type safety
export interface Lecture {
  _id: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl?: string;
  videoResolutions?: Array<{
    url: string;
    quality: string;
    format?: string;
  }>;
  hlsUrl?: string;
  audioUrl?: string;
  articleContent?: string;
  pdfUrl?: string;
  isPreviewFree: boolean;
  courseId: string;
  order: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLectureRequest {
  lectureTitle: string;
  instruction?: string;
  videoUrl?: string;
  videoResolutions?: Array<{
    url: string;
    quality: string;
    format?: string;
  }>;
  hlsUrl?: string;
  audioUrl?: string;
  articleContent?: string;
  pdfUrl?: string;
  isPreviewFree?: boolean;
}

export interface UpdateLectureRequest extends Partial<CreateLectureRequest> {
  order?: number;
}

export const lectureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createLecture: builder.mutation<
      { data: Lecture },
      { id: string; data: CreateLectureRequest }
    >({
      query: (args) => ({
        url: `/lectures/${args.id}/create-lecture`,
        method: "POST",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<Lecture>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        // Create optimistic update
        const optimisticId = `temp-${Date.now()}`;
        const optimisticLecture = {
          _id: optimisticId,
          lectureTitle: args.data.lectureTitle,
          instruction: args.data.instruction,
          videoUrl: args.data.videoUrl || "",
          audioUrl: args.data.audioUrl,
          articleContent: args.data.articleContent,
          pdfUrl: args.data.pdfUrl,
          isPreviewFree: args.data.isPreviewFree || false,
          courseId: args.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        dispatch(addOptimisticUpdate({ lectureId: optimisticId, updates: optimisticLecture }));

        try {
          const { data } = await queryFulfilled;
          dispatch(removeOptimisticUpdate(optimisticId));
          toast.success("Lecture created successfully!");
        } catch (error: any) {
          dispatch(removeOptimisticUpdate(optimisticId));
          const errorMessage = error?.error?.data?.message || "Failed to create lecture";
          dispatch(setError(errorMessage));
          toast.error(errorMessage);
        }
      },
      invalidatesTags: (_, __, args) => [
        // Lecture-specific invalidations
        { type: "lectures", id: args.id },
        { type: "lecture-list", id: args.id },
        { type: "lecture", id: "LIST" },
        "lectures",
        // Course-specific invalidations
        { type: "course", id: args.id },
        { type: "course-details", id: args.id },
        { type: "course-lectures", id: args.id },
        "courses",
        "course",
        // Creator-specific invalidations (invalidate for all teachers since we don't know the teacher ID)
        "course-creator",
        "creator-courses",
        "creator-lectures",
        "course-list"
      ],
    }),

    getLectureByCourseId: builder.query({
      query: (args) => {
        // Check if id is valid
        if (!args.id) {
          throw new Error('Course ID is required');
        }

        return {
          url: `/lectures/${args.id}/get-lectures?_t=${Date.now()}`,
          method: "GET",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        };
      },
      providesTags: (result, error, args) => [
        { type: "lectures", id: args.id },
        { type: "lecture", id: "LIST" },
        ...(result?.data || []).map((lecture: any) => ({ type: "lecture" as const, id: lecture._id }))
      ],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data
      }),
      // Enhanced cache management for real-time updates
      keepUnusedDataFor: 30, // 30 seconds for faster updates
      // Force refetch when arguments change
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error: any) {
          if (error?.error?.status === 403) {
            dispatch(setError("You don't have permission to access these lectures"));
          } else if (error?.error?.status === 404) {
            dispatch(setError("Course not found"));
          } else if (error?.error?.status === 401) {
            dispatch(setError("You need to be logged in to access lectures"));
          } else {
            dispatch(setError("Error fetching lectures"));
          }
        }
      },
    }),

    getLectureById: builder.query({
      query: (args) => {
        // Check if id is valid
        if (!args.id) {
          throw new Error('Lecture ID is required');
        }
        return {
          url: `/lectures/${args.id}?_t=${Date.now()}`,
          method: "GET",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        };
      },
      providesTags: (result, error, args) => [
        { type: "lecture", id: args.id },
        "lectures"
      ],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      // Add error handling
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error: any) {
          console.error("Error fetching lecture:", error);

          // Check if it's an access error (403)
          if (error?.error?.status === 403) {
            dispatch(setError("You must be enrolled in this course to access this lecture"));
          } else if (error?.error?.status === 404) {
            dispatch(setError("Lecture not found"));
          } else if (error?.error?.status === 401) {
            dispatch(setError("You need to be logged in to access this lecture"));
          } else {
            dispatch(setError("Error fetching lecture"));
          }
        }
      },
    }),

    updateLectureOrder: builder.mutation({
      query: (args) => ({
        url: `/lectures/${args.id}/update-order`,
        method: "PATCH",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));

        // Optimistic update for lecture order
        const patchResult = dispatch(
          lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.id }, (draft) => {
            // Update the order based on the provided data
            if (args.data.lectures && Array.isArray(args.data.lectures)) {
              args.data.lectures.forEach((lectureUpdate: { lectureId: string; order: number }) => {
                const lectureIndex = draft.data.findIndex((l: any) => l._id === lectureUpdate.lectureId);
                if (lectureIndex !== -1) {
                  draft.data[lectureIndex].order = lectureUpdate.order;
                }
              });

              // Sort lectures by order to reflect the new arrangement
              draft.data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            }
          })
        );

        try {
          const result = await queryFulfilled;

          // Update with real data from server if available
          if (result.data.data) {
            dispatch(
              lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.id }, (draft) => {
                draft.data = result.data.data;
              })
            );
          }

          // Force immediate cache invalidation to ensure all components refresh
          setTimeout(() => {
            dispatch(baseApi.util.invalidateTags([
              'lectures',
              'course',
              { type: 'lectures', id: args.id },
              { type: 'course', id: args.id },
              { type: 'lecture', id: 'LIST' }
            ]));
          }, 0);

        } catch (error) {
          // Revert optimistic updates on error
          patchResult.undo();
          dispatch(setError("Error updating lecture order"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "lectures", id: args.id },
        { type: "lecture", id: "LIST" },
        "lectures",
        "courses", // Invalidate all courses since course data includes lectures
        "course",
        { type: "course", id: args.id }
      ],
    }),
    updateLecture: builder.mutation({
      query: (args: {
        courseId: string;
        lectureId: string;
        data: Partial<{
          lectureTitle: string;
          instruction: string;
          videoUrl: string;
          audioUrl: string;
          articleContent: string;
          pdfUrl: string;
          isPreviewFree: boolean;
          duration?: number;
        }>;
      }) => ({
        url: `/lectures/${args.courseId}/update-lecture/${args.lectureId}`,
        method: "PATCH",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled, getState }) => {
        dispatch(setLoading(true));

        // Get teacher ID from state for targeted cache invalidation
        const state = getState() as any;
        const teacherId = state.auth?.user?._id;

        // Optimistic update for immediate UI feedback in lecture list
        const optimisticPatchResult = dispatch(
          lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.courseId }, (draft) => {
            const lectureIndex = draft.data.findIndex((lecture: any) => lecture._id === args.lectureId);
            if (lectureIndex !== -1) {
              Object.assign(draft.data[lectureIndex], args.data);
              draft.data[lectureIndex].updatedAt = new Date().toISOString();
            }
          })
        );

        // CRITICAL: Optimistic update for creator courses (parent course data)
        let creatorOptimisticPatch: any = null;
        if (teacherId) {
          creatorOptimisticPatch = dispatch(
            courseApi.util.updateQueryData('getCreatorCourse', { id: teacherId }, (draft) => {
              if (draft?.data) {
                const courseIndex = draft.data.findIndex((course: any) => course._id === args.courseId);
                if (courseIndex !== -1 && draft.data[courseIndex].lectures) {
                  const lectureIndex = draft.data[courseIndex].lectures.findIndex(
                    (lecture: any) => lecture._id === args.lectureId
                  );
                  if (lectureIndex !== -1) {
                    Object.assign(draft.data[courseIndex].lectures[lectureIndex], args.data);
                    draft.data[courseIndex].lectures[lectureIndex].updatedAt = new Date().toISOString();
                    // Update course's updatedAt to reflect the change
                    draft.data[courseIndex].updatedAt = new Date().toISOString();
                  }
                }
              }
            })
          );
        }

        try {
          const result = await queryFulfilled;

          // Import cache utilities
          const { cascadeInvalidateLectureUpdate, syncLectureUpdateAcrossViews } = await import('@/utils/cacheUtils');

          // Use enhanced cascade invalidation
          cascadeInvalidateLectureUpdate(args.lectureId, args.courseId, teacherId);

          // Sync updates across all views for real-time UI updates
          syncLectureUpdateAcrossViews(args.lectureId, args.courseId, args.data, teacherId);

          // Additional immediate invalidation for critical endpoints
          setTimeout(() => {
            dispatch(baseApi.util.invalidateTags([
              'courses',
              'lectures',
              ...(teacherId ? [{ type: 'courses' as const, id: `creator-${teacherId}` }] : [])
            ]));
          }, 100);

        } catch (error) {
          // Revert optimistic updates on error
          optimisticPatchResult.undo();
          if (creatorOptimisticPatch) {
            creatorOptimisticPatch.undo();
          }
          dispatch(setError("Error updating lecture"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: (result, error, args) => {
        const state = store.getState() as any;
        const teacherId = state.auth?.user?._id;

        const tags: any[] = [
          // Specific lecture invalidations
          { type: "lecture", id: args.lectureId },
          { type: "lecture-details", id: args.lectureId },
          { type: "lectures", id: args.courseId },
          { type: "lecture-list", id: args.courseId },
          { type: "lecture", id: "LIST" },

          // Specific course invalidations
          { type: "course", id: args.courseId },
          { type: "course-details", id: args.courseId },
          { type: "course-lectures", id: args.courseId },
          { type: "courses", id: "LIST" },

          // General invalidations for complete consistency
          "lectures",
          "courses",
          "course"
        ];

        if (teacherId) {
          tags.push(
            { type: "course-creator", id: teacherId },
            { type: "creator-courses", id: teacherId },
            { type: "creator-lectures", id: teacherId },
            { type: "course-list", id: teacherId },
            { type: "courses", id: `creator-${teacherId}` }
          );
        } else {
          // Fallback to broader invalidation if teacherId is not available
          tags.push(
            "course-creator",
            "creator-courses",
            "creator-lectures",
            "course-list"
          );
        }
        
        return tags;
      },
    }),

    deleteLecture: builder.mutation<
      { data: { message: string } },
      { courseId: string; lectureId: string }
    >({
      query: (args) => ({
        url: `/lectures/${args.courseId}/delete-lecture/${args.lectureId}`,
        method: "DELETE",
      }),
      transformResponse: (response: TResponseRedux<{ message: string }>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        // Optimistic update - remove lecture from cache
        const patchResult = dispatch(
          lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.courseId }, (draft) => {
            if (draft.data) {
              draft.data = draft.data.filter((lecture: any) => lecture._id !== args.lectureId);
            }
          })
        );

        try {
          await queryFulfilled;
          toast.success("Lecture deleted successfully!");
        } catch (error: any) {
          // Revert optimistic update on error
          patchResult.undo();
          const errorMessage = error?.error?.data?.message || "Failed to delete lecture";
          dispatch(setError(errorMessage));
          toast.error(errorMessage);
        }
      },
      invalidatesTags: (_, __, args) => [
        { type: "lectures", id: args.courseId },
        { type: "lecture", id: "LIST" },
        "lectures",
        "courses", // Invalidate all courses since course data includes lectures
        "course",
        { type: "course", id: args.courseId }
      ],
    }),
  }),
});

export const {
  useCreateLectureMutation,
  useGetLectureByIdQuery,
  useGetLectureByCourseIdQuery,
  useUpdateLectureOrderMutation,
  useUpdateLectureMutation,
  useDeleteLectureMutation,
} = lectureApi;