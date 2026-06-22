import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { IQuestion, setError, setLoading, setQuestions } from "./questionSlice";

export const questionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createQuestion: builder.mutation({
      query: (args: { studentId: string; data: Omit<IQuestion, "studentId"> }) => ({
        url: `/questions/${args.studentId}`,
        method: "POST",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<IQuestion>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error creating question"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["questions"],
    }),

    getQuestionsByLectureAndStudent: builder.query({
      query: (args: { lectureId: string; studentId: string }) => ({
        url: `/questions/${args.lectureId}/${args.studentId}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<IQuestion[]>) => ({
        data: response.data,
      }),
      providesTags: ["questions"],
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setQuestions({
              lectureId: args.lectureId,
              questions: data.data,
            })
          );
        } catch (error) {
          dispatch(setError("Error fetching questions"));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),

    getQuestionsByLecture: builder.query({
      query: (lectureId: string) => ({
        url: `/questions/lecture/${lectureId}`,
        method: "GET",
      }),
      transformResponse: (response: TResponseRedux<IQuestion[]>) => ({
        data: response.data,
      }),
      providesTags: ["questions"],
    }),

    answerQuestion: builder.mutation({
      query: (args: { id: string; answer: string }) => ({
        url: `/questions/answer/${args.id}`,
        method: "PATCH",
        body: { answer: args.answer },
      }),
      transformResponse: (response: TResponseRedux<IQuestion>) => ({
        data: response.data,
      }),
      invalidatesTags: ["questions"],
    }),

    updateQuestion: builder.mutation({
      query: (args: { id: string; data: Partial<IQuestion> }) => ({
        url: `/questions/${args.id}`,
        method: "PATCH",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<IQuestion>) => ({
        data: response.data,
      }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error updating question"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["questions"],
    }),

    deleteQuestion: builder.mutation({
      query: (id: string) => ({
        url: `/questions/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: TResponseRedux<IQuestion>) => ({
        data: response.data,
      }),
      onQueryStarted: async (_id, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error deleting question"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["questions"],
    }),
  }),
});

export const {
  useCreateQuestionMutation,
  useGetQuestionsByLectureAndStudentQuery,
  useGetQuestionsByLectureQuery,
  useAnswerQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = questionApi;
