import React, { useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  CreditCard,
  Shield,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  FileText,
  Clock,
  Globe,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StripeOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnboarding: () => void;
  isLoading?: boolean;
  stripeStatus?: {
    isConnected: boolean;
    isVerified: boolean;
    onboardingComplete: boolean;
    requirements?: string[];
    accountId?: string;
  };
}

const StripeOnboardingWizard: React.FC<StripeOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onStartOnboarding,
  isLoading = false,
  stripeStatus
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Reset wizard when modal opens
  useEffect(() => {
    if (isOpen && !stripeStatus?.isConnected) {
      setCurrentStep(0);
      setHasStarted(false);
    } else if (isOpen && stripeStatus?.isConnected) {
      setCurrentStep(1);
      setHasStarted(true);
    }
  }, [isOpen, stripeStatus?.isConnected]);

  const wizardSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Stripe Connect',
      subtitle: 'Start earning from your courses',
      icon: Zap,
      content: {
        heading: 'Ready to monetize your expertise?',
        description: 'Connect your Stripe account to start receiving payments from students worldwide.',
        benefits: [
          { icon: DollarSign, text: 'Earn 70% of every course sale' },
          { icon: Globe, text: 'Accept payments from 135+ countries' },
          { icon: Shield, text: 'Bank-level security and compliance' },
          { icon: Clock, text: 'Fast payouts to your bank account' }
        ]
      }
    },
    {
      id: 'account-setup',
      title: 'Account Setup',
      subtitle: 'Create your Stripe Express account',
      icon: User,
      content: {
        heading: 'Set up your payment account',
        description: 'We\'ll redirect you to Stripe to create your Express account. This process is secure and takes about 5-10 minutes.',
        steps: [
          'Provide basic business information',
          'Verify your identity with government ID',
          'Add your bank account details',
          'Review and accept Stripe\'s terms'
        ]
      }
    },
    {
      id: 'verification',
      title: 'Account Verification',
      subtitle: 'Complete identity verification',
      icon: Shield,
      content: {
        heading: 'Verify your account',
        description: 'Stripe will review your information to ensure compliance with financial regulations.',
        timeline: [
          { step: 'Submit documents', time: 'Immediate', status: 'complete' },
          { step: 'Identity verification', time: '1-2 hours', status: 'pending' },
          { step: 'Bank verification', time: '1-2 business days', status: 'pending' },
          { step: 'Account approval', time: '2-7 business days', status: 'pending' }
        ]
      }
    },
    {
      id: 'completion',
      title: 'You\'re All Set!',
      subtitle: 'Start receiving payments',
      icon: CheckCircle,
      content: {
        heading: 'Congratulations! 🎉',
        description: 'Your Stripe account is connected and verified. You can now start receiving payments from students.',
        features: [
          'Automatic payment processing',
          'Real-time earnings dashboard',
          'Flexible payout schedules',
          'Comprehensive transaction history'
        ]
      }
    }
  ];

  const currentStepData = wizardSteps[currentStep];
  const StepIcon = currentStepData.icon;

  const getStepStatus = (stepIndex: number) => {
    if (!stripeStatus?.isConnected && stepIndex > 0) return 'disabled';
    if (!stripeStatus?.isVerified && stepIndex > 1) return 'disabled';
    if (!stripeStatus?.onboardingComplete && stepIndex > 2) return 'disabled';
    
    if (stepIndex === 0 && stripeStatus?.isConnected) return 'complete';
    if (stepIndex === 1 && stripeStatus?.isVerified) return 'complete';
    if (stepIndex === 2 && stripeStatus?.onboardingComplete) return 'complete';
    if (stepIndex === 3 && stripeStatus?.onboardingComplete) return 'complete';
    
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'complete';
    
    return 'pending';
  };

  const canProceed = () => {
    if (currentStep === 0) return true;
    if (currentStep === 1) return stripeStatus?.isConnected;
    if (currentStep === 2) return stripeStatus?.isVerified;
    if (currentStep === 3) return stripeStatus?.onboardingComplete;
    return false;
  };

  const handleNext = () => {
    if (currentStep === 0 && !stripeStatus?.isConnected) {
      setHasStarted(true);
      onStartOnboarding();
      return;
    }
    
    if (currentStep < wizardSteps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const content = currentStepData.content;

    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {content.heading}
              </h3>
              <p className="text-gray-600 mb-6">{content.description}</p>
            </div>
            
            <div className="grid gap-4">
              {content.benefits?.map((benefit, index) => {
                const BenefitIcon = benefit.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <BenefitIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-800">{benefit.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'account-setup':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {content.heading}
              </h3>
              <p className="text-gray-600 mb-6">{content.description}</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">What you'll need to provide:</h4>
              {content.steps?.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
              ))}
            </div>

            {stripeStatus?.requirements && stripeStatus.requirements.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">Outstanding Requirements</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {stripeStatus.requirements.map((requirement, index) => (
                        <li key={index}>• {requirement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {content.heading}
              </h3>
              <p className="text-gray-600 mb-6">{content.description}</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Verification Timeline:</h4>
              {content.timeline?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    item.status === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    {item.status === 'complete' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.step}</div>
                    <div className="text-sm text-gray-500">{item.time}</div>
                  </div>
                  <Badge variant={item.status === 'complete' ? 'default' : 'secondary'}>
                    {item.status === 'complete' ? 'Complete' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {content.heading}
              </h3>
              <p className="text-gray-600 mb-6">{content.description}</p>
            </div>
            
            <div className="grid gap-3">
              {content.features?.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <StepIcon className="w-6 h-6 text-blue-600" />
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription>
            {currentStepData.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {wizardSteps.map((step, index) => {
              const status = getStepStatus(index);
              const StepIconComponent = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    status === 'complete' ? 'bg-green-100 border-green-500' :
                    status === 'current' ? 'bg-blue-100 border-blue-500' :
                    status === 'pending' ? 'bg-gray-100 border-gray-300' :
                    'bg-gray-50 border-gray-200'
                  )}>
                    {status === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <StepIconComponent className={cn(
                        "w-5 h-5",
                        status === 'current' ? 'text-blue-600' :
                        status === 'pending' ? 'text-gray-400' :
                        'text-gray-300'
                      )} />
                    )}
                  </div>
                  
                  {index < wizardSteps.length - 1 && (
                    <div className={cn(
                      "w-16 h-0.5 mx-2",
                      getStepStatus(index + 1) !== 'disabled' ? 'bg-green-200' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onClose : handlePrevious}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>
            
            <div className="flex gap-2">
              {currentStep === wizardSteps.length - 1 ? (
                <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                  Get Started
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isLoading || (currentStep > 0 && !canProceed())}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      {currentStep === 0 ? 'Start Setup' : 'Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripeOnboardingWizard;
