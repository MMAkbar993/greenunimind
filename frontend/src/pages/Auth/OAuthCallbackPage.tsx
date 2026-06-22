import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { useLinkOAuthAccountMutation, useGetMeQuery } from "@/redux/features/auth/authApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isValidObjectId } from "@/utils/getUserId";
import AuthSuccessPage from "@/components/auth/AuthSuccessPage";
import { config } from "@/config";

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [linkOAuthAccount] = useLinkOAuthAccountMutation();
  // Initialize the query without skipping so we can refetch it later
  const { refetch } = useGetMeQuery(undefined);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get parameters from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const provider = params.get("provider");
        const providerId = params.get("providerId");
        const email = params.get("email");
        const isLinking = params.get("isLinking") === "true";

        // Log parameters for debugging
        console.log("OAuth callback parameters:", {
          token: token ? "exists" : "null",
          provider,
          providerId: providerId ? providerId.substring(0, 8) + "..." : "null",
          email: email ? `${email.substring(0, 3)}...${email.substring(email.indexOf('@'))}` : "null",
          isLinking
        });

        // Check if this is an account linking flow from the URL
        if (isLinking && provider && providerId && email) {
          console.log("Processing OAuth account linking flow");

          // This is an account linking flow from the OAuth provider
          const storedUserId = localStorage.getItem("oauthLinkUserId");
          const storedEmail = localStorage.getItem("oauthLinkUserEmail");
          // Get the role from URL params or use the stored role
          const roleParam = params.get("role");

          console.log("OAuth linking data from localStorage:", {
            storedUserId,
            storedEmail: storedEmail ? `${storedEmail.substring(0, 3)}...${storedEmail.substring(storedEmail.indexOf('@'))}` : "null",
            role: roleParam || "from localStorage"
          });

          if (!storedUserId) {
            console.error("User ID not found in localStorage for account linking");
            setError("User ID not found for account linking. Please try again.");
            return;
          }

          try {
            // Make a direct API call to verify the user ID before linking
            console.log("Verifying user ID before linking...");
            // Use the stored access token specifically for OAuth linking if available
            const accessToken = localStorage.getItem('oauthLinkAccessToken') || localStorage.getItem('accessToken');

            if (!accessToken) {
              console.error("No access token found for verification");
              setError("Authentication token not found. Please try again.");
              return;
            }

            // Use the correct API base URL from centralized config
            const verifyResponse = await fetch(`${config.apiBaseUrl}/users/${storedUserId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              }
            });

            if (!verifyResponse.ok) {
              console.error("Failed to verify user ID:", verifyResponse.status);
              // Try to get more details about the error
              try {
                const errorData = await verifyResponse.json();
                console.error("Error details:", errorData);
              } catch (e) {
                console.error("Could not parse error response");
              }

              setError("Could not verify your user account. Please try again.");
              return;
            }

            const userData = await verifyResponse.json();
            // Get the role from URL params or localStorage
            const roleParam = params.get("role");
            const storedRole = localStorage.getItem("oauthLinkUserRole");
            const userRole = roleParam || storedRole || "student";

            // Link the account using the stored user ID
            // Make sure we're using a valid MongoDB ObjectId
            if (!storedUserId || !isValidObjectId(storedUserId)) {
              console.error("Invalid user ID format:", storedUserId);
              setError(`Invalid user ID format. Please try again.`);
              return;
            }

            console.log("Linking account with validated user ID:", storedUserId);

            const result = await linkOAuthAccount({
              userId: storedUserId,
              provider: provider as "google" | "facebook" | "apple",
              providerId,
              email,
              role: userRole
            }).unwrap();

            // Refresh user data to get the updated OAuth information
            try {
              await refetch();
              console.log("User data refreshed successfully");
            } catch (refreshError) {
              // Log the error but don't fail the whole operation
              console.warn("Failed to refresh user data:", refreshError);
              // Continue with the success flow
            }

            toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`);

            // Clear all stored linking data
            localStorage.removeItem("oauthLinkUserId");
            localStorage.removeItem("oauthLinkUserEmail");
            localStorage.removeItem("oauthLinkAccessToken");
            localStorage.removeItem("oauthLinkUserRole");

            // Set success state instead of navigating immediately
            setIsSuccess(true);
            setIsProcessing(false);
          } catch (error) {
            console.error("Failed to link account:", error);

            // Try to extract more detailed error information
            let errorMessage = `Failed to link your ${provider} account.`;

            // Check if it's a refetch error, which we can ignore
            if (error instanceof Error && error.message.includes("Cannot refetch a query")) {
              console.warn("Refetch error detected, but account linking may have succeeded:", error.message);

              // This is likely just a UI refresh issue, not an actual linking failure
              // Set success state and continue
              toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`);

              // Clear all stored linking data
              localStorage.removeItem("oauthLinkUserId");
              localStorage.removeItem("oauthLinkUserEmail");
              localStorage.removeItem("oauthLinkAccessToken");
              localStorage.removeItem("oauthLinkUserRole");

              // Set success state instead of navigating immediately
              setIsSuccess(true);
              setIsProcessing(false);
              return;
            }

            // Type guard for error with status and data properties
            if (error && typeof error === 'object' && 'status' in error) {
              const apiError = error as { status: number; data?: { message?: string } };

              if (apiError.status === 404) {
                errorMessage = `User not found. Please try logging in again.`;
              } else if (apiError.status === 401) {
                errorMessage = `Authentication failed. Please try logging in again.`;
              } else if (apiError.status === 400) {
                errorMessage = `Invalid request. Please check your information and try again.`;
              } else if (apiError.data?.message) {
                errorMessage += ` ${apiError.data.message}`;
              }
            }

            // Log detailed error information for debugging
            console.error("Error details:", {
              userId: storedUserId,
              ...(error && typeof error === 'object' && 'status' in error
                ? {
                    status: (error as { status: number }).status,
                    message: (error as { data?: { message?: string } }).data?.message ||
                             (error instanceof Error ? error.message : String(error))
                  }
                : { message: error instanceof Error ? error.message : String(error) })
            });

            setError(errorMessage);

            // Clear stored OAuth data to prevent future errors
            localStorage.removeItem("oauthLinkUserId");
            localStorage.removeItem("oauthLinkUserEmail");
            localStorage.removeItem("oauthLinkAccessToken");
            localStorage.removeItem("oauthLinkUserRole");
          }
        } else if (token) {
          // This is a regular OAuth login flow with a token
          console.log("Processing regular OAuth login flow with token");

          // Set the user in Redux store
          dispatch(setUser({
            user: {
              // This is a placeholder - in a real app, you'd get this from the token
              email: "user@example.com",
              role: "student",
            },
            token
          }));

          // Navigate based on user role (simplified for demo)
          navigate("/student/dashboard");
        } else {
          console.error("Invalid or missing authentication data");
          setError("Invalid or missing authentication data");
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        const errorMessage = error instanceof Error ? error.message : "Please try again.";
        setError(`Authentication failed: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuthCallback();
  }, [dispatch, navigate, location.search, linkOAuthAccount, refetch]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Processing Authentication</h1>
          <p className="text-gray-600">Please wait while we complete your authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Show success page if linking was successful
  if (isSuccess) {
    return (
      <AuthSuccessPage
        title="Account Connected Successfully"
        message="Your account has been successfully connected."
        redirectPath="/user/edit-profile?tab=connections"
        redirectTime={2}
      />
    );
  }

  // Default return - should not reach here in normal flow
  return null;
};

export default OAuthCallbackPage;
