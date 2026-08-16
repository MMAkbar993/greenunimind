import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setUser } from "@/redux/features/auth/authSlice";
import { RootState } from "@/redux/store";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (userInfo) => ({
        url: "/auth/login",
        method: "POST",
        body: userInfo,
      }),
      invalidatesTags: ["getMe"],
      transformResponse: (response) => {
        console.log("Login response received:", response);

        // Always store tokens in localStorage for production
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
          console.log("Refresh token stored in localStorage");
        } else {
          console.warn("No refresh token in login response");
        }

        if (response.data.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
          console.log("Access token stored in localStorage");
        } else {
          console.warn("No access token in login response");
        }

        // Ensure the user role is preserved
        const user = {
          ...response.data.user,
          photoUrl: response.data.user.profileImg ?? null,
          // Explicitly set the role from the backend response
          role: response.data.user.role,
        };

        // Log the user role for debugging
        console.log("User role from login response:", user.role);

        // Store the user role in localStorage for verification
        // Check all possible locations for the role
        const userRole = user.role || user.user?.role;
        if (userRole) {
          localStorage.setItem("userRole", userRole);
          console.log("Stored user role in localStorage from login:", userRole);
        }

        // Store the entire user object in localStorage as a fallback
        localStorage.setItem("userData", JSON.stringify(user));
        console.log("User data stored in localStorage");

        return {
          user,
          token: response.data.accessToken,
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log("Login successful, token obtained");

          // Immediately fetch user data to ensure it's up to date
          if (data.token) {
            setTimeout(() => {
              dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
            }, 500);
          }
        } catch (error) {
          console.error("Login error:", error);
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["getMe"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear all auth-related data from localStorage
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userData");
          localStorage.removeItem("oauthRequestedRole");
          console.log("Logout successful, all auth data cleared from localStorage");
        } catch (error) {
          console.error("Logout error:", error);
          // Still remove all auth-related data from localStorage even if the API call fails
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userData");
          localStorage.removeItem("oauthRequestedRole");
          console.log("Cleared auth data from localStorage despite API error");
        }
      },
    }),
    register: builder.mutation({
      query: (userInfo: FormData | Record<string, unknown>) => {
        const isFormData = userInfo instanceof FormData;
        return {
          url: "/users/create-student",
          method: "POST",
          ...(isFormData
            ? { body: userInfo }
            : { body: userInfo, headers: { "Content-Type": "application/json" } }),
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user) {
            dispatch(
              authApi.endpoints.getMe.initiate({
                forceRefetch: true,
              })
            );
          }
        } catch (error) {
          // ignore
        }
      },
    }),
    registerTeacher: builder.mutation({
      query: (userInfo: FormData | Record<string, unknown>) => {
        const isFormData = userInfo instanceof FormData;
        return {
          url: "/users/create-teacher",
          method: "POST",
          ...(isFormData
            ? { body: userInfo }
            : { body: userInfo, headers: { "Content-Type": "application/json" } }),
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user) {
            dispatch(
              authApi.endpoints.getMe.initiate({
                forceRefetch: true,
              })
            );
          }
        } catch (error) {
          // ignore
        }
      },
    }),
    getMe: builder.query({
      query: () => {
        console.log("=== GET ME QUERY STARTING ===");
        return {
          url: "/users/me",
          method: "GET",
        };
      },

      providesTags: ["getMe"],
      transformResponse: (response: TResponseRedux<any>) => {
        console.log("=== GET ME RESPONSE ===");
        console.log("GetMe response received:", response);

        // Ensure the user role is preserved
        if (response.data) {
          // Check all possible locations for the role
          const userRole = response.data.role || response.data.user?.role;

          if (userRole) {
            // Log the user role for debugging
            console.log("User role from getMe response:", userRole);

            // Store the user role in localStorage for verification
            localStorage.setItem("userRole", userRole);
            console.log("Stored user role in localStorage from getMe:", userRole);

            // Store the entire user object in localStorage as a fallback
            localStorage.setItem("userData", JSON.stringify(response.data));
            console.log("User data stored in localStorage from getMe");
          }
        } else {
          console.warn("No user data in getMe response");

          // Try to use stored user data if available
          const storedUserData = localStorage.getItem("userData");
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              console.log("Using stored user data from localStorage:", userData);
              return {
                data: userData,
              };
            } catch (error) {
              console.error("Error parsing stored user data:", error);
            }
          }
        }

        return {
          data: response.data,
        };
      },
      async onQueryStarted(_, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // If we have user data but no token in Redux, update the token from localStorage
          if (data?.data && !(getState() as RootState).auth.token) {
            const storedToken = localStorage.getItem("accessToken");
            if (storedToken) {
              console.log("Updating Redux store with token from localStorage");
              dispatch(setUser({
                user: data.data,
                token: storedToken
              }));
            }
          }
        } catch (error) {
          console.error("GetMe error:", error);

          // If getMe fails but we have stored user data and token, use those
          const storedUserData = localStorage.getItem("userData");
          const storedToken = localStorage.getItem("accessToken");

          if (storedUserData && storedToken) {
            try {
              const userData = JSON.parse(storedUserData);
              console.log("Using stored user data after getMe failure:", userData);
              dispatch(setUser({
                user: userData,
                token: storedToken
              }));
            } catch (e) {
              console.error("Error using stored user data:", e);
            }
          }
        }
      },
    }),
    updateUserProfile: builder.mutation({
      query: (args) => ({
        url: `/users/edit-profile/${args.id}`,
        method: "PATCH",
        body: args.data,
      }),
      invalidatesTags: ["getMe"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
    }),
    // Password management endpoints
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: "/auth/change-password",
        method: "POST",
        body: passwordData,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "/auth/forget-password",
        method: "POST",
        body: { email },
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
        headers: data.token ? { Authorization: data.token } : {},
      }),
    }),

    // Google OAuth login (frontend-initiated)
    googleLogin: builder.mutation({
      query: (data) => ({
        url: "/auth/google-login",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),

    // OAuth account management
    linkOAuthAccount: builder.mutation({
      query: (data) => ({
        url: "/oauth/link",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
    unlinkOAuthAccount: builder.mutation({
      query: (data) => ({
        url: "/oauth/unlink",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),

    // Email verification
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
    resendVerificationEmail: builder.mutation({
      query: (data) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body: data,
      }),
    }),

    // Two-factor authentication
    setupTwoFactor: builder.mutation({
      query: (userId) => ({
        url: `/auth/2fa/setup/${userId}`,
        method: "GET",
      }),
    }),
    verifyTwoFactor: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
    verifyLoginTwoFactor: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/login-verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
      // Same flattening as `login` - this completes a login that was
      // paused for a 2FA code, so it needs to store tokens the same way.
      transformResponse: (response) => {
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        if (response.data.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
        }

        const user = {
          ...response.data.user,
          photoUrl: response.data.user.profileImg ?? null,
          role: response.data.user.role,
        };

        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userData", JSON.stringify(user));

        return {
          user,
          token: response.data.accessToken,
        };
      },
    }),
    disableTwoFactor: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/disable",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRegisterTeacherMutation,
  useGetMeQuery,
  useUpdateUserProfileMutation,
  useLogoutMutation,
  // Password management hooks
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  // Google OAuth login hook
  useGoogleLoginMutation,
  // OAuth account management hooks
  useLinkOAuthAccountMutation,
  useUnlinkOAuthAccountMutation,
  // Email verification hooks
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  // Two-factor authentication hooks
  useSetupTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useVerifyLoginTwoFactorMutation,
  useDisableTwoFactorMutation,
} = authApi;
