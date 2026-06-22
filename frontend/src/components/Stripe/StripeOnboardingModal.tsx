import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Shield,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StripeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnboarding: () => void;
  isLoading?: boolean;
  stripeStatus?: {
    isConnected: boolean;
    isVerified: boolean;
    onboardingComplete: boolean;
    requirements?: string[];
  };
}

const StripeOnboardingModal: React.FC<StripeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartOnboarding,
  isLoading = false,
  stripeStatus
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      title: "Connect Your Stripe Account",
      description: "Link your Stripe account to start receiving payments from students",
      icon: CreditCard,
      status: stripeStatus?.isConnected ? 'completed' : 'pending',
      details: [
        "Secure connection to Stripe",
        "Industry-standard encryption",
        "No sensitive data stored on our servers"
      ]
    },
    {
      title: "Complete Account Verification",
      description: "Verify your identity and business information",
      icon: Shield,
      status: stripeStatus?.isVerified ? 'completed' : stripeStatus?.isConnected ? 'pending' : 'disabled',
      details: [
        "Identity verification",
        "Bank account verification",
        "Tax information (if required)"
      ]
    },
    {
      title: "Start Receiving Payments",
      description: "Begin earning from your courses with automatic payouts",
      icon: DollarSign,
      status: stripeStatus?.onboardingComplete ? 'completed' : 'disabled',
      details: [
        "Automatic 70/30 revenue split",
        "Weekly or monthly payouts",
        "Real-time earnings tracking"
      ]
    }
  ];

  const getStepProgress = () => {
    let completed = 0;
    if (stripeStatus?.isConnected) completed++;
    if (stripeStatus?.isVerified) completed++;
    if (stripeStatus?.onboardingComplete) completed++;
    return (completed / onboardingSteps.length) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'disabled':
        return 'text-gray-400 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const canStartOnboarding = !stripeStatus?.isConnected;
  const needsCompletion = stripeStatus?.isConnected && !stripeStatus?.onboardingComplete;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Stripe Payment Setup
          </DialogTitle>
          <DialogDescription>
            Set up your Stripe account to start receiving payments from students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Setup Progress</span>
              <span className="font-medium">{Math.round(getStepProgress())}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>

          {/* Benefits Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Why Connect Stripe?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Receive 70% of course sales automatically</li>
                  <li>• Secure, PCI-compliant payment processing</li>
                  <li>• Real-time earnings and payout tracking</li>
                  <li>• Support for global payment methods</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Onboarding Steps */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Setup Steps</h4>
            {onboardingSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-4 transition-all duration-200",
                    getStatusColor(step.status),
                    currentStep === index && "ring-2 ring-blue-500 ring-opacity-50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        step.status === 'completed' ? 'bg-green-100' : 
                        step.status === 'pending' ? 'bg-blue-100' : 'bg-gray-100'
                      )}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <StepIcon className={cn(
                            "w-5 h-5",
                            step.status === 'pending' ? 'text-blue-600' : 'text-gray-400'
                          )} />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-900">{step.title}</h5>
                        <Badge variant={
                          step.status === 'completed' ? 'default' : 
                          step.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {step.status === 'completed' ? 'Complete' : 
                           step.status === 'pending' ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                      
                      <ul className="text-xs text-gray-500 space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {step.status === 'completed' && (
                      <div className="flex-shrink-0">
                        {getStatusIcon(step.status)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Requirements Alert */}
          {stripeStatus?.requirements && stripeStatus.requirements.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Action Required</h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    Please complete the following requirements:
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {stripeStatus.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-yellow-600 rounded-full" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            
            {(canStartOnboarding || needsCompletion) && (
              <Button
                onClick={onStartOnboarding}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {canStartOnboarding ? 'Start Setup' : 'Complete Setup'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripeOnboardingModal;
