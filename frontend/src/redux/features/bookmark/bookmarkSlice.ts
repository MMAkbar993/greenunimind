import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export interface IBookmark {
  _id?: string;
  title: string;
  timestamp: number;
  lectureId: string;
  studentId?: string;
  isShared?: boolean;
  sharedWith?: string[];
  category?: string;
  tags?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BookmarkState {
  bookmarks: Record<string, IBookmark[]>; // lectureId -> bookmarks
  sharedBookmarks: Record<string, IBookmark[]>; // lectureId -> shared bookmarks
  bookmarksByCategory: Record<string, IBookmark[]>; // category -> bookmarks
  bookmarksByTags: Record<string, IBookmark[]>; // tag -> bookmarks
  isLoading: boolean;
  error: string | null;
}

const initialState: BookmarkState = {
  bookmarks: {},
  sharedBookmarks: {},
  bookmarksByCategory: {},
  bookmarksByTags: {},
  isLoading: false,
  error: null,
};

const bookmarkSlice = createSlice({
  name: "bookmark",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setBookmarks: (
      state,
      action: PayloadAction<{ lectureId: string; bookmarks: IBookmark[] }>
    ) => {
      const { lectureId, bookmarks } = action.payload;
      state.bookmarks[lectureId] = bookmarks;
    },
    addBookmark: (state, action: PayloadAction<IBookmark>) => {
      const bookmark = action.payload;
      const lectureId = bookmark.lectureId;

      if (!state.bookmarks[lectureId]) {
        state.bookmarks[lectureId] = [];
      }

      // Check if bookmark already exists (by timestamp)
      const existingIndex = state.bookmarks[lectureId].findIndex(
        (b) => b.timestamp === bookmark.timestamp
      );

      if (existingIndex >= 0) {
        // Update existing bookmark
        state.bookmarks[lectureId][existingIndex] = bookmark;
      } else {
        // Add new bookmark
        state.bookmarks[lectureId].push(bookmark);
        // Sort bookmarks by timestamp
        state.bookmarks[lectureId].sort((a, b) => a.timestamp - b.timestamp);
      }
    },
    updateBookmark: (
      state,
      action: PayloadAction<{ id: string; bookmark: Partial<IBookmark> }>
    ) => {
      const { id, bookmark } = action.payload;

      // Find the bookmark in all lectures
      for (const lectureId in state.bookmarks) {
        const index = state.bookmarks[lectureId].findIndex((b) => b._id === id);
        if (index >= 0) {
          state.bookmarks[lectureId][index] = {
            ...state.bookmarks[lectureId][index],
            ...bookmark,
          };
          break;
        }
      }
    },
    removeBookmark: (
      state,
      action: PayloadAction<{ id: string; lectureId: string }>
    ) => {
      const { id, lectureId } = action.payload;

      if (state.bookmarks[lectureId]) {
        state.bookmarks[lectureId] = state.bookmarks[lectureId].filter(
          (b) => b._id !== id
        );
      }
    },
    clearBookmarks: (state) => {
      state.bookmarks = {};
      state.sharedBookmarks = {};
      state.bookmarksByCategory = {};
      state.bookmarksByTags = {};
    },
    setSharedBookmarks: (
      state,
      action: PayloadAction<{ lectureId: string; bookmarks: IBookmark[] }>
    ) => {
      const { lectureId, bookmarks } = action.payload;
      state.sharedBookmarks[lectureId] = bookmarks;
    },
    setBookmarksByCategory: (
      state,
      action: PayloadAction<{ category: string; bookmarks: IBookmark[] }>
    ) => {
      const { category, bookmarks } = action.payload;
      state.bookmarksByCategory[category] = bookmarks;
    },
    setBookmarksByTags: (
      state,
      action: PayloadAction<{ tag: string; bookmarks: IBookmark[] }>
    ) => {
      const { tag, bookmarks } = action.payload;
      state.bookmarksByTags[tag] = bookmarks;
    },
    shareBookmark: (
      state,
      action: PayloadAction<{ id: string; isShared: boolean }>
    ) => {
      const { id, isShared } = action.payload;

      // Find the bookmark in all lectures
      for (const lectureId in state.bookmarks) {
        const index = state.bookmarks[lectureId].findIndex((b) => b._id === id);
        if (index >= 0) {
          state.bookmarks[lectureId][index].isShared = isShared;
          break;
        }
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setBookmarks,
  addBookmark,
  updateBookmark,
  removeBookmark,
  clearBookmarks,
  setSharedBookmarks,
  setBookmarksByCategory,
  setBookmarksByTags,
  shareBookmark,
} = bookmarkSlice.actions;

// Selectors
export const selectBookmarkLoading = (state: RootState) => state.bookmark.isLoading;
export const selectBookmarkError = (state: RootState) => state.bookmark.error;
export const selectBookmarksByLecture = (state: RootState, lectureId: string) =>
  state.bookmark.bookmarks[lectureId] || [];
export const selectSharedBookmarksByLecture = (state: RootState, lectureId: string) =>
  state.bookmark.sharedBookmarks[lectureId] || [];
export const selectBookmarksByCategory = (state: RootState, category: string) =>
  state.bookmark.bookmarksByCategory[category] || [];
export const selectBookmarksByTag = (state: RootState, tag: string) =>
  state.bookmark.bookmarksByTags[tag] || [];

export default bookmarkSlice.reducer;
