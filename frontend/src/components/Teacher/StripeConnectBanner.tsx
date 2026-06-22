import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateStripeAccountMutation,
  useCheckStripeAccountStatusQuery,
  useCreateAccountLinkMutation,
  useUpdateStripeAccountMutation
} from "@/redux/features/payment/payment.api";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

interface StripeConnectBannerProps {
  teacherId: string;
}

const StripeConnectBanner = ({ teacherId }: StripeConnectBannerProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // Check if the teacher has a Stripe account
  const { data: stripeStatus, isLoading, refetch } = useCheckStripeAccountStatusQuery(teacherId, {
    refetchOnMountOrArgChange: true,
  });

  // Mutations for connecting Stripe and creating onboarding links
  const [createStripeAccount] = useCreateStripeAccountMutation();
  const [createAccountLink] = useCreateAccountLinkMutation();
  const [updateStripeAccount] = useUpdateStripeAccountMutation();

  // Function to manually update the Stripe verification status
  const updateStripeVerificationStatus = async () => {
    if (!user?.stripeAccountId) {
      toast.error("No Stripe account ID found");
      return;
    }

    try {
      await updateStripeAccount({
        teacherId,
        stripeAccountId: user.stripeAccountId,
        stripeEmail: user.stripeEmail || user.email,
        stripeVerified: true,
        stripeOnboardingComplete: true
      }).unwrap();

      toast.success("Stripe verification status updated successfully");
      refetch();
    } catch (error) {
      console.error("Error updating Stripe verification status:", error);
      toast.error("Failed to update Stripe verification status");
    }
  };

  // Handle connecting Stripe account
  const handleConnectStripe = async () => {
    try {
      setIsConnecting(true);
      console.log("Connecting Stripe account for teacher:", teacherId);
      const response = await createStripeAccount(teacherId).unwrap();
      console.log("Stripe connect response:", response);

      // Check for data.url in the response structure
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        toast.success("Stripe Connect initiated. Please complete the onboarding process in the new tab.");
      } else if (response.status === 'pending' && response.url) {
        window.open(response.url, '_blank');
        toast.success("Stripe Connect initiated. Please complete the onboarding process in the new tab.");
      } else if (response.status === 'complete') {
        toast.success("Your Stripe account is already connected!");
        refetch();
      } else {
        console.error("Unexpected response format:", response);
        toast.error("Failed to connect Stripe account. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting Stripe account:", error);
      toast.error("Failed to connect Stripe account. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle creating an onboarding link for incomplete accounts
  const handleCreateOnboardingLink = async () => {
    try {
      setIsCreatingLink(true);

      // Create account link with enhanced success/failure handling
      const currentUrl = window.location.origin;
      const response = await createAccountLink({
        type: 'account_onboarding',
        refreshUrl: `${currentUrl}/teacher/stripe-connect-status?success=false&reason=refresh`,
        returnUrl: `${currentUrl}/teacher/stripe-connect-status?success=true`
      }).unwrap();

      // Check for data.url in the response structure
      if (response.data?.url) {
        window.location.href = response.data.url;
        toast.success("Redirecting to Stripe onboarding...");
      } else if (response.status === 'pending' && response.url) {
        window.location.href = response.url;
        toast.success("Redirecting to Stripe onboarding...");
      } else {
        console.error("Unexpected response format:", response);
        toast.error("Failed to create onboarding link. Please try again.");
      }
    } catch (error: any) {
      console.error("Error creating onboarding link:", error);

      // Enhanced error handling
      let errorMessage = 'Failed to create onboarding link. Please try again.';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Get user data to check if Stripe is verified
  const { data: userData } = useGetMeQuery(undefined);
  const user = userData?.data;

  // Check if the Stripe account is connected directly from the Stripe API response
  const stripeApiStatus = stripeStatus?.data?.status;
  const stripeApiComplete = stripeStatus?.data?.chargesEnabled && stripeStatus?.data?.payoutsEnabled;

  // Determine the banner state based on Stripe account status and user data
  const isStripeConnected =
    (stripeApiStatus === 'complete') ||
    (stripeApiComplete === true) ||
    (stripeStatus?.status === 'complete') ||
    (user?.stripeVerified === true) ||
    (user?.stripeOnboardingComplete === true);

  const isStripeIncomplete =
    !isStripeConnected && (
      (stripeApiStatus === 'incomplete') ||
      (stripeStatus?.status === 'incomplete') ||
      (user?.stripeAccountId && !user?.stripeVerified)
    );

  const pendingRequirements = stripeStatus?.data?.requirements || stripeStatus?.requirements || [];



  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full max-w-[280px] mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isStripeConnected) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <h3 className="font-medium text-green-800">Stripe Connected</h3>
                <p className="text-sm text-green-700">
                  Your Stripe account is connected and ready to receive payments.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast.info("Refreshing Stripe status...");
              }}
              className="text-xs"
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isStripeIncomplete) {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
            Stripe Account Incomplete
          </CardTitle>
          <CardDescription className="text-amber-700">
            Your Stripe account setup is incomplete. Please complete the following requirements:
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequirements.length > 0 ? (
            <ul className="list-disc pl-5 mb-4 text-amber-700">
              {pendingRequirements.map((req: string, index: number) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-amber-700">Additional information is required to activate your account.</p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleCreateOnboardingLink}
              disabled={isCreatingLink}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isCreatingLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating link...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Complete Stripe Setup
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast.info("Refreshing Stripe status...");
              }}
              className="text-xs"
            >
              Refresh Status
            </Button>

            {/* Button to manually update verification status */}
            {user?.stripeAccountId && stripeApiComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={updateStripeVerificationStatus}
                className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                Force Verify
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: Not connected
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">Connect Stripe to Receive Payments</CardTitle>
        <CardDescription className="text-blue-700">
          Connect your Stripe account to receive payments from your courses. You'll earn 70% of each course sale.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleConnectStripe}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Stripe Account
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.info("Refreshing Stripe status...");
            }}
            className="text-xs"
          >
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectBanner;
