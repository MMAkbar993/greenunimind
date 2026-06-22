// src/pages/PaymentCancel.tsx
import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { XCircle, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentToken, TUser } from "@/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";
import { USER_ROLE } from "@/constants/global";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  // Authentication check
  const token = useAppSelector(selectCurrentToken);
  const user = token ? verifyToken(token) : null;

  // Check for authentication
  useEffect(() => {
    // If user is not logged in or not a student, redirect to login
    if (!token || (user && (user as TUser).role !== USER_ROLE.STUDENT)) {
      toast.error("You must be logged in as a student to view this page.");
      setShouldRedirect("/login");
      return;
    }

    // Show error message
    toast.error("Payment was cancelled. You have not been charged.");

    // Start countdown for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, token, user]);

  // Handle redirects for unauthorized access
  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4">
      <Card className="max-w-2xl w-full shadow-xl border-0 overflow-hidden">
        <div className="bg-red-500 h-2 w-full"></div>

        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-4 rounded-full mb-6">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Cancelled</h1>

            <p className="text-lg text-gray-600 mb-6 max-w-md">
              Your payment was not completed and you have not been charged.
            </p>

            <div className="bg-gray-50 px-4 py-3 rounded-md text-sm text-gray-500 mb-6 w-full max-w-md">
              <p>Redirecting to home page in <span className="font-medium">{countdown}</span> seconds</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/courses")}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Return to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;