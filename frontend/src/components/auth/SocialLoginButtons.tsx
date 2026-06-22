import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaApple } from "react-icons/fa";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { config } from "@/config";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { useGoogleLoginMutation } from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";

interface SocialLoginButtonsProps {
  isSignUp?: boolean;
  role?: "student" | "teacher";
  className?: string;
}

const SocialLoginButtons = ({
  isSignUp = false,
  role = "student",
  className,
}: SocialLoginButtonsProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const baseUrl = config.apiBaseUrl;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [googleLoginMutation] = useGoogleLoginMutation();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        if (!userInfoRes.ok) throw new Error("Failed to fetch Google user info");

        const googleUser = await userInfoRes.json();

        localStorage.setItem("oauthRequestedRole", role);

        const res = await googleLoginMutation({
          googleId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          photoUrl: googleUser.picture,
          role,
        }).unwrap();

        localStorage.setItem("accessToken", res.token || res.accessToken);
        if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);

        const user = res.user || res.data?.user;
        if (user) {
          dispatch(setUser({ user, token: res.token || res.accessToken }));
        }

        toast.success("Signed in with Google successfully!");

        const userRole = user?.role || role;
        if (userRole === "teacher") {
          navigate("/teacher/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      } catch (error: any) {
        const message = error?.data?.message || "Google sign in failed. Please try again.";
        toast.error(message);
      }
    },
    onError: () => toast.error("Google sign in failed. Please try again."),
  });

  const handleOAuthLogin = (provider: string) => {
    localStorage.setItem("oauthRequestedRole", role);
    window.location.href = `${baseUrl}/oauth/${provider}?role=${role}&linking=false`;
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
          onClick={() => googleLogin()}
        >
          <FcGoogle className="h-5 w-5" />
          <span>{isSignUp ? "Sign up" : "Continue"} with Google</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
          onClick={() => handleOAuthLogin("facebook")}
        >
          <FaFacebook className="h-5 w-5 text-blue-600" />
          <span>{isSignUp ? "Sign up" : "Continue"} with Facebook</span>
        </Button>

        {!isMobile && (
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={() => handleOAuthLogin("apple")}
          >
            <FaApple className="h-5 w-5" />
            <span>{isSignUp ? "Sign up" : "Continue"} with Apple</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SocialLoginButtons;
