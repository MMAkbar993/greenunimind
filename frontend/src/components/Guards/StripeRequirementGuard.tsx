import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useCheckStripeAccountStatusQuery, useCreateAccountLinkMutation } from '@/redux/features/payment/payment.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  ArrowLeft,
  Shield,
  DollarSign,
  Users,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface StripeRequirementGuardProps {
  children: React.ReactNode;
  requireForPaidCourses?: boolean;
  showWarningOnly?: boolean;
}

const StripeRequirementGuard: React.FC<StripeRequirementGuardProps> = ({
  children,
  requireForPaidCourses = false,
  showWarningOnly = false
}) => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  const {
    data: stripeStatus,
    isLoading: isStripeStatusLoading,
    refetch: refetchStripeStatus
  } = useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });

  const [createAccountLink] = useCreateAccountLinkMutation();

  const isStripeConnected = stripeStatus?.data?.isConnected;
  const isStripeVerified = stripeStatus?.data?.isVerified;
  const onboardingComplete = stripeStatus?.data?.onboardingComplete;

  const handleConnectStripe = async () => {
    if (!teacherId) {
      toast.error('Teacher ID is missing. Please try again.');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await createAccountLink(teacherId).unwrap();
      
      if (result.data?.url) {
        window.open(result.data.url, '_blank');
        toast.info('Complete your Stripe setup in the new tab. Return here when finished.');
        
        // Poll for status updates
        const pollInterval = setInterval(async () => {
          try {
            await refetchStripeStatus();
            const updatedStatus = await refetchStripeStatus();
            if (updatedStatus.data?.data?.isConnected) {
              clearInterval(pollInterval);
              toast.success('Stripe account connected successfully!');
            }
          } catch (error) {
            // Ignore polling errors
          }
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);
      } else {
        toast.error('Failed to create Stripe onboarding link. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to create account link:', error);
      toast.error(error?.data?.message || 'Failed to connect Stripe account');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/teacher/dashboard');
  };

  // Show loading state
  if (isStripeStatusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Checking your account status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If Stripe is connected and verified, show children
  if (isStripeConnected && isStripeVerified && onboardingComplete) {
    return <>{children}</>;
  }

  // If only warning is needed and not blocking
  if (showWarningOnly) {
    return (
      <>
        {!isStripeConnected && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Payment Setup Required:</strong> To receive payments for paid courses, 
              you'll need to connect your Stripe account. You can still create free courses without this setup.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2 text-amber-700 underline"
                onClick={handleConnectStripe}
                disabled={isConnecting}
              >
                Connect now
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {children}
      </>
    );
  }

  // Show Stripe requirement screen
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Setup Required
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              To create and sell courses on our platform, you need to connect your Stripe account. 
              This ensures secure payment processing and direct deposits to your bank account.
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-600">
                Industry-leading security with PCI compliance and fraud protection
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Direct Deposits</h3>
              <p className="text-sm text-gray-600">
                Receive 70% of course revenue directly to your bank account
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
              <p className="text-sm text-gray-600">
                Accept payments from students worldwide in multiple currencies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Connect Your Stripe Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Account Connection</span>
                <Badge variant={isStripeConnected ? "default" : "secondary"}>
                  {isStripeConnected ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
              
              {isStripeConnected && (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Account Verification</span>
                    <Badge variant={isStripeVerified ? "default" : "secondary"}>
                      {isStripeVerified ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Onboarding Complete</span>
                    <Badge variant={onboardingComplete ? "default" : "secondary"}>
                      {onboardingComplete ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Incomplete
                        </>
                      )}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {isStripeConnected ? 'Complete Setup' : 'Connect with Stripe'}
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="flex-1 sm:flex-none"
              >
                Maybe Later
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                The setup process takes 2-3 minutes. You'll be redirected to Stripe's secure platform 
                to verify your identity and bank account details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StripeRequirementGuard;
