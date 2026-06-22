import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import {
  IBookmark,
  setBookmarks,
  setError,
  setLoading,
  setSharedBookmarks,
  setBookmarksByCategory,
  setBookmarksByTags
} from "./bookmarkSlice";

export const bookmarkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBookmark: builder.mutation({
      query: (args: { studentId: string; data: Omit<IBookmark, "studentId"> }) => ({
        url: `/bookmarks/${args.studentId}`,
        method: "POST",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<IBookmark>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error creating bookmark"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["bookmarks"],
    }),

    getBookmarksByLectureAndStudent: builder.query({
      query: (args: { lectureId: string; studentId: string }) => ({
        url: `/bookmarks/${args.lectureId}/${args.studentId}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<IBookmark[]>) => ({
        data: response.data,
      }),
      providesTags: ["bookmarks"],
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setBookmarks({
              lectureId: args.lectureId,
              bookmarks: data.data,
            })
          );
        } catch (error) {
          dispatch(setError("Error fetching bookmarks"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    updateBookmark: builder.mutation({
      query: (args: { id: string; data: Partial<IBookmark> }) => ({
        url: `/bookmarks/${args.id}`,
        method: "PATCH",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<IBookmark>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error updating bookmark"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["bookmarks"],
    }),

    deleteBookmark: builder.mutation({
      query: (id: string) => ({
        url: `/bookmarks/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: TResponseRedux<IBookmark>) => ({
        data: response.data,
      }),
      onQueryStarted: async (_id, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error deleting bookmark"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["bookmarks"],
    }),

    getSharedBookmarks: builder.query({
      query: (lectureId: string) => ({
        url: `/bookmarks/shared/${lectureId}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<IBookmark[]>) => ({
        data: response.data,
      }),
      providesTags: ["bookmarks"],
      onQueryStarted: async (lectureId, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setSharedBookmarks({
              lectureId,
              bookmarks: data.data || [],
            })
          );
        } catch (error) {
          dispatch(setError("Error fetching shared bookmarks"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    shareBookmark: builder.mutation({
      query: (args: { bookmarkId: string; studentIds: string[] }) => ({
        url: `/bookmarks/share/${args.bookmarkId}`,
        method: "POST",
        body: { studentIds: args.studentIds },
      }),
      transformResponse: (response: TResponseRedux<IBookmark>) => ({
        data: response.data,
      }),
      invalidatesTags: ["bookmarks"],
    }),

    getBookmarksByCategory: builder.query({
      query: (args: { studentId: string; category: string }) => ({
        url: `/bookmarks/category/${args.studentId}/${args.category}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<IBookmark[]>) => ({
        data: response.data,
      }),
      providesTags: ["bookmarks"],
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setBookmarksByCategory({
              category: args.category,
              bookmarks: data.data || [],
            })
          );
        } catch (error) {
          dispatch(setError("Error fetching bookmarks by category"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    getBookmarksByTags: builder.mutation({
      query: (args: { studentId: string; tags: string[] }) => ({
        url: `/bookmarks/tags/${args.studentId}`,
        method: "POST",
        body: { tags: args.tags },
      }),
      transformResponse: (response: TResponseRedux<IBookmark[]>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          // Use the first tag as the key for simplicity
          if (args.tags.length > 0) {
            dispatch(
              setBookmarksByTags({
                tag: args.tags[0],
                bookmarks: data.data || [],
              })
            );
          }
        } catch (error) {
          dispatch(setError("Error fetching bookmarks by tags"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
  }),
});

export const {
  useCreateBookmarkMutation,
  useGetBookmarksByLectureAndStudentQuery,
  useUpdateBookmarkMutation,
  useDeleteBookmarkMutation,
  useGetSharedBookmarksQuery,
  useShareBookmarkMutation,
  useGetBookmarksByCategoryQuery,
  useGetBookmarksByTagsMutation,
} = bookmarkApi;
