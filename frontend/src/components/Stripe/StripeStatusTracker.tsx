import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Shield,
  CreditCard,
  Building,
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StripeStatusTrackerProps {
  stripeStatus?: {
    isConnected: boolean;
    isVerified: boolean;
    onboardingComplete: boolean;
    requirements?: string[];
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
    verificationStage?: string;
    estimatedCompletionTime?: string;
    canReceivePayments?: boolean;
  };
  isLoading?: boolean;
  onRefresh: () => void;
  onCompleteSetup: () => void;
  className?: string;
  hideDocumentSubmission?: boolean; // New prop to hide confusing UI elements
}

const StripeStatusTracker: React.FC<StripeStatusTrackerProps> = ({
  stripeStatus,
  isLoading = false,
  onRefresh,
  onCompleteSetup,
  className,
  hideDocumentSubmission = true // Default to hiding confusing elements
}) => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdated(new Date());
  }, [stripeStatus]);

  const getOverallProgress = () => {
    // Use verification stage for more accurate progress if available
    if (stripeStatus?.verificationStage) {
      switch (stripeStatus.verificationStage) {
        case 'not_started': return 0;
        case 'account_created': return 25;
        case 'onboarding_started': return 50;
        case 'processing_capabilities': return 75;
        case 'under_review': return 85;
        case 'completed': return 100;
        default: return 0;
      }
    }

    // Fallback to legacy calculation
    let progress = 0;
    if (stripeStatus?.isConnected) progress += hideDocumentSubmission ? 33 : 25;
    if (!hideDocumentSubmission && stripeStatus?.detailsSubmitted) progress += 25;
    if (stripeStatus?.isVerified) progress += hideDocumentSubmission ? 33 : 25;
    if (stripeStatus?.canReceivePayments) progress += hideDocumentSubmission ? 34 : 25;
    return Math.min(progress, 100);
  };

  const getOverallStatus = () => {
    if (!stripeStatus?.isConnected) {
      return {
        status: 'not_started',
        title: 'Not Connected',
        description: 'Connect your Stripe account to start receiving payments',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }

    if (stripeStatus.requirements && stripeStatus.requirements.length > 0) {
      return {
        status: 'action_required',
        title: 'Action Required',
        description: 'Complete the required information to activate your account',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }

    if (!stripeStatus.onboardingComplete) {
      return {
        status: 'in_progress',
        title: 'Setup In Progress',
        description: 'Your account setup is being processed',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }

    if (!stripeStatus.isVerified) {
      return {
        status: 'pending_verification',
        title: 'Pending Verification',
        description: 'Your account is under review by Stripe',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }

    return {
      status: 'active',
      title: 'Active & Verified',
      description: 'Your account is ready to receive payments',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const statusInfo = getOverallStatus();

  // Get verification stage info for better user experience
  const getVerificationStageInfo = () => {
    const stage = stripeStatus?.verificationStage || '';
    switch (stage) {
      case 'account_created':
        return { title: 'Account Created', description: 'Stripe account successfully created' };
      case 'onboarding_started':
        return { title: 'Processing Information', description: 'Automatically processing your account details' };
      case 'processing_capabilities':
        return { title: 'Enabling Features', description: 'Setting up payment processing capabilities' };
      case 'under_review':
        return { title: 'Under Review', description: 'Stripe is reviewing your account' };
      case 'completed':
        return { title: 'Verification Complete', description: 'Account verified and ready for payments' };
      default:
        return { title: 'Processing', description: 'Automatic verification in progress' };
    }
  };

  const statusChecks = [
    {
      id: 'connected',
      title: 'Account Connected',
      description: 'Stripe account linked to your profile',
      icon: CreditCard,
      status: stripeStatus?.isConnected ? 'complete' : 'pending',
      required: true
    },
    // Replace confusing "Details Submitted" with automatic verification when hideDocumentSubmission is true
    ...(hideDocumentSubmission ? [] : [{
      id: 'details',
      title: 'Details Submitted',
      description: 'Business and personal information provided',
      icon: FileText,
      status: stripeStatus?.detailsSubmitted ? 'complete' : stripeStatus?.isConnected ? 'pending' : 'disabled',
      required: true
    }]),
    {
      id: 'verification',
      title: stripeStatus?.verificationStage ? getVerificationStageInfo().title : 'Automatic Verification',
      description: stripeStatus?.verificationStage ? getVerificationStageInfo().description : 'Our system is automatically verifying your account',
      icon: Shield,
      status: stripeStatus?.isVerified ? 'complete' : stripeStatus?.isConnected ? 'pending' : 'disabled',
      required: true
    },
    {
      id: 'capabilities',
      title: 'Payment Ready',
      description: 'Ready to receive payments from students',
      icon: Building,
      status: stripeStatus?.canReceivePayments ? 'complete' : 'pending',
      required: true
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'disabled':
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'disabled':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className={cn("stripe-status-tracker", statusInfo.borderColor, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Stripe Account Status
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={statusInfo.status === 'active' ? 'default' : 'secondary'}
                className={cn("text-xs", statusInfo.color)}
              >
                {statusInfo.title}
              </Badge>
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Setup Progress</span>
            <span className="text-gray-600">{getOverallProgress()}% Complete</span>
          </div>
          <Progress value={getOverallProgress()} className="h-2" />
          <p className="text-sm text-gray-600">{statusInfo.description}</p>
        </div>

        {/* Status Checks */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Setup Requirements</h4>
          {statusChecks.map((check) => {
            const CheckIcon = check.icon;
            return (
              <div
                key={check.id}
                className={cn(
                  "flex items-center gap-4 p-3 border rounded-lg transition-colors",
                  getStatusColor(check.status)
                )}
              >
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    check.status === 'complete' ? 'bg-green-100' :
                    check.status === 'pending' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  )}>
                    <CheckIcon className={cn(
                      "w-5 h-5",
                      check.status === 'complete' ? 'text-green-600' :
                      check.status === 'pending' ? 'text-yellow-600' :
                      'text-gray-400'
                    )} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900">{check.title}</h5>
                    {check.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{check.description}</p>
                </div>
                
                <div className="flex-shrink-0">
                  {getStatusIcon(check.status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Automatic Verification Info */}
        {stripeStatus?.isConnected && !stripeStatus?.isVerified && (
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-blue-800">Automatic Verification in Progress</p>
                <p className="text-sm text-blue-700">
                  Our system is automatically processing your account verification with Stripe.
                  This typically completes within 1-2 minutes. No additional action is required from you.
                </p>
                {stripeStatus?.estimatedCompletionTime && (
                  <p className="text-sm text-blue-600">
                    Estimated completion: {new Date(stripeStatus.estimatedCompletionTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Requirements Alert - Only show if not using automatic verification */}
        {!hideDocumentSubmission && stripeStatus?.requirements && stripeStatus.requirements.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-yellow-800">Action Required</p>
                <p className="text-sm text-yellow-700">
                  Complete the following requirements to activate your account:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                  {stripeStatus.requirements.map((requirement, index) => (
                    <li key={index} className="list-disc">{requirement}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          {statusInfo.status === 'not_started' && (
            <Button onClick={onCompleteSetup} className="flex-1">
              <CreditCard className="w-4 h-4 mr-2" />
              Connect Stripe Account
            </Button>
          )}

          {(statusInfo.status === 'action_required' || statusInfo.status === 'in_progress') && !stripeStatus?.isVerified && (
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Automatic verification in progress...</span>
              </div>
              <p className="text-xs text-gray-500">
                No action required. Your account will be ready within 1-2 minutes.
              </p>
            </div>
          )}

          {statusInfo.status === 'active' && (
            <div className="flex items-center gap-2 text-sm text-green-600 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>Your account is verified and ready to receive payments!</span>
            </div>
          )}

          {/* Fallback button for manual completion if needed */}
          {!hideDocumentSubmission && (statusInfo.status === 'action_required' || statusInfo.status === 'in_progress') && (
            <Button onClick={onCompleteSetup} variant="outline" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Complete Setup Manually
            </Button>
          )}
        </div>

        {/* Account Info */}
        {stripeStatus?.accountId && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Account ID: {stripeStatus.accountId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeStatusTracker;
