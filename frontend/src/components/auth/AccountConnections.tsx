import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, ExternalLink, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectCurrentToken } from "@/redux/features/auth/authSlice";
import { useUnlinkOAuthAccountMutation, useGetMeQuery } from "@/redux/features/auth/authApi";
import { config } from "@/config";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaApple } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUserId, isValidObjectId } from "@/utils/getUserId";

const AccountConnections = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: userData } = useGetMeQuery(undefined);
  const [unlinkOAuthAccount, { isLoading: isUnlinking }] = useUnlinkOAuthAccountMutation();

  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);

  // Base URL for OAuth endpoints (same as API base)
  const baseUrl = config.apiBaseUrl;

  // State for debug panel
  const [showDebug, setShowDebug] = useState(false);

  // Log user data for debugging
  useEffect(() => {
    console.log('AccountConnections - Redux user:', user);
    console.log('AccountConnections - API user data:', userData);
    console.log('AccountConnections - Base URL:', baseUrl);
  }, [user, userData, baseUrl]);

  // Determine the effective user object (prefer API data if available)
  const effectiveUser = userData?.data || user;

  // Check which providers are connected
  const isGoogleConnected = !!(
    effectiveUser?.googleId ||
    (effectiveUser?.connectedAccounts && effectiveUser.connectedAccounts.google) ||
    (effectiveUser?.user && typeof effectiveUser.user === 'object' &&
      (effectiveUser.user.googleId ||
       (effectiveUser.user.connectedAccounts && effectiveUser.user.connectedAccounts.google)))
  );

  const isFacebookConnected = !!(
    effectiveUser?.facebookId ||
    (effectiveUser?.connectedAccounts && effectiveUser.connectedAccounts.facebook) ||
    (effectiveUser?.user && typeof effectiveUser.user === 'object' &&
      (effectiveUser.user.facebookId ||
       (effectiveUser.user.connectedAccounts && effectiveUser.user.connectedAccounts.facebook)))
  );

  const isAppleConnected = !!(
    effectiveUser?.appleId ||
    (effectiveUser?.connectedAccounts && effectiveUser.connectedAccounts.apple) ||
    (effectiveUser?.user && typeof effectiveUser.user === 'object' &&
      (effectiveUser.user.appleId ||
       (effectiveUser.user.connectedAccounts && effectiveUser.user.connectedAccounts.apple)))
  );

  // Check if user has a password set
  const hasPassword = !!effectiveUser?.hasPassword;

  // Count connected providers
  const connectedProvidersCount = [
    isGoogleConnected,
    isFacebookConnected,
    isAppleConnected,
  ].filter(Boolean).length;

  // Get the token from Redux store at component level
  const reduxToken = useAppSelector(selectCurrentToken);

  // Function to handle OAuth account linking
  const handleLinkAccount = (provider: string) => {
    const toastId = toast.loading("Connecting...");

    if (!effectiveUser) {
      toast.error("User data not found. Please try again later.");
      return;
    }

    // Extract the user ID using our utility function
    const userId = getUserId(effectiveUser);

    if (!userId) {
      // Log detailed information about the user object for debugging
      console.error("Failed to extract user ID. User object:", JSON.stringify(effectiveUser, null, 2));
      toast.error("User ID not found. Please try again later.", { id: toastId });
      return;
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(userId)) {
      toast.error("Invalid user ID format. Please try again later.", { id: toastId });
      console.error("Invalid user ID format:", userId);
      return;
    }

    // Get the user's email from the effective user object
    const userEmail = effectiveUser.email ||
      (effectiveUser.user && typeof effectiveUser.user === 'object' ? effectiveUser.user.email : '');

    if (!userEmail) {
      toast.error("User email not found. Please try again later.", { id: toastId });
      return;
    }

    // Store user ID in localStorage for the OAuth callback
    localStorage.setItem("oauthLinkUserId", userId);
    localStorage.setItem("oauthLinkUserEmail", userEmail);

    // Store the access token for verification in the callback
    // Try to get it from multiple sources to ensure we have it
    const accessToken = reduxToken || localStorage.getItem("accessToken");
    if (accessToken) {
      localStorage.setItem("oauthLinkAccessToken", accessToken);
      // Also set it as a cookie that will be sent with the request
      document.cookie = `authToken=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
    }

    // Log the stored data for debugging
    console.log("Storing OAuth linking data:", {
      userId,
      email: userEmail,
      role: effectiveUser.role || "unknown",
      source: userData ? "API data" : "Redux store",
      tokenAvailable: !!accessToken
    });

    // Show toast to indicate the process is starting
    toast.success(`Connecting to ${provider}...`, { id: toastId });

    // Construct the OAuth URL with linking=true
    const userRole = effectiveUser.role ||
      (effectiveUser.user && typeof effectiveUser.user === 'object' ? effectiveUser.user.role : 'student');

    const oauthUrl = `${baseUrl}/oauth/${provider}?role=${userRole}&linking=true`;

    console.log("Redirecting to OAuth URL:", oauthUrl);

    // Redirect to the OAuth provider
    window.location.href = oauthUrl;
  };

  // Function to handle OAuth account unlinking
  const handleUnlinkAccount = async () => {
    if (!unlinkProvider || !effectiveUser) {
      toast.error("Missing provider or user data.");
      setUnlinkDialogOpen(false);
      setUnlinkProvider(null);
      return;
    }

    // Extract the user ID using our utility function
    const userId = getUserId(effectiveUser);

    if (!userId) {
      // Log detailed information about the user object for debugging
      console.error("Failed to extract user ID for unlinking. User object:", JSON.stringify(effectiveUser, null, 2));
      toast.error("User ID not found. Please try again later.");
      setUnlinkDialogOpen(false);
      setUnlinkProvider(null);
      return;
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(userId)) {
      toast.error("Invalid user ID format. Please try again later.");
      console.error("Invalid user ID format:", userId);
      setUnlinkDialogOpen(false);
      setUnlinkProvider(null);
      return;
    }

    // Check if this is the only authentication method
    if (connectedProvidersCount === 1 && !hasPassword) {
      toast.error("You cannot remove your only authentication method. Please set a password first.");
      setUnlinkDialogOpen(false);
      setUnlinkProvider(null);
      return;
    }

    try {
      console.log("Unlinking OAuth account:", {
        userId,
        provider: unlinkProvider,
        source: userData ? "API data" : "Redux store"
      });

      const result = await unlinkOAuthAccount({
        userId: userId,
        provider: unlinkProvider,
      }).unwrap();

      if (result.success) {
        toast.success(`${unlinkProvider.charAt(0).toUpperCase() + unlinkProvider.slice(1)} account unlinked successfully!`);
        setUnlinkDialogOpen(false);
        setUnlinkProvider(null);
        // Force refresh to update user data
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to unlink account:", error);
      toast.error("Failed to unlink account. Please try again.");
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <span>Connected Accounts</span>
        </CardTitle>
        <CardDescription>
          Connect your account to different social providers for easier login
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Google Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200">
              <FcGoogle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Google</p>
              <p className="text-sm text-gray-500">
                {isGoogleConnected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>

          {isGoogleConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                setUnlinkProvider("google");
                setUnlinkDialogOpen(true);
              }}
              disabled={isUnlinking}
            >
              <Unlink className="mr-2 h-4 w-4 size" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLinkAccount("google")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>

        {/* Facebook Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200">
              <FaFacebook className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Facebook</p>
              <p className="text-sm text-gray-500">
                {isFacebookConnected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>

          {isFacebookConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                setUnlinkProvider("facebook");
                setUnlinkDialogOpen(true);
              }}
              disabled={isUnlinking}
            >
              <Unlink className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLinkAccount("facebook")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>

        {/* Apple Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200">
              <FaApple className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Apple</p>
              <p className="text-sm text-gray-500">
                {isAppleConnected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>

          {isAppleConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                setUnlinkProvider("apple");
                setUnlinkDialogOpen(true);
              }}
              disabled={isUnlinking}
            >
              <Unlink className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLinkAccount("apple")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-4">
        <p className="text-xs text-gray-500">
          Connecting accounts allows you to sign in using your social media accounts.
        </p>

        {/* Debug button and panel */}
        <div className="w-full">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-gray-500 underline"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>

          {showDebug && (
            <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
              <h3 className="font-bold mb-2">Debug Information</h3>
              <p className="mb-1"><strong>Base URL:</strong> {baseUrl}</p>
              <p className="mb-1"><strong>API Base URL:</strong> {baseUrl}</p>
              <p className="mb-1"><strong>OAuth URL Example:</strong> {`${baseUrl}/oauth/google?role=${effectiveUser?.role || 'student'}&linking=true`}</p>
              <p className="mb-3"><strong>User ID:</strong> {getUserId(effectiveUser) || 'Not found'}</p>

              <details>
                <summary className="cursor-pointer font-bold">User Data</summary>
                <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(effectiveUser, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </CardFooter>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlink {unlinkProvider?.charAt(0).toUpperCase() + unlinkProvider?.slice(1)} Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink your {unlinkProvider} account? You will no longer be able to sign in with it.
            </DialogDescription>
          </DialogHeader>

          {connectedProvidersCount === 1 && !hasPassword && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>
                You cannot remove your only authentication method. Please set a password first.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnlinkDialogOpen(false);
                setUnlinkProvider(null);
              }}
              disabled={isUnlinking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlinkAccount}
              disabled={isUnlinking || (connectedProvidersCount === 1 && !hasPassword)}
            >
              {isUnlinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlinking...
                </>
              ) : (
                "Unlink Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AccountConnections;
