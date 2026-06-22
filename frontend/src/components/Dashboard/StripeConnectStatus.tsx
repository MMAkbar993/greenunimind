import React from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface StripeConnectStatusProps {
  stripeStatus?: {
    isConnected: boolean;
    isVerified: boolean;
    onboardingComplete: boolean;
    requirements?: string[];
    accountId?: string;
  };
  isLoading?: boolean;
  onConnectStripe: () => void;
  onCompleteOnboarding: () => void;
  isConnecting?: boolean;
  className?: string;
}

const StripeConnectStatus: React.FC<StripeConnectStatusProps> = ({
  stripeStatus,
  isLoading = false,
  onConnectStripe,
  onCompleteOnboarding,
  isConnecting = false,
  className
}) => {
  const getStatusInfo = () => {
    if (!stripeStatus?.isConnected) {
      return {
        status: 'not_connected',
        title: 'Connect Stripe Account',
        description: 'Connect your Stripe account to start receiving payments from students',
        icon: CreditCard,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        badgeVariant: 'secondary' as const,
        badgeText: 'Not Connected'
      };
    }

    if (!stripeStatus.onboardingComplete) {
      return {
        status: 'onboarding_required',
        title: 'Complete Stripe Setup',
        description: 'Complete your Stripe account setup to start receiving payments',
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badgeVariant: 'secondary' as const,
        badgeText: 'Setup Required'
      };
    }

    if (!stripeStatus.isVerified) {
      return {
        status: 'verification_pending',
        title: 'Verification Pending',
        description: 'Your Stripe account is under review. This usually takes 1-2 business days',
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badgeVariant: 'secondary' as const,
        badgeText: 'Pending Verification'
      };
    }

    return {
      status: 'verified',
      title: 'Stripe Account Connected',
      description: 'Your Stripe account is verified and ready to receive payments',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      badgeVariant: 'default' as const,
      badgeText: 'Verified'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleAction = () => {
    if (!stripeStatus?.isConnected) {
      onConnectStripe();
    } else if (!stripeStatus.onboardingComplete) {
      onCompleteOnboarding();
    }
  };

  const getActionButton = () => {
    if (statusInfo.status === 'verified') {
      return null;
    }

    const buttonText = statusInfo.status === 'not_connected' 
      ? 'Connect Stripe Account' 
      : 'Complete Setup';

    return (
      <Button
        onClick={handleAction}
        disabled={isConnecting || isLoading}
        className="w-full sm:w-auto"
        variant={statusInfo.status === 'not_connected' ? 'default' : 'outline'}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <Card className={cn("stripe-connect-status", className)}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
            </div>
            <div className="w-24 h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "stripe-connect-status transition-all duration-200 hover:shadow-md",
      statusInfo.borderColor,
      className
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              statusInfo.bgColor
            )}>
              <StatusIcon className={cn("w-6 h-6", statusInfo.color)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  {statusInfo.title}
                </h3>
                <Badge variant={statusInfo.badgeVariant} className="text-xs">
                  {statusInfo.badgeText}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {statusInfo.description}
              </p>

              {/* Requirements Alert */}
              {stripeStatus?.requirements && stripeStatus.requirements.length > 0 && (
                <Alert className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Action Required:</strong> {stripeStatus.requirements.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Security Notice for Verified Accounts */}
              {statusInfo.status === 'verified' && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Shield className="w-3 h-3" />
                  <span>Secure payments enabled</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {getActionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectStatus;
