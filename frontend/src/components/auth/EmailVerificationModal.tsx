import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useVerifyEmailMutation, useResendVerificationEmailMutation } from "@/redux/features/auth/authApi";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectCurrentUser, setUser } from "@/redux/features/auth/authSlice";

interface EmailVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailVerificationModal = ({ open, onOpenChange }: EmailVerificationModalProps) => {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendVerificationEmail, { isLoading: isResending }] = useResendVerificationEmailMutation();
  const [cooldown, setCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setVerificationCode("");
      setVerificationSuccess(false);
    }
  }, [open]);
  
  const handleVerify = async () => {
    if (!verificationCode.trim() || !user) return;
    
    try {
      const result = await verifyEmail({
        email: user.email,
        code: verificationCode.trim(),
      }).unwrap();
      
      if (result.success) {
        setVerificationSuccess(true);
        
        // Update user state to reflect verified status
        if (user) {
          dispatch(
            setUser({
              user: { ...user, isVerified: true },
              token: localStorage.getItem("accessToken"),
            })
          );
        }
        
        toast.success("Email verified successfully!");
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error("Invalid verification code. Please try again.");
    }
  };
  
  const handleResend = async () => {
    if (cooldown > 0 || !user) return;
    
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>
            We've sent a verification code to {user?.email}. Please enter the code below to verify your email address.
          </DialogDescription>
        </DialogHeader>
        
        {verificationSuccess ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-green-700">Email Verified!</h3>
            <p className="text-center text-gray-600 mt-2">
              Your email has been successfully verified. You now have full access to all features.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
                className="order-2 sm:order-1"
              >
                {isResending ? (
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
                    Resend Code
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleVerify}
                disabled={!verificationCode.trim() || isVerifying}
                className="order-1 sm:order-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationModal;
