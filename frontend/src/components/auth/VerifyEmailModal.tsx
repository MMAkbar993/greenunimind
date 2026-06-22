import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { useVerifyEmailMutation, useResendVerificationEmailMutation } from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectCurrentUser, setUser } from "@/redux/features/auth/authSlice";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface VerifyEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VerifyEmailModal = ({ open, onOpenChange }: VerifyEmailModalProps) => {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendVerificationEmail, { isLoading: isResending }] = useResendVerificationEmailMutation();
  
  const [verificationCode, setVerificationCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  // Responsive UI
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setVerificationCode("");
      setIsVerified(false);
    }
  }, [open]);
  
  // If user is already verified, close the modal
  useEffect(() => {
    if (user?.isVerified) {
      onOpenChange(false);
    }
  }, [user, onOpenChange]);
  
  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    
    try {
      const result = await verifyEmail({ code: verificationCode }).unwrap();
      
      if (result.success) {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        
        // Update user state to reflect verified status
        if (user) {
          dispatch(setUser({
            user: { ...user, isVerified: true },
            token: localStorage.getItem("accessToken"),
          }));
        }
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to verify email:", error);
      toast.error("Invalid verification code. Please try again.");
    }
  };
  
  const handleResendVerification = async () => {
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
  
  const content = (
    <>
      {isVerified ? (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="bg-green-100 rounded-full p-3 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-700 mb-2">Email Verified!</h3>
          <p className="text-center text-gray-600 mb-4">
            Your email has been successfully verified. You now have full access to all features.
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <p className="text-gray-600">
            We've sent a verification code to <span className="font-medium">{user?.email}</span>.
            Please enter the 6-digit code below:
          </p>
          
          <div className="space-y-2">
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              <Button
                className="flex-1"
                onClick={handleVerifyEmail}
                disabled={verificationCode.length !== 6 || isVerifying}
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
              
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleResendVerification}
                disabled={isResending || cooldown > 0}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
  
  // Use Drawer on mobile, Dialog on larger screens
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>Verify Your Email</DrawerTitle>
            <DrawerDescription>
              Complete verification to access all features
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>
            Complete verification to access all features
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default VerifyEmailModal;
