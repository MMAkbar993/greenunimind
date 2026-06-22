/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from '@/config';
import { SecurityConfig } from '@/config/security';
import { Logger, debugOnly } from '@/utils/logger';
import {
  BaseQueryApi,
  BaseQueryFn,
  DefinitionType,
  FetchArgs,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { toast } from 'sonner';
import { logout, setUser } from '../features/auth/authSlice';
import { RootState } from '../store';

type ErrorResponse = {
  message: string;
};

const baseQuery = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux store
    const token = (getState() as RootState).auth?.token;

    // If no token in Redux, try localStorage as fallback
    const localToken = !token ? localStorage.getItem('accessToken') : null;
    const refreshToken = localStorage.getItem('refreshToken');

    // Token storage debug logging - only in development
    debugOnly.log('Token storage check:', {
      hasReduxToken: !!token,
      hasLocalToken: !!localToken,
      hasRefreshToken: !!refreshToken,
    });

    // Use token from Redux or localStorage
    const finalToken = token || localToken;

    if (finalToken) {
      headers.set('authorization', `Bearer ${finalToken}`);
      debugOnly.log('Authorization header set', {
        tokenSource: token ? 'Redux' : 'localStorage',
        tokenLength: finalToken.length,
      });
    } else {
      debugOnly.log('No authentication token available', {
        reduxTokenMissing: !token,
        localTokenMissing: !localToken,
      });

      // Try to get user data from localStorage
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          // If we have user data but no token, try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            debugOnly.log('Found user data but no token, will try to refresh token');
            // We'll let the 401 handler handle this case
          }
        } catch (error) {
          Logger.error('Error checking stored user data', { error });
        }
      }
    }

    // Add security headers for production (only when enabled)
    if (SecurityConfig.API_SECURITY.REQUEST_SIGNING) {
      try {
        const timestamp = Date.now().toString();
        const nonce = crypto
          .getRandomValues(new Uint8Array(16))
          .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

        headers.set('x-timestamp', timestamp);
        headers.set('x-nonce', nonce);

        // Add request signature (simplified version)
        const payload = `${timestamp}${nonce}`;
        headers.set('x-request-signature', btoa(payload));

        debugOnly.log('Added security headers for request signing');
      } catch (error) {
        Logger.error('Error adding security headers', { error });
        // Continue without security headers if there's an error
      }
    }

    // Don't add custom headers that might cause CORS issues
    // The Authorization header is sufficient for authentication

    return headers;
  },
});

const baseQueryWithRefreshToken: BaseQueryFn<FetchArgs, BaseQueryApi, DefinitionType> = async (
  args,
  api,
  extraOptions
): Promise<any> => {
  // Get token from Redux store or localStorage
  const token = (api.getState() as RootState).auth?.token || localStorage.getItem('accessToken');

  // Skip token expiration check for public endpoints
  const isPublicEndpoint =
    args.url.includes('/published-courses') ||
    args.url.includes('/search') ||
    args.url.includes('/impact/') ||
    (args.url.includes('/auth/') && !args.url.includes('/refresh-token'));

  if (token && !isPublicEndpoint) {
    try {
      debugOnly.log('Checking token expiration');

      // Parse the JWT token to check expiration
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeToExpiration = expirationTime - currentTime;

      debugOnly.log(`Token expires in ${Math.floor(timeToExpiration / 1000)} seconds`);

      // If token is already expired or expires in less than 5 minutes, refresh it
      if (timeToExpiration <= 0) {
        debugOnly.log('Token already expired, refreshing immediately');
        // We'll let the 401 handler below handle this case
        // This will ensure we don't make two refresh attempts
      } else if (timeToExpiration < 300000) {
        debugOnly.log('Token expiring soon, refreshing proactively');

        // Get the refresh token from localStorage
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedRefreshToken) {
          debugOnly.log('No refresh token found in localStorage');
          // Continue with the request even without refresh token
        } else {
          debugOnly.log('Attempting proactive token refresh');
          // Try to refresh the token with multiple approaches
          try {
            const refreshResult = await fetch(`${config.apiBaseUrl}/auth/refresh-token`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-Refresh-Token': 'true',
                Authorization: `Bearer ${storedRefreshToken}`, // Also try as Authorization header
              },
              // Also send the token in the body as a fallback
              body: JSON.stringify({
                refreshToken: storedRefreshToken,
              }),
            });

            if (refreshResult.ok) {
              const refreshData = await refreshResult.json();

              if (refreshData?.data?.accessToken) {
                console.log('=== TOKEN REFRESH SUCCESS ===');
                console.log(
                  'New access token received from proactive refresh:',
                  refreshData.data.accessToken.substring(0, 50) + '...'
                );
                console.log('=============================');

                // Store the new tokens
                if (refreshData.data.refreshToken) {
                  localStorage.setItem('refreshToken', refreshData.data.refreshToken);
                }
                localStorage.setItem('accessToken', refreshData.data.accessToken);

                const user = (api.getState() as RootState).auth.user;

                api.dispatch(
                  setUser({
                    user,
                    token: refreshData.data.accessToken,
                  })
                );
              }
            } else {
              debugOnly.log('Proactive token refresh failed', {
                status: refreshResult.status,
              });
              // Continue with the request even if refresh failed
            }
          } catch (refreshError) {
            Logger.error('Error during token refresh', { error: refreshError });
            // Continue with the request even if refresh failed
          }
        }
      }
    } catch (error) {
      Logger.error('Error checking token expiration', { error });
      // This could be because the token is malformed or invalid
      // We'll let the request proceed and handle any 401 errors below
    }
  } else if (!isPublicEndpoint) {
    debugOnly.log('No token available for expiration check');
  }

  // We already defined isPublicEndpoint above, reuse it here

  // For public endpoints, don't add auth headers
  if (isPublicEndpoint) {
    // Clone args and remove any auth headers for public endpoints
    const publicArgs = { ...args };
    if (publicArgs.headers) {
      const headers = publicArgs.headers as Record<string, string>;
      delete headers.authorization;
    }
    return baseQuery(publicArgs, api, extraOptions);
  }

  // For protected endpoints, proceed with normal flow
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 errors by trying to refresh the token
  if (result.error?.status === 401) {
    try {
      debugOnly.log('Received 401 error, attempting to refresh token');

      // Check if the error is specifically about token expiration
      const errorData = result.error.data as ErrorResponse | undefined;
      const errorMessage = errorData?.message || '';
      const isTokenExpired =
        errorMessage.includes('expired') || errorMessage.includes('jwt expired');

      if (isTokenExpired) {
        debugOnly.log('Token expired error confirmed:', errorMessage);
      }

      // Get the refresh token from localStorage
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        debugOnly.log('No refresh token found in localStorage, logging out');
        api.dispatch(logout());
        return result;
      }

      debugOnly.log('Refresh token found, attempting to refresh');

      // Try to refresh the token with both cookie and body approach
      const refreshResult = await fetch(`${config.apiBaseUrl}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Refresh-Token': 'true',
          Authorization: `Bearer ${storedRefreshToken}`, // Also try as Authorization header
        },
        // Also send the token in the body as a fallback
        body: JSON.stringify({
          refreshToken: storedRefreshToken,
        }),
      });

      if (!refreshResult.ok) {
        debugOnly.log('Refresh token request failed with status:', refreshResult.status);

        // Try to get more detailed error information
        try {
          const errorData = await refreshResult.json();
          Logger.error('Refresh token error details', { errorData });
        } catch (e) {
          Logger.error('Could not parse refresh token error response');
        }

        api.dispatch(logout());
        return result;
      }

      const refreshData = await refreshResult.json();
      debugOnly.log('Refresh token response:', refreshData);

      if (refreshData?.data?.accessToken) {
        debugOnly.log('New access token received, updating Redux store');

        // Store the new tokens
        if (refreshData.data.refreshToken) {
          localStorage.setItem('refreshToken', refreshData.data.refreshToken);
        }
        localStorage.setItem('accessToken', refreshData.data.accessToken);

        const user = (api.getState() as RootState).auth.user;

        // Update token in Redux
        api.dispatch(
          setUser({
            user,
            token: refreshData.data.accessToken,
          })
        );

        // Retry the original failed request with the new token
        debugOnly.log('Retrying original request with new token');

        // Create a new args object with the updated token
        const newArgs = { ...args };
        if (newArgs.headers) {
          const headers = newArgs.headers as Record<string, string>;
          headers.authorization = `Bearer ${refreshData.data.accessToken}`;
        }

        result = await baseQuery(newArgs, api, extraOptions);
      } else {
        debugOnly.log('No access token in refresh response, logging out');
        api.dispatch(logout());
      }
    } catch (error) {
      // If refresh API crashed
      Logger.error('Error during token refresh', { error });
      api.dispatch(logout());
    }
  }

  // Handle other server errors
  if (result.error?.status === 403) {
    const errorMessage = (result.error.data as ErrorResponse)?.message || 'Forbidden';

    // Suppress access-related toast notifications to reduce visual clutter
    // Only show toasts for critical permission errors, not routine access checks
    const isAccessMessage =
      errorMessage.includes('You can only access your own') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('access your own message stats') ||
      errorMessage.includes('access your own message folders');

    if (!isAccessMessage) {
      toast.error(errorMessage);
    }
  }

  if (result.error?.status === 404) {
    // Don't show toast for 404 errors that might be expected empty states
    const errorMessage = (result.error.data as ErrorResponse)?.message || 'Not found';

    // Only show toast for unexpected 404s, not for empty data scenarios
    if (
      !errorMessage.includes('No data') &&
      !errorMessage.includes('empty') &&
      !errorMessage.includes('not found') &&
      !args.url.includes('/analytics/') &&
      !args.url.includes('/reviews/') &&
      !args.url.includes('/messages/')
    ) {
      toast.error(errorMessage);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  tagTypes: [
    'getMe',
    'courses',
    'course',
    'course-creator',
    'course-list',
    'course-details',
    'lectures',
    'lecture',
    'lecture-list',
    'lecture-details',
    'lecture-order',
    'course-lectures',
    'creator-courses',
    'creator-lectures',
    'enrolledCourses',
    'enrolledStudents',
    'courseProgress',
    'bookmarks',
    'UpcomingPayout',
    'questions',
    'notes',
    'Payouts',
    'PayoutPreferences',
    'Payout',
    'categories',
    'category',
    'subcategories',
    'subcategory',
    'analytics',
    'dashboard',
    'activities',
    'enrollment',
    'engagement',
    'revenue',
    'performance',
    'reviews',
    'teacher-reviews',
    'course-reviews',
    'review-analytics',
    'review-stats',
    'review-dashboard',
    'review-insights',
    'review-trends',
    'impact',
    'achievements',
  ],
  baseQuery: baseQueryWithRefreshToken,
  // Optimized cache configuration to prevent rate limiting
  keepUnusedDataFor: 300, // Keep data for 5 minutes to reduce requests
  refetchOnMountOrArgChange: 30, // Only refetch if data is older than 30 seconds
  refetchOnFocus: false, // Disable refetch on focus to prevent request bursts
  refetchOnReconnect: true, // Keep refetch on reconnect for network recovery
  endpoints: () => ({}),
});
