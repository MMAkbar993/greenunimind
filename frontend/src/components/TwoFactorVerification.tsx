import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVerifyLoginTwoFactorMutation } from "@/redux/features/auth/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";

interface TwoFactorVerificationProps {
  email: string;
  onCancel: () => void;
}

const TwoFactorVerification = ({ email, onCancel }: TwoFactorVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyTwoFactorLogin, { isLoading }] = useVerifyTwoFactorLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    try {
      const result = await verifyTwoFactorLogin({
        email,
        token: verificationCode,
      }).unwrap();

      // Set user in Redux store
      dispatch(setUser({ user: result.user, token: result.token }));

      toast.success("Authentication successful");

      // Navigate based on user role and enrolled courses
      const userData = result.user;

      if (userData.role === "student") {
        // Check if student has enrolled courses directly from the response
        const hasEnrolledCourses = userData.enrolledCourses && userData.enrolledCourses.length > 0;
        console.log("Student has enrolled courses:", hasEnrolledCourses);

        if (hasEnrolledCourses) {
          navigate("/student/dashboard");
        } else {
          navigate("/");
        }
      } else if (userData.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("2FA verification failed:", error);
      toast.error("Invalid verification code. Please try again.");
    }
  };

  const handleRecoveryCode = () => {
    // For simplicity, we'll use the same verification flow for recovery codes
    // In a real app, you might want to have a separate UI for recovery codes
    toast.info("Enter your recovery code in the verification field");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-center">Two-Factor Authentication</h2>
        <p className="text-gray-600 text-center mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="000000"
            maxLength={6}
            className="text-center text-xl tracking-widest font-mono"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
          />
          <p className="text-sm text-gray-500 text-center">
            Open your authenticator app to view your verification code
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleVerify}
            disabled={isLoading || verificationCode.length !== 6}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-500"
            >
              Back to Login
            </Button>

            <Button
              variant="link"
              onClick={handleRecoveryCode}
              disabled={isLoading}
              className="text-primary"
            >
              Use Recovery Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;
