import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { INote, setError, setLoading, setNote, setSharedNotes } from "./noteSlice";

export const noteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrUpdateNote: builder.mutation({
      query: (args: { studentId: string; data: Omit<INote, "studentId"> }) => ({
        url: `/notes/${args.studentId}`,
        method: "POST",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<INote>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(setNote(data.data));
        } catch (error) {
          dispatch(setError("Error saving note"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["notes"],
    }),

    getNoteByLectureAndStudent: builder.query({
      query: (args: { lectureId: string; studentId: string }) => ({
        url: `/notes/${args.lectureId}/${args.studentId}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<INote>) => ({
        data: response.data,
      }),
      providesTags: ["notes"],
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          if (data.data) {
            dispatch(setNote(data.data));
          }
        } catch (error) {
          dispatch(setError("Error fetching note"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    deleteNote: builder.mutation({
      query: (id: string) => ({
        url: `/notes/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: TResponseRedux<INote>) => ({
        data: response.data,
      }),
      onQueryStarted: async (_id, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error deleting note"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["notes"],
    }),

    getSharedNotes: builder.query({
      query: (lectureId: string) => ({
        url: `/notes/shared/${lectureId}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<INote[]>) => ({
        data: response.data,
      }),
      providesTags: ["notes"],
      onQueryStarted: async (lectureId, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setSharedNotes({
              lectureId,
              notes: data.data || [],
            })
          );
        } catch (error) {
          dispatch(setError("Error fetching shared notes"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    shareNote: builder.mutation({
      query: (args: { noteId: string; studentIds: string[] }) => ({
        url: `/notes/share/${args.noteId}`,
        method: "POST",
        body: { studentIds: args.studentIds },
      }),
      transformResponse: (response: TResponseRedux<INote>) => ({
        data: response.data,
      }),
      invalidatesTags: ["notes"],
    }),
  }),
});

export const {
  useCreateOrUpdateNoteMutation,
  useGetNoteByLectureAndStudentQuery,
  useDeleteNoteMutation,
  useGetSharedNotesQuery,
  useShareNoteMutation,
} = noteApi;
