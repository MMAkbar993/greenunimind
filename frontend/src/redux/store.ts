import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../redux/features/auth/authSlice";
import courseReducer from "../redux/features/course/courseSlice";
import lectureReducer from "../redux/features/lecture/lectureSlice";
import unifiedCourseReducer from "../redux/features/course/unifiedCourseSlice";
import cartReducer from "@/redux/features/cart/cartSlice";
import studentReducer from "@/redux/features/student/studentSlice";
import teacherReducer from "@/redux/features/teacher/teacherSlice";
import playerReducer from "@/redux/features/player/playerSlice";
import noteReducer from "@/redux/features/note/noteSlice";
import bookmarkReducer from "@/redux/features/bookmark/bookmarkSlice";
import questionReducer from "@/redux/features/question/questionSlice";
import messageReducer from "@/redux/features/message/messageSlice";
import reviewReducer from "@/redux/features/review/reviewSlice";
import courseManagementReducer from "@/redux/features/course/courseManagementSlice";
import { Environment } from "@/utils/environment";

const persistConfig = {
  key: "auth",
  storage,
};

const persistCourseConfig = {
  key: "course",
  storage,
  // Exclude data that should be fresh from API to prevent cache conflicts
  blacklist: ['course', 'loading', 'error'],
};

const persistLectureConfig = {
  key: "lecture",
  storage,
  // Persist lecture state but exclude data and loading states for real-time updates
  blacklist: ['lectures', 'selectedLecture', 'loading', 'error'],
};

const persistUnifiedCourseConfig = {
  key: "unifiedCourse",
  storage,
  // Only persist UI state and filters, exclude actual data for real-time updates
  whitelist: ['ui', 'filters'],
  // Exclude cache to prevent stale data issues
  blacklist: ['courses', 'lectures', 'cache', 'optimisticUpdates'],
};

const persistCartConfig = {
  key: "cart",
  storage,
};

const persistStudentConfig = {
  key: "student",
  storage,
};

const persistTeacherConfig = {
  key: "teacher",
  storage,
};

const persistPlayerConfig = {
  key: "player",
  storage,
};

const persistNoteConfig = {
  key: "note",
  storage,
};

const persistBookmarkConfig = {
  key: "bookmark",
  storage,
};

const persistQuestionConfig = {
  key: "question",
  storage,
};

const persistMessageConfig = {
  key: "message",
  storage,
};

const persistReviewConfig = {
  key: "review",
  storage,
};

const persistCourseManagementConfig = {
  key: "courseManagement",
  storage,
  // Only persist UI state and filters, exclude actual course data for real-time updates
  whitelist: ['filters', 'ui', 'tableColumns', 'columnOrder', 'savedFilters'],
  blacklist: ['cache', 'selectedCourses', 'bulkOperation'],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedCourseReducer = persistReducer(
  persistCourseConfig,
  courseReducer
);
// Temporarily disable lecture persistence for debugging
const persistedLectureReducer = lectureReducer;

const persistedCartReducer = persistReducer(persistCartConfig, cartReducer);
const persistedStudentReducer = persistReducer(persistStudentConfig, studentReducer);
const persistedTeacherReducer = persistReducer(persistTeacherConfig, teacherReducer);
const persistedPlayerReducer = persistReducer(persistPlayerConfig, playerReducer);
const persistedNoteReducer = persistReducer(persistNoteConfig, noteReducer);
const persistedBookmarkReducer = persistReducer(persistBookmarkConfig, bookmarkReducer);
const persistedQuestionReducer = persistReducer(persistQuestionConfig, questionReducer);
const persistedMessageReducer = persistReducer(persistMessageConfig, messageReducer);
const persistedReviewReducer = persistReducer(persistReviewConfig, reviewReducer);
const persistedCourseManagementReducer = persistReducer(persistCourseManagementConfig, courseManagementReducer);
const persistedUnifiedCourseReducer = persistReducer(persistUnifiedCourseConfig, unifiedCourseReducer);
const persistedUnifiedLectureReducer = persistReducer(persistUnifiedCourseConfig, lectureReducer);

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: persistedAuthReducer,
    course: persistedCourseReducer,
    lecture: persistedLectureReducer,
    cart: persistedCartReducer,
    student: persistedStudentReducer,
    teacher: persistedTeacherReducer,
    player: persistedPlayerReducer,
    note: persistedNoteReducer,
    bookmark: persistedBookmarkReducer,
    question: persistedQuestionReducer,
    message: persistedMessageReducer,
    review: persistedReviewReducer,
    courseManagement: persistedCourseManagementReducer,
    unifiedCourse: persistedUnifiedCourseReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      // Disable timestamps in actions to reduce noise
      actionCreatorCheck: false,
      immutableCheck: false,
    }).concat(baseApi.middleware),
  // Enhanced Redux DevTools configuration with security
  devTools: Environment.isDevelopment() ? {
    // Only enable in development environment
    name: 'Green Uni Mind Store',
    trace: true,
    traceLimit: 25,
    // Sanitize sensitive data in Redux DevTools
    actionSanitizer: (action: any) => {
      // List of action types that might contain sensitive data
      const sensitiveActionTypes = [
        'auth/setUser',
        'auth/login',
        'auth/signup',
        'auth/refreshToken',
        'baseApi/executeMutation',
        'baseApi/executeQuery',
      ];

      if (sensitiveActionTypes.some(type => action.type.includes(type))) {
        return {
          ...action,
          payload: {
            ...action.payload,
            // Sanitize sensitive fields
            token: action.payload?.token ? '[REDACTED]' : undefined,
            password: action.payload?.password ? '[REDACTED]' : undefined,
            refreshToken: action.payload?.refreshToken ? '[REDACTED]' : undefined,
            user: action.payload?.user ? {
              ...action.payload.user,
              email: action.payload.user.email ? '[REDACTED]' : undefined,
            } : undefined,
          },
        };
      }
      return action;
    },
    // Sanitize sensitive data in state
    stateSanitizer: (state: any) => {
      return {
        ...state,
        auth: state.auth ? {
          ...state.auth,
          token: state.auth.token ? '[REDACTED]' : null,
          user: state.auth.user ? {
            ...state.auth.user,
            email: state.auth.user.email ? '[REDACTED]' : undefined,
          } : null,
        } : state.auth,
      };
    },
  } : false, // Completely disable in production
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Enable persistStore for state persistence across sessions
// Note: This works in all environments but Redux DevTools are disabled in production
export const persistor = persistStore(store);
