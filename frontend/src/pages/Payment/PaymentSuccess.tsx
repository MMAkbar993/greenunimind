// src/pages/PaymentSuccess.tsx
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearCart } from "@/redux/features/cart/cartSlice";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetTransactionBySessionIdQuery } from "@/redux/features/payment/payment.api";
import {
  CheckCircle,
  ArrowRight,
  BookOpen,
  Clock,
  Calendar,
  CreditCard,
  User,
  Award,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { selectCurrentToken, TUser } from "@/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";
import { USER_ROLE } from "@/constants/global";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const PaymentSuccess = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const {
    data: userData,
    isLoading: userLoading,
    refetch,
  } = useGetMeQuery(undefined);
  const { data: transactionData, isLoading: transactionLoading } =
    useGetTransactionBySessionIdQuery(sessionId || "", { skip: !sessionId });
  const [countdown, setCountdown] = useState(5);
  const [isProcessing, setIsProcessing] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  const token = useAppSelector(selectCurrentToken);
  const user = token ? verifyToken(token) : null;
  const transaction = transactionData?.data;

  // Format date
  const formatDate = (dateString?: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  useEffect(() => {
    if (!sessionId) {
      toast.error("Invalid payment session. Redirecting to home page.");
      setShouldRedirect("/");
      return;
    }

    if (!token || (user && (user as TUser).role !== USER_ROLE.STUDENT)) {
      toast.error("You must be logged in as a student to view this page.");
      setShouldRedirect("/login");
    }
  }, [sessionId, token, user]);

  useEffect(() => {
    if (!shouldRedirect && userData?.data?._id) {
      // Clear the cart immediately - make sure this happens even if there's an error
      try {
        console.log("Clearing cart for user:", userData.data._id);
        dispatch(clearCart({ userId: userData.data._id }));

        // Also clear from localStorage directly as a backup
        localStorage.removeItem(`cart_${userData.data._id}`);
      } catch (error) {
        console.error("Error clearing cart:", error);
      }

      // Show success message
      toast.success("Payment successful! You are now enrolled in the course.");

      // Refresh user data to get updated enrollment status
      // Add a small delay to allow backend to process the webhook
      setTimeout(() => {
        refetch()
          .then(() => {
            console.log("User data refreshed after payment");
          })
          .catch((err) => {
            console.error("Error refreshing user data:", err);
          });
      }, 2000);

      // Simulate processing time
      const processingTimer = setTimeout(() => {
        setIsProcessing(false);
      }, 1500);

      // Set up countdown for auto-redirect
      const redirectTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(redirectTimer);
            navigate("/student/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(processingTimer);
        clearInterval(redirectTimer);
      };
    }
  }, [dispatch, navigate, userData?.data?._id, refetch, shouldRedirect]);

  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  // Loading state
  if (userLoading || transactionLoading) {
    return (
      <div className="my-10">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 mt-10">
          <Card className="w-full max-w-md shadow-lg border-0 overflow-hidden">
            <div className="bg-green-500 h-2 w-full"></div>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
                <h2 className="text-xl font-semibold text-gray-700">
                  Verifying Your Payment
                </h2>
                <p className="text-gray-500">
                  Please wait while we confirm your payment...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4 mt-16">
      <Card className="w-full max-w-2xl shadow-xl border-0 overflow-hidden">
        <div className="bg-green-500 h-2 w-full"></div>

        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            {/* Success Icon */}
            <div className="bg-green-100 p-4 rounded-full mb-6">
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
            </div>

            {/* Confetti Animation */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              <div className="animate-float-up-slow absolute -top-4 left-1/4 text-yellow-400">
                <Sparkles className="h-6 w-6 rotate-12" />
              </div>
              <div className="animate-float-up-medium absolute -top-4 left-1/2 text-green-400">
                <Sparkles className="h-4 w-4 -rotate-12" />
              </div>
              <div className="animate-float-up-fast absolute -top-4 right-1/4 text-blue-400">
                <Sparkles className="h-5 w-5 rotate-45" />
              </div>
            </div>

            {/* Title and Description */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Payment Successful!
            </h1>

            <p className="text-base sm:text-lg text-gray-600 mb-6 max-w-md">
              {isProcessing
                ? "We're processing your enrollment..."
                : "Your course enrollment has been completed successfully."}
            </p>

            {/* Transaction ID */}
            {sessionId && (
              <div className="bg-gray-50 px-4 py-3 rounded-md text-sm text-gray-500 mb-6 w-full max-w-md">
                <span className="font-medium">Transaction ID:</span>{" "}
                {sessionId.substring(0, 16)}...
              </div>
            )}

            {/* Transaction Details */}
            <div className="w-full max-w-md mb-6">
              <h3 className="font-medium text-left text-gray-700 mb-2">
                Transaction Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {transaction && transaction.courseId && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className="text-sm">Course</span>
                    </div>
                    <span className="text-sm font-medium">
                      {transaction.courseId.title}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">Date</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatDate(transaction?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span className="text-sm">Amount</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(
                      transaction?.totalAmount || transaction?.amount
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">Account</span>
                  </div>
                  <span className="text-sm font-medium">
                    {transaction?.studentId?.email ||
                      userData?.data?.email ||
                      transaction?.customerEmail}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    <span className="text-sm">Status</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {transaction?.status === "success"
                      ? "Completed"
                      : transaction?.status || "Completed"}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Info Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-6">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <BookOpen className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-800">Course Access</h3>
                  <p className="text-sm text-gray-600">
                    Immediate access granted
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg flex items-center">
                <Clock className="h-6 w-6 text-purple-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-800">Redirecting</h3>
                  <p className="text-sm text-gray-600">
                    In {countdown} seconds
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mb-6">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span>Redirecting to dashboard</span>
                <span>{countdown}s</span>
              </div>
              <Progress value={(5 - countdown) * 20} className="h-2" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-md">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate("/student/dashboard")}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {transaction && transaction.courseId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      navigate(`/course/${transaction.courseId._id}`)
                    }
                  >
                    View Course
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
