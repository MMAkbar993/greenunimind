import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLinkOAuthAccountMutation, useUnlinkOAuthAccountMutation, useGetMeQuery, authApi } from "@/redux/features/auth/authApi";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectCurrentUser, selectCurrentToken } from "@/redux/features/auth/authSlice";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle, Check, Loader2, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import GoogleIcon from "@/components/icons/GoogleIcon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { config } from "@/config";

const OAuthLinking = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectCurrentToken);
  const [linkOAuthAccount, { isLoading: isLinking }] = useLinkOAuthAccountMutation();
  const [unlinkOAuthAccount, { isLoading: isUnlinking }] = useUnlinkOAuthAccountMutation();
  const { refetch } = useGetMeQuery(undefined, { skip: !token });

  const [isGoogleAuthInProgress, setIsGoogleAuthInProgress] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [actualUserId, setActualUserId] = useState<string | null>(null);
  const [isLoadingUserId, setIsLoadingUserId] = useState(false);

  // Function to get the actual user ID from the backend
  const fetchActualUserId = async () => {
    setIsLoadingUserId(true);
    try {
      // Use RTK Query to get user data instead of direct fetch
      // This ensures we use the correct API base URL configuration
      const userData = await dispatch(
        authApi.endpoints.getMe.initiate(undefined, { forceRefresh: true })
      ).unwrap();

      const data = userData;
      console.log('Fetched user data:', data);

      // Extract the user ID from the response
      let userId = null;

      if (data.data && data.data.user && data.data.user._id) {
        // If we have a nested user object (student/teacher)
        userId = data.data.user._id;
        console.log('Found user ID in nested user object:', userId);
      } else if (data.data && data.data._id) {
        // Direct user object
        userId = data.data._id;
        console.log('Found user ID in direct user object:', userId);
      } else if (data.data && data.data.id) {
        // Some responses use 'id' instead of '_id'
        userId = data.data.id;
        console.log('Found user ID as "id" property:', userId);
      } else if (data.data && data.data.userId) {
        // Some responses include an explicit userId field
        userId = data.data.userId;
        console.log('Found explicit userId property:', userId);
      }

      if (userId) {
        setActualUserId(userId);

        // Store the user ID in localStorage as a backup
        localStorage.setItem("userActualId", userId);

        return userId;
      } else {
        // As a last resort, check if we have a stored ID
        const storedId = localStorage.getItem("userActualId");
        if (storedId) {
          console.log('Using previously stored user ID:', storedId);
          setActualUserId(storedId);
          return storedId;
        }

        throw new Error('User ID not found in response');
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);

      // As a last resort, check if we have a stored ID
      const storedId = localStorage.getItem("userActualId");
      if (storedId) {
        console.log('Using previously stored user ID after error:', storedId);
        setActualUserId(storedId);
        return storedId;
      }

      return null;
    } finally {
      setIsLoadingUserId(false);
    }
  };

  // Check if Google is already linked
  const isGoogleLinked = !!user?.googleId;

  // Fetch the actual user ID when the component mounts
  useEffect(() => {
    if (user && token) {
      fetchActualUserId();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Check for OAuth linking parameters in URL
  useEffect(() => {
    const checkOAuthParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthProvider = urlParams.get("provider");
      const oauthId = urlParams.get("id");
      const oauthEmail = urlParams.get("email");
      const error = urlParams.get("error");

      console.log("Checking OAuth params:", { oauthProvider, oauthId, oauthEmail, error });

      // Clear URL parameters
      if (oauthProvider || oauthId || oauthEmail || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (error) {
        const errorMessage = decodeURIComponent(error);
        console.error("OAuth error:", errorMessage);
        setLinkError(errorMessage);
        setConnectionStatus("error");
        return;
      }

      // If we have OAuth parameters, try to link the account
      if (oauthProvider && oauthId && oauthEmail) {
        // First check if we have a user
        if (!user) {
          console.error("User data missing for OAuth linking");
          setLinkError("User data not found. Please refresh and try again.");
          setConnectionStatus("error");
          return;
        }

        try {
          // Fetch the actual user ID from the backend
          const userId = await fetchActualUserId();

          if (!userId) {
            console.error("Could not determine user ID from backend");
            setLinkError("Could not determine your user ID. Please try again later.");
            setConnectionStatus("error");
            return;
          }

          console.log("Attempting to link OAuth account:", {
            userId: userId,
            provider: oauthProvider,
            providerId: oauthId,
            email: oauthEmail,
            studentId: user._id || null
          });

          await linkOAuthAccount({
            userId: userId,
            provider: oauthProvider as "google" | "facebook" | "apple",
            providerId: oauthId,
            email: oauthEmail
          }).unwrap();

          // Refresh user data
          await refetch();

          setConnectionStatus("success");
          toast.success(`${oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)} account linked successfully`);
        } catch (error) {
          console.error(`Failed to link ${oauthProvider} account:`, error);
          setLinkError(`Failed to link ${oauthProvider} account. Please try again.`);
          setConnectionStatus("error");
        }
      }
    };

    checkOAuthParams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, linkOAuthAccount, refetch]);

  const handleGoogleLink = async () => {
    // Check if user exists and has required data
    if (!user) {
      toast.error("User data not found. Please refresh the page and try again.");
      return;
    }

    // Check if email exists
    if (!user.email) {
      console.error("User object missing email:", user);
      toast.error("User email not found. Please refresh the page and try again.");
      return;
    }

    setLinkError(null);
    setConnectionStatus("idle");

    // Show loading toast
    const toastId = toast.loading("Preparing OAuth connection...");

    try {
      // Fetch the actual user ID from the backend
      const userId = await fetchActualUserId();

      if (!userId) {
        toast.error("Could not determine your user ID. Please try again later.", { id: toastId });
        return;
      }

      // Get the user's role - this is critical to preserve during account linking
      const userRole = user?.role;

      // Log the user data being stored
      console.log("Storing OAuth linking data:", {
        userId: userId,
        email: user.email,
        studentId: user._id || null,
        role: userRole
      });

      // Store user ID in localStorage for the OAuth callback
      localStorage.setItem("oauthLinkUserId", userId);
      localStorage.setItem("oauthLinkUserEmail", user.email);
      localStorage.setItem("oauthLinkUserRole", userRole);

      // Also store the access token for verification in the callback
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        localStorage.setItem("oauthLinkAccessToken", accessToken);
      }

      // Update toast
      toast.success("Ready to connect with Google", { id: toastId });

      // Set auth in progress flag
      setIsGoogleAuthInProgress(true);

      // Redirect to Google OAuth endpoint with linking=true parameter
      // Include the role in the state parameter - this ensures the role is preserved
      // Use the backend URL directly to avoid frontend URL showing in the callback
      const url = `${config.apiBaseUrl}/oauth/google?linking=true&role=${userRole}&token=${token}`;
      console.log("Redirecting to OAuth URL:", url);
      window.location.href = url;
    } catch (error) {
      console.error("Error preparing for OAuth connection:", error);
      toast.error("Failed to prepare OAuth connection. Please try again.", { id: toastId });
    }
  };

  const handleGoogleUnlink = async () => {
    // Check if user exists and has required data
    if (!user) {
      toast.error("User data not found. Please refresh the page and try again.");
      return;
    }

    // Show loading toast
    const toastId = toast.loading("Unlinking Google account...");

    try {
      // Fetch the actual user ID from the backend
      const userId = await fetchActualUserId();

      if (!userId) {
        toast.error("Could not determine your user ID. Please try again later.", { id: toastId });
        return;
      }

      console.log("Unlinking Google account for user:", userId);

      await unlinkOAuthAccount({
        userId: userId,
        provider: "google",
      }).unwrap();

      // Refresh user data
      await refetch();

      toast.success("Google account unlinked successfully", { id: toastId });
      setConnectionStatus("idle");
    } catch (error) {
      console.error("Failed to unlink Google account:", error);
      toast.error("Failed to unlink Google account", { id: toastId });
    }
  };

  const resetConnectionStatus = () => {
    setConnectionStatus("idle");
    setLinkError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Connected Accounts</CardTitle>
        <CardDescription>
          Connect your accounts to enable simplified login and enhanced security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus === "error" && linkError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {linkError}
              <Button
                variant="link"
                className="p-0 h-auto text-sm ml-2"
                onClick={resetConnectionStatus}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === "success" && (
          <Alert className="mb-4">
            <Check className="h-4 w-4" />
            <AlertTitle>Connection Successful</AlertTitle>
            <AlertDescription>
              Your account has been successfully connected.
              <Button
                variant="link"
                className="p-0 h-auto text-sm ml-2 text-green-700"
                onClick={resetConnectionStatus}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Google</h3>
              <p className="text-sm text-gray-500">
                {isGoogleLinked
                  ? "Your Google account is connected"
                  : "Connect your Google account for simplified login"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGoogleLinked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center w-8 h-8 bg-green-50 text-green-600 rounded-full mr-2">
                      <Check className="w-4 h-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Account connected</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {isGoogleLinked ? (
              <Button
                variant="outline"
                onClick={handleGoogleUnlink}
                disabled={isUnlinking}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isUnlinking ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleGoogleLink}
                disabled={isLinking || isGoogleAuthInProgress}
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                {isLinking || isGoogleAuthInProgress ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            )}
          </div>
        </div>

        {isGoogleLinked && (
          <div className="flex items-center gap-2 p-3 text-sm bg-green-50 text-green-700 rounded-md">
            <Check className="w-4 h-4" />
            <span>Google account successfully connected</span>
          </div>
        )}

        <div className="p-4 text-sm bg-blue-50 text-blue-700 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Why connect accounts?</p>
              <ul className="mt-1 ml-5 list-disc">
                <li>Sign in more easily using your connected accounts</li>
                <li>Enhanced security with multiple authentication options</li>
                <li>Recover access to your account if you forget your password</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Connection Troubleshooting</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              If you're having trouble connecting your Google account, try these steps:
            </p>
            <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
              <li>Make sure you're signed in to the Google account you want to connect</li>
              <li>Clear your browser cookies and cache</li>
              <li>Try using a different browser</li>
              <li>Ensure you have allowed third-party cookies in your browser settings</li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://support.google.com/accounts/answer/112802", "_blank")}
              className="mt-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Google Account Help
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OAuthLinking;