import { baseApi } from "@/redux/api/baseApi";
import { RootState } from "@/redux/store";
import { createSlice } from "@reduxjs/toolkit";

export type TUser = {
  user?: any;
  _id?: string;
  email: string;
  name: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  photoUrl?: string;
  profileImg?: string;
  role?: "student" | "teacher";
  isDeleted?: boolean;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // OAuth provider fields
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  // OAuth connection status
  connectedAccounts?: {
    google?: boolean;
    facebook?: boolean;
    apple?: boolean;
  };
  // Password status
  hasPassword?: boolean;
  // Two-factor authentication fields
  twoFactorEnabled?: boolean;
};

const initialState = {
  user: null,
  token: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      // Ensure the user role is preserved
      const user = action.payload.user;

      // Log the user role for debugging
      console.log("Setting user in Redux store with role:", user?.role);

      state.user = user;
      state.token = action.payload.token;
      state.isLoading = false;

      // Store token in localStorage for OAuth linking
      if (action.payload.token) {
        localStorage.setItem("accessToken", action.payload.token);
      }

      // Store the user role in localStorage for verification
      // Check all possible locations for the role
      const userRole = user?.role || user?.user?.role;
      if (userRole) {
        localStorage.setItem("userRole", userRole);
        console.log("Stored user role in localStorage:", userRole);
      }
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;

      // Clear tokens and user data from localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("oauthRequestedRole");
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      // Reset API on logout if needed
      baseApi.util.resetApiState,
      (_state) => {}
    );
  },
});

export const { setUser, setIsLoading, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentToken = (state: RootState) => state.auth.token;
export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
