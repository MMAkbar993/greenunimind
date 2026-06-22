import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/utils/toast";
import { config } from "@/config";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { useAppDispatch } from "@/redux/hooks";
import { setUser, TUser } from "@/redux/features/auth/authSlice";
import {
  useVerifyEmailMutation,
  useResendVerificationEmailMutation
} from "@/redux/features/auth/authApi";

const OTPVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const email = searchParams.get("email");
  const [otp, setOtp] = useState("");
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  // Rate limiting state
  const [rateLimitStatus, setRateLimitStatus] = useState<{
    attempts: number;
    remaining: number;
    isLocked: boolean;
    lockReason?: string;
    lockTimeRemaining?: number;
    resendCooldownRemaining?: number;
    canResend: boolean;
  } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationEmailMutation();

  // Function to fetch rate limiting status
  const fetchRateLimitStatus = async () => {
    if (!email) return;

    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/rate-limit-status?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        setRateLimitStatus(data.data);
        setResendCooldown(data.data.resendCooldownRemaining || 0);
        setLockTimeRemaining(data.data.lockTimeRemaining || 0);
      }
    } catch (error) {
      console.error('Failed to fetch rate limit status:', error);
    }
  };

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      toast.error("No email provided. Please sign up again.");
      navigate("/signup");
    }
  }, [email, navigate]);

  // Fetch rate limiting status on component mount
  useEffect(() => {
    fetchRateLimitStatus();
  }, [email]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Lock time remaining timer
  useEffect(() => {
    if (lockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setLockTimeRemaining(lockTimeRemaining - 1);
        // Refresh rate limit status when lock expires
        if (lockTimeRemaining === 1) {
          setTimeout(fetchRateLimitStatus, 1000);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockTimeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      toast.error("Please enter the verification code");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Verification code must be 6 digits");
      return;
    }



    // Check if account is locked
    if (rateLimitStatus?.isLocked) {
      toast.error("Account is temporarily locked", {
        description: "Too many failed attempts. Please wait before trying again.",
        duration: 4000
      });
      return;
    }

    const toastId = toast.loading("Verifying your code...", {
      description: "Please wait while we verify your code"
    });

    try {
      setVerificationAttempts(prev => prev + 1);
      const result = await verifyEmail({ email, code: otp }).unwrap();
      
      // Set user in Redux store after successful verification
      const user: TUser = {
        email: result.data.user.email,
        name: result.data.user.name || { firstName: "", lastName: "" },
        photoUrl: result.data.user.photoUrl || "",
        role: result.data.user.role,
        isDeleted: result.data.user.isDeleted || false,
        isVerified: true,
        createdAt: result.data.user.createdAt,
        updatedAt: result.data.user.updatedAt,
      };

      dispatch(setUser({ user, token: result.data.accessToken }));

      toast.success("Email verified successfully!", {
        id: toastId,
        duration: 2000,
      });

      // Navigate based on user role
      if (result.data.user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else if (result.data.user.role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);

      // Handle specific error types
      if (error?.status === 401) {
        toast.error("Invalid verification code", {
          id: toastId,
          description: "Please check your code and try again. Codes are case-sensitive.",
          duration: 4000,
        });
      } else if (error?.status === 410) {
        toast.error("Verification code has expired", {
          id: toastId,
          description: "Please request a new code to continue.",
          duration: 4000,
        });

      } else if (error?.status === 429) {
        toast.error("Too many attempts", {
          id: toastId,
          description: "Account temporarily locked for security. Please wait before trying again.",
          duration: 5000,
        });
        // Refresh rate limit status
        await fetchRateLimitStatus();
      } else {
        toast.error(error?.data?.message || "Verification failed", {
          id: toastId,
          description: "Please check your code and try again.",
          duration: 4000,
        });
      }

      // Clear OTP on error for security
      setOtp("");
    }
  };

  const handleResendOTP = useCallback(async () => {
    if (!email) return;

    // Check if account is locked
    if (rateLimitStatus?.isLocked) {
      const timeRemaining = Math.ceil(lockTimeRemaining / 60);
      toast.error("Account is temporarily locked", {
        description: `Please try again in ${timeRemaining} minutes.`,
        duration: 4000
      });
      return;
    }

    // Check resend cooldown
    if (resendCooldown > 0) {
      toast.error("Please wait before requesting a new code", {
        description: `You can request a new code in ${resendCooldown} seconds.`,
        duration: 3000
      });
      return;
    }

    const toastId = toast.loading("Sending new verification code...", {
      description: "Please wait while we send a new code to your email"
    });

    try {
      const result = await resendVerification({ email }).unwrap();

      toast.success("New verification code sent!", {
        id: toastId,
        description: `Check your email for the new 6-digit code. Code expires in 5 minutes.`,
        duration: 4000,
      });

      // Clear current OTP and reset verification attempts
      setOtp("");
      setVerificationAttempts(0);

      // Set resend cooldown from server response or default to 60 seconds
      const cooldown = result?.data?.cooldownSeconds || 60;
      setResendCooldown(cooldown);

      // Refresh rate limit status
      await fetchRateLimitStatus();

    } catch (error: any) {
      console.error("Resend OTP error:", error);

      // Handle specific error types
      if (error?.status === 429) {
        if (error?.data?.data?.isLocked) {
          setLockTimeRemaining(error.data.data.timeRemaining * 60 || 1800);
          toast.error("Account temporarily locked", {
            id: toastId,
            description: "Too many resend attempts. Please wait before trying again.",
            duration: 5000
          });
        } else if (error?.data?.data?.isResendCooldown) {
          setResendCooldown(error.data.data.remainingTime || 60);
          toast.error("Please wait before requesting a new code", {
            id: toastId,
            description: `You can request a new code in ${error.data.data.remainingTime || 60} seconds.`,
            duration: 4000
          });
        } else {
          toast.error("Too many requests", {
            id: toastId,
            description: "Please wait before requesting another code.",
            duration: 4000
          });
        }
      } else if (error?.status === 404) {
        toast.error("User not found", {
          id: toastId,
          description: "Please check your email address and try again.",
          duration: 4000
        });
      } else {
        toast.error("Failed to send verification code", {
          id: toastId,
          description: error?.data?.message || "Please try again later.",
          duration: 4000
        });
      }

      // Refresh rate limit status
      await fetchRateLimitStatus();
    }
  }, [email, rateLimitStatus, lockTimeRemaining, resendCooldown, resendVerification, fetchRateLimitStatus]);



  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg mt-3">
            We've sent a 6-digit verification code to
            <br />
            <span className="font-semibold text-gray-900 text-base">{email}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 px-8">
          <div className="space-y-4">
            <label className="text-base font-semibold text-gray-800 block text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                onComplete={(value) => {
                  if (value.length === 6) {
                    handleVerifyOTP();
                  }
                }}
                className="gap-3"
              >
                <InputOTPGroup className="gap-3">
                  <InputOTPSlot
                    index={0}
                    className="w-12 h-12 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 hover:border-emerald-300"
                  />
                  <InputOTPSlot
                    index={1}
                    className="w-12 h-12 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 hover:border-emerald-300"
                  />
                  <InputOTPSlot
                    index={2}
                    className="w-12 h-12 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 hover:border-emerald-300"
                  />
                  <InputOTPSlot
                    index={3}
                    className="w-12 h-12 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 hover:border-emerald-300"
                  />
                  <InputOTPSlot
                    index={4}
                    className="w-12 h-12 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 hover:border-emerald-300"
                  />
                  <InputOTPSlot
                    index={5}
                    className="w-12 h-12 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 hover:border-emerald-300"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button
            onClick={handleVerifyOTP}
            disabled={isVerifying || otp.length !== 6}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          <div className="text-center space-y-4">
            {/* Rate Limiting Status */}
            {rateLimitStatus?.isLocked && lockTimeRemaining > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-semibold mb-2">
                  🔒 Account Temporarily Locked
                </p>
                <p className="text-xs text-red-600">
                  {rateLimitStatus.lockReason}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Unlock in: <span className="font-bold">{formatTime(lockTimeRemaining)}</span>
                </p>
              </div>
            )}

            {/* Rate Limiting Attempts Counter */}
            {rateLimitStatus && !rateLimitStatus.isLocked && rateLimitStatus.remaining < 3 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ {rateLimitStatus.remaining} attempts remaining
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Account will be locked after {rateLimitStatus.remaining} more failed attempts
                </p>
              </div>
            )}

            {/* Resend Cooldown Timer */}
            <CountdownTimer
              initialSeconds={resendCooldown}
              onComplete={() => {}}
              onResend={handleResendOTP}
              isResending={isResending}
              disabled={rateLimitStatus?.isLocked || false}
              className="mb-4"
            />
          </div>


        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerificationPage;
