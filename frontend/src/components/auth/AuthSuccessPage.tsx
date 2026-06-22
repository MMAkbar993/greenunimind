import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthSuccessPageProps {
  title?: string;
  message?: string;
  redirectPath?: string;
  redirectTime?: number;
}

const AuthSuccessPage = ({
  title = "Authentication Successful",
  message = "Your account has been successfully connected.",
  redirectPath = "/dashboard",
  redirectTime = 3
}: AuthSuccessPageProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(redirectTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, redirectPath]);

  const handleContinue = () => {
    navigate(redirectPath);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg border-green-100">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-gray-600">{message}</p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting in {countdown} seconds...
          </p>
          <Button 
            onClick={handleContinue} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Continue Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSuccessPage;
