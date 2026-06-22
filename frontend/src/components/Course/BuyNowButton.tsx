import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ButtonProps } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import { USER_ROLE } from "@/constants/global";

interface BuyNowButtonProps extends ButtonProps {
  courseId: string;
  isEnrolled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const BuyNowButton = ({
  courseId,
  isEnrolled,
  className,
  variant = "default",
  ...props
}: BuyNowButtonProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user data
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const user = userData?.data;
  
  // Check if user is a student
  const isStudent = user?.role === USER_ROLE.STUDENT;
  
  const handleBuyNow = () => {
    setIsLoading(true);
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please login to continue");
      navigate("/login");
      setIsLoading(false);
      return;
    }
    
    // Check if user is a student
    if (!isStudent) {
      toast.error("Only students can purchase courses");
      setIsLoading(false);
      return;
    }
    
    // Check if already enrolled
    if (isEnrolled) {
      toast.error("You are already enrolled in this course");
      setIsLoading(false);
      return;
    }
    
    // Navigate to checkout page
    navigate(`/payment/checkout/${courseId}`);
    setIsLoading(false);
  };
  
  // If already enrolled, show a disabled button
  if (isEnrolled) {
    return (
      <Button 
        className={className} 
        variant="outline" 
        disabled 
        {...props}
      >
        Already Enrolled
      </Button>
    );
  }
  
  return (
    <Button
      className={className}
      variant={variant}
      onClick={handleBuyNow}
      disabled={isLoading || isUserLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Buy Now
        </>
      )}
    </Button>
  );
};

export default BuyNowButton;
