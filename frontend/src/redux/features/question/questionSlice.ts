import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export interface IQuestion {
  _id?: string;
  question: string;
  timestamp: number;
  lectureId: string;
  studentId?: string;
  answered: boolean;
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuestionState {
  questions: Record<string, IQuestion[]>; // lectureId -> questions
  isLoading: boolean;
  error: string | null;
}

const initialState: QuestionState = {
  questions: {},
  isLoading: false,
  error: null,
};

const questionSlice = createSlice({
  name: "question",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setQuestions: (
      state,
      action: PayloadAction<{ lectureId: string; questions: IQuestion[] }>
    ) => {
      const { lectureId, questions } = action.payload;
      state.questions[lectureId] = questions;
    },
    addQuestion: (state, action: PayloadAction<IQuestion>) => {
      const question = action.payload;
      const lectureId = question.lectureId;
      
      if (!state.questions[lectureId]) {
        state.questions[lectureId] = [];
      }
      
      // Add new question
      state.questions[lectureId].push(question);
      // Sort questions by timestamp
      state.questions[lectureId].sort((a, b) => a.timestamp - b.timestamp);
    },
    updateQuestion: (
      state,
      action: PayloadAction<{ id: string; question: Partial<IQuestion> }>
    ) => {
      const { id, question } = action.payload;
      
      // Find the question in all lectures
      for (const lectureId in state.questions) {
        const index = state.questions[lectureId].findIndex((q) => q._id === id);
        if (index >= 0) {
          state.questions[lectureId][index] = {
            ...state.questions[lectureId][index],
            ...question,
          };
          break;
        }
      }
    },
    removeQuestion: (
      state,
      action: PayloadAction<{ id: string; lectureId: string }>
    ) => {
      const { id, lectureId } = action.payload;
      
      if (state.questions[lectureId]) {
        state.questions[lectureId] = state.questions[lectureId].filter(
          (q) => q._id !== id
        );
      }
    },
    clearQuestions: (state) => {
      state.questions = {};
    },
  },
});

export const {
  setLoading,
  setError,
  setQuestions,
  addQuestion,
  updateQuestion,
  removeQuestion,
  clearQuestions,
} = questionSlice.actions;

// Selectors
export const selectQuestionLoading = (state: RootState) => state.question.isLoading;
export const selectQuestionError = (state: RootState) => state.question.error;
export const selectQuestionsByLecture = (state: RootState, lectureId: string) =>
  state.question.questions[lectureId] || [];

export default questionSlice.reducer;
