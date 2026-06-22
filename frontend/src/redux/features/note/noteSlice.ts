import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export interface INote {
  _id?: string;
  content: string;
  lectureId: string;
  studentId: string;
  isShared?: boolean;
  sharedWith?: string[];
  isRichText?: boolean;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoteState {
  notes: Record<string, INote>; // lectureId -> note
  sharedNotes: Record<string, INote[]>; // lectureId -> shared notes
  isLoading: boolean;
  error: string | null;
}

const initialState: NoteState = {
  notes: {},
  sharedNotes: {},
  isLoading: false,
  error: null,
};

const noteSlice = createSlice({
  name: "note",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setNote: (state, action: PayloadAction<INote>) => {
      const note = action.payload;
      state.notes[note.lectureId] = note;
    },
    updateNote: (
      state,
      action: PayloadAction<{
        lectureId: string;
        content: string;
        isRichText?: boolean;
        tags?: string[];
        isShared?: boolean;
        studentId: string;
      }>
    ) => {
      const { lectureId, content, isRichText, tags, isShared, studentId } = action.payload;

      if (state.notes[lectureId]) {
        state.notes[lectureId] = {
          ...state.notes[lectureId],
          content,
          ...(isRichText !== undefined && { isRichText }),
          ...(tags !== undefined && { tags }),
          ...(isShared !== undefined && { isShared }),
        };
      } else {
        // Create a new note if it doesn't exist
        state.notes[lectureId] = {
          lectureId,
          content,
          studentId,
          ...(isRichText !== undefined && { isRichText }),
          ...(tags !== undefined && { tags }),
          ...(isShared !== undefined && { isShared }),
        };
      }
    },
    removeNote: (state, action: PayloadAction<string>) => {
      const lectureId = action.payload;
      delete state.notes[lectureId];
    },
    clearNotes: (state) => {
      state.notes = {};
      state.sharedNotes = {};
    },
    setSharedNotes: (
      state,
      action: PayloadAction<{ lectureId: string; notes: INote[] }>
    ) => {
      const { lectureId, notes } = action.payload;
      state.sharedNotes[lectureId] = notes;
    },
    shareNote: (
      state,
      action: PayloadAction<{ lectureId: string; isShared: boolean }>
    ) => {
      const { lectureId, isShared } = action.payload;
      if (state.notes[lectureId]) {
        state.notes[lectureId].isShared = isShared;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setNote,
  updateNote,
  removeNote,
  clearNotes,
  setSharedNotes,
  shareNote,
} = noteSlice.actions;

// Selectors
export const selectNoteLoading = (state: RootState) => state.note.isLoading;
export const selectNoteError = (state: RootState) => state.note.error;
export const selectNoteByLecture = (state: RootState, lectureId: string) =>
  state.note.notes[lectureId] || null;
export const selectSharedNotesByLecture = (state: RootState, lectureId: string) =>
  state.note.sharedNotes[lectureId] || [];

export default noteSlice.reducer;
