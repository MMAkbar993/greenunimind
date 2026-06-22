import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setError, setLoading } from "./courseSlice";
import { toast } from "sonner";

// Enhanced types for better type safety
export interface Lecture {
  _id: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl?: string;
  pdfUrl?: string;
  isPreviewFree?: boolean;
  courseId: string;
  order?: number;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  subcategory?: string;
  courseLevel: "Beginner" | "Medium" | "Advance";
  coursePrice: number;
  courseThumbnail: string;
  enrolledStudents: string[];
  lectures: string[] | Lecture[]; // Support both lecture IDs and populated lecture objects
  creator: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  totalLectures?: number;
  totalDuration?: number;
  averageRating?: number;
  totalReviews?: number;
}

export interface CreateCourseRequest {
  title: string;
  subtitle?: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  courseLevel: "Beginner" | "Medium" | "Advance";
  coursePrice: number;
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  isPublished?: boolean;
}

export interface GetCoursesParams {
  teacherId?: string;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const courseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCourse: builder.mutation<
      { data: Course },
      { id: string; data: CreateCourseRequest | FormData; file?: File }
    >({
      query: (args) => {
        // If data is already FormData, use it directly
        if (args.data instanceof FormData) {
          // Add thumbnail if provided and not already in FormData
          if (args.file && !args.data.has("file")) {
            args.data.append("file", args.file);
          }
          return {
            url: `/courses/create-course/${args.id}`,
            method: "POST",
            body: args.data,
          };
        }

        // Otherwise, create FormData from object
        const formData = new FormData();

        // Add course data to FormData
        Object.keys(args.data).forEach((key) => {
          const value = args.data[key as keyof CreateCourseRequest];
          if (value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        // Add thumbnail if provided
        if (args.file) {
          formData.append("file", args.file);
        }

        return {
          url: `/courses/create-course/${args.id}`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: TResponseRedux<Course>) => ({
        data: response.data,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
          toast.success("Course created successfully!");

          // Force refetch of published courses to ensure immediate visibility
          dispatch(courseApi.util.invalidateTags([
            "courses",
            { type: "courses", id: "published" }
          ]));
        } catch (error: any) {
          const errorMessage = error?.error?.data?.message || "Failed to create course";
          dispatch(setError(errorMessage));
          toast.error(errorMessage);
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: (_, __, args) => [
        // Invalidate all course-related caches
        "courses", // General courses tag
        { type: "courses", id: "LIST" }, // Course list
        { type: "courses", id: "published" }, // Published courses
        { type: "courses", id: `creator-${args.id}` }, // Creator-specific courses
        "course" // Individual course tag
      ],
    }),

    getCourses: builder.query<
      { data: Course[]; meta?: any },
      GetCoursesParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.teacherId) searchParams.append('teacherId', params.teacherId);
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.search) searchParams.append('search', params.search);
        if (params.category) searchParams.append('category', params.category);
        if (params.status) searchParams.append('status', params.status);
        if (params.sortBy) searchParams.append('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

        return {
          url: `/courses/creator/${params.teacherId}?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, _, args) => [
        // Primary course creator tags
        { type: "course-creator", id: args.teacherId },
        { type: "creator-courses", id: args.teacherId },
        { type: "courses", id: `creator-${args.teacherId}` },
        { type: "course-list", id: args.teacherId },
        "courses",
        // Lecture-related tags for course creator data
        { type: "creator-lectures", id: args.teacherId },
        { type: "lectures", id: `creator-${args.teacherId}` },
        { type: "lecture-list", id: args.teacherId },
        "lectures",
        // Individual course tags
        ...(result?.data || []).map((course) => [
          { type: "course" as const, id: course._id },
          { type: "course-details" as const, id: course._id },
          { type: "course-lectures" as const, id: course._id }
        ]).flat(),
        // Individual lecture tags for each lecture in each course
        ...(result?.data || []).flatMap((course) =>
          (course.lectures || []).map((lecture: any) => [
            { type: "lecture" as const, id: typeof lecture === 'string' ? lecture : lecture._id },
            { type: "lecture-details" as const, id: typeof lecture === 'string' ? lecture : lecture._id }
          ]).flat()
        )
      ],
      transformResponse: (response: TResponseRedux<Course[]>) => ({
        data: response.data || [],
        meta: response.meta
      }),
      // Reduced caching for real-time updates
      keepUnusedDataFor: 60, // 1 minute for faster updates
    }),

    getCreatorCourse: builder.query({
      query: (args) => ({
        url: `/courses/creator/${args.id}`,
        method: "GET",
        // Enhanced cache-busting headers for real-time updates
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cache-Timestamp': Date.now().toString()
        },
      }),
      providesTags: (result, _, args) => {
        const baseTags = [
          // Primary creator courses tags
          { type: "courses" as const, id: `creator-${args.id}` },
          { type: "course-creator" as const, id: args.id },
          { type: "creator-courses" as const, id: args.id },
          { type: "creator-lectures" as const, id: args.id },
          { type: "course-list" as const, id: args.id },
          "courses",
          "lectures",
        ];

        // Add individual course tags
        const courseTags = (result?.data || []).flatMap((course: any) => [
          { type: "course" as const, id: course._id },
          { type: "course-details" as const, id: course._id },
          { type: "course-lectures" as const, id: course._id },
          { type: "lectures" as const, id: course._id },
        ]);

        // Add individual lecture tags for each lecture in each course
        const lectureTags = (result?.data || []).flatMap((course: any) =>
          (course.lectures || []).flatMap((lecture: any) => [
            { type: "lecture" as const, id: typeof lecture === 'string' ? lecture : lecture._id },
            { type: "lecture-details" as const, id: typeof lecture === 'string' ? lecture : lecture._id },
          ])
        );

        const allTags = [...baseTags, ...courseTags, ...lectureTags];
        console.log('🏷️ getCreatorCourse providesTags:', {
          teacherId: args.id,
          coursesCount: result?.data?.length || 0,
          totalTags: allTags.length
        });

        return allTags;
      },
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      // Enterprise-grade cache prevention for real-time updates
      keepUnusedDataFor: 0, // Immediately remove unused data
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
    }),
    getPublishedCourses: builder.query({
      query: () => ({
        url: "/courses/published-courses",
        method: "GET",
      }),
      providesTags: (result) => [
        { type: "courses", id: "published" },
        "courses",
        ...(result?.data || []).map((course: any) => ({ type: "course" as const, id: course._id }))
      ],
      transformResponse: (response: TResponseRedux<any>) => {
        // Handle potential errors or empty responses
        if (!response || !response.data) {
          console.error("Invalid response from published courses API:", response);
          return { data: [], meta: {} };
        }

        // The backend returns the courses directly in the data field
        return {
          data: response.data,
          meta: response.meta,
        };
      },
      // Add error handling
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error fetching published courses:", error);
          // Don't dispatch logout for public endpoint errors
        }
      },
    }),
    getPopularCourses: builder.query({
      query: (limit?: number) => ({
        url: `/courses/popular-courses${limit ? `?limit=${limit}` : ''}`,
        method: "GET",
      }),
      providesTags: (result) => [
        { type: "courses", id: "popular" },
        "courses",
        ...(result?.data || []).map((course: any) => ({ type: "course" as const, id: course._id }))
      ],
      transformResponse: (response: TResponseRedux<any>) => {
        // Handle potential errors or empty responses
        if (!response || !response.data) {
          console.error("Invalid response from popular courses API:", response);
          return { data: [] };
        }

        return {
          data: response.data,
        };
      },
      // Add error handling
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error fetching popular courses:", error);
          // Don't dispatch logout for public endpoint errors
        }
      },
    }),
    searchCourses: builder.query({
      query: (searchTerm: string) => ({
        url: `/courses/search?q=${encodeURIComponent(searchTerm)}`,
        method: "GET",
      }),
      providesTags: (result) => [
        { type: "courses", id: "search" },
        "courses",
        ...(result?.data || []).map((course: any) => ({ type: "course" as const, id: course._id }))
      ],
      transformResponse: (response: TResponseRedux<any>) => {
        // Handle potential errors or empty responses
        if (!response || !response.data) {
          console.error("Invalid response from search courses API:", response);
          return { data: [] };
        }

        return {
          data: response.data,
        };
      },
      // Add error handling
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error searching courses:", error);
          // Don't dispatch logout for public endpoint errors
        }
      },
    }),
    getCourseById: builder.query({
      query: (id) => {
        console.log("getCourseById query function called with ID:", id);
        if (!id) {
          console.error("getCourseById called with invalid ID:", id);
          throw new Error("Invalid course ID");
        }
        return {
          url: `/courses/${id}`,
          method: "GET",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        };
      },
      // Enterprise-grade cache prevention for real-time updates
      keepUnusedDataFor: 0,
      providesTags: (result, _, id) => [
        { type: "course", id },
        "courses",
        // Add lecture-related tags since course data includes lectures
        { type: "lectures", id },
        ...(result?.data?.lectures || []).map((lecture: any) => ({
          type: "lecture" as const,
          id: typeof lecture === 'string' ? lecture : lecture._id
        }))
      ],
      transformResponse: (response: TResponseRedux<any>) => {
        console.log("getCourseById response:", response);
        if (!response.data) {
          console.error("No data in response:", response);
          throw new Error("No course data found");
        }
        return {
          data: response.data,
        };
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error: any) {
          // Check if it's an access error (403)
          if (error?.error?.status === 403) {
            dispatch(setError("You don't have permission to access this course"));
          } else if (error?.error?.status === 404) {
            dispatch(setError("Course not found"));
          } else if (error?.error?.status === 401) {
            dispatch(setError("You need to be logged in to access this course"));
          } else {
            dispatch(setError("Error fetching course"));
          }
        }
      },
    }),
    editCourse: builder.mutation<
      { data: Course },
      { id: string; data: FormData; creatorId?: string }
    >({
      query: (args) => {
        return {
          url: `/courses/edit-course/${args.id}`,
          method: "PATCH",
          body: args.data,
          formData: true, // This signals to use FormData
        };
      },
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled, getState }) => {
        dispatch(setLoading(true));

        // Get creator ID from args or current state
        const creatorId = args.creatorId || (getState() as any).auth?.user?.data?._id;

        // Import cache utilities dynamically to avoid circular dependencies
        const { optimisticCourseUpdate, enterpriseCourseInvalidation } = await import('@/utils/courseCache');

        // Prepare update data (exclude file for optimistic updates)
        const updateData: any = {};
        // Convert FormData to object for optimistic updates
        if (args.data instanceof FormData) {
          for (const [key, value] of args.data.entries()) {
            if (key !== 'file') {
              updateData[key] = value;
            }
          }
        } else {
          Object.assign(updateData, args.data);
          delete updateData.file; // Don't optimistically update file fields
        }

        // Perform optimistic update with rollback capability
        const optimisticUpdate = optimisticCourseUpdate(dispatch, args.id, updateData, creatorId);

        try {
          const result = await queryFulfilled;

          // Use enterprise-grade cache invalidation for comprehensive updates
          enterpriseCourseInvalidation(
            dispatch,
            {
              courseId: args.id,
              creatorId,
              data: result.data
            },
            {
              enableToast: false, // Don't show toast here as it's handled in the component
              enableLogging: true,
              retryCount: 3
            }
          );

        } catch (error) {
          // Revert optimistic updates on error
          optimisticUpdate.rollback();
          dispatch(setError("Error editing course"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: (_, __, args) => {
        const tags: any[] = [
          // Core course tags
          "courses" as const, // General courses tag
          "course" as const, // General course tag
          { type: "course" as const, id: args.id }, // Specific course
          { type: "courses" as const, id: "LIST" }, // Course list
          { type: "courses" as const, id: "published" }, // Published courses

          // Lecture-related tags (since course changes may affect lecture data)
          "lectures" as const,
          { type: "lectures" as const, id: args.id },
        ];

        // Add creator-specific tags if creatorId is provided
        if (args.creatorId) {
          tags.push(
            { type: "courses" as const, id: `creator-${args.creatorId}` },
            { type: "course-creator" as const, id: args.creatorId },
            { type: "creator-courses" as const, id: args.creatorId }
          );
        }

        return tags;
      },
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/delete-course/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error deleting course"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: [
        // Invalidate all course-related caches
        "courses", // General courses tag
        { type: "courses", id: "LIST" }, // Course list
        { type: "courses", id: "published" }, // Published courses
        "course" // Individual course tag
      ],
    }),

    enrollCourse: builder.mutation<
      { data: { message: string; courseId: string } },
      string
    >({
      query: (courseId) => ({
        url: `/courses/${courseId}/enroll`,
        method: "POST",
      }),
      transformResponse: (response: TResponseRedux<{ message: string; courseId: string }>) => ({
        data: response.data,
      }),
      invalidatesTags: [
        "course",
        "courses",
        "enrolledCourses",
        "courseProgress",
      ],
    }),

    getRecommendations: builder.query<
      { data: { recommendations: Course[]; basedOn?: { categories: string[]; level: string } } },
      { limit?: number } | void
    >({
      query: (params) => ({
        url: `/recommendations${params?.limit ? `?limit=${params.limit}` : ''}`,
        method: "GET",
      }),
      providesTags: [{ type: "courses", id: "recommendations" }],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data || { recommendations: [], basedOn: {} },
      }),
    }),
  }),
});

export const {
  useCreateCourseMutation,
  useGetCoursesQuery,
  useGetCreatorCourseQuery,
  useGetPublishedCoursesQuery,
  useGetPopularCoursesQuery,
  useSearchCoursesQuery,
  useGetCourseByIdQuery,
  useEditCourseMutation,
  useDeleteCourseMutation,
  useEnrollCourseMutation,
  useGetRecommendationsQuery,
} = courseApi;
