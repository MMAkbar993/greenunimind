import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { authApi, useLinkOAuthAccountMutation } from "@/redux/features/auth/authApi";
import { useAppDispatch } from "@/redux/hooks";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkOAuthAccount] = useLinkOAuthAccountMutation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get("token");
        const provider = searchParams.get("provider");
        const providerId = searchParams.get("providerId");
        const email = searchParams.get("email");
        const isLinking = searchParams.get("isLinking") === "true";
        const errorParam = searchParams.get("error");

        // Clear sensitive URL params from browser history
        window.history.replaceState({}, document.title, "/oauth/callback");

        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          toast.error(`Authentication failed: ${errorParam}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Account linking flow
        if (isLinking && provider && providerId) {
          const storedUserId = localStorage.getItem("oauthLinkUserId");
          if (!storedUserId) {
            setError("User ID not found. Please try linking from your profile settings.");
            toast.error("User ID not found. Please try again.");
            setTimeout(() => navigate("/user/edit-profile"), 3000);
            return;
          }

          try {
            await linkOAuthAccount({
              userId: storedUserId,
              provider: provider as "google" | "facebook" | "apple",
              providerId,
              email: email || undefined,
            }).unwrap();

            toast.success(
              `${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully!`
            );
            localStorage.removeItem("oauthLinkUserId");
            localStorage.removeItem("oauthLinkUserEmail");
            localStorage.removeItem("oauthLinkAccessToken");
            localStorage.removeItem("oauthLinkUserRole");
            setTimeout(() => navigate("/user/edit-profile?tab=connections&linked=true"), 1000);
          } catch (linkError: any) {
            const msg =
              linkError?.data?.message || "Failed to link account. Please try again.";
            setError(msg);
            toast.error(msg);
            setTimeout(() => navigate("/user/edit-profile"), 3000);
          }
          return;
        }

        // Regular OAuth login/signup flow
        if (token && provider) {
          localStorage.setItem("accessToken", token);

          try {
            const userData = await dispatch(
              authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })
            ).unwrap();

            if (!userData?.data) throw new Error("Invalid user data received");

            const user = {
              ...userData.data,
              photoUrl: userData.data.profileImg || null,
              role: userData.data.role,
            };

            dispatch(setUser({ user, token }));
            toast.success("Logged in successfully!");

            if (user.role === "teacher") {
              navigate("/teacher/dashboard");
            } else if (user.role === "student") {
              const hasEnrolled = user.enrolledCourses?.length > 0;
              navigate(hasEnrolled ? "/student/dashboard" : "/");
            } else {
              navigate("/");
            }
          } catch {
            setError("Failed to complete login. Please try again.");
            toast.error("Failed to complete login. Please try again.");
            setTimeout(() => navigate("/login"), 3000);
          }
          return;
        }

        // No valid params — redirect to login
        navigate("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing Authentication</h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors mb-4"
            >
              Return to Login
            </button>
            <p className="text-sm text-gray-500">
              Redirecting automatically in a few seconds...
            </p>
          </>
        ) : (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>
            <p className="text-gray-600 mb-4">
              You have been successfully authenticated.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to your dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
