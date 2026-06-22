import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useResendVerificationEmailMutation } from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

const EmailVerificationBanner = () => {
  const user = useAppSelector(selectCurrentUser);
  const [resendVerificationEmail, { isLoading }] = useResendVerificationEmailMutation();
  const [cooldown, setCooldown] = useState(0);
  
  // If user is verified or no user is logged in, don't show the banner
  if (!user || user.isVerified) {
    return null;
  }
  
  const handleResendVerification = async () => {
    if (cooldown > 0) return;
    
    try {
      await resendVerificationEmail({ email: user.email }).unwrap();
      toast.success("Verification email sent! Please check your inbox.");
      
      // Set cooldown for 60 seconds
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      toast.error("Failed to send verification email. Please try again later.");
    }
  };
  
  return (
    <Alert variant="destructive" className="mb-6 border-amber-300 bg-amber-50">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
        <div>
          <AlertTitle className="text-amber-800">Email verification required</AlertTitle>
          <AlertDescription className="text-amber-700">
            Please verify your email address to access all features.
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
          onClick={handleResendVerification}
          disabled={isLoading || cooldown > 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : cooldown > 0 ? (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Resend in {cooldown}s
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Resend verification
            </>
          )}
        </Button>
      </div>
    </Alert>
  );
};

export default EmailVerificationBanner;
