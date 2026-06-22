import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  DollarSign,
  Shield,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Info,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import {
  useCheckStripeAccountStatusQuery,
  useCreateAccountLinkMutation,
  useGetTeacherEarningsQuery
} from '@/redux/features/payment/payment.api';
import StripeOnboardingWizard from '@/components/Stripe/StripeOnboardingWizard';
import StripeStatusTracker from '@/components/Stripe/StripeStatusTracker';
import { cn } from '@/lib/utils';

const StripeConnect: React.FC = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Stripe-related queries
  const {
    data: stripeStatus,
    isLoading: isStripeStatusLoading,
    refetch: refetchStripeStatus
  } = useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });

  const {
    data: teacherEarnings,
    isLoading: isEarningsLoading
  } = useGetTeacherEarningsQuery(teacherId, { skip: !teacherId });

  // Stripe mutations
  const [createAccountLink, { isLoading: isCreatingOnboardingLink }] = useCreateAccountLinkMutation();

  const handleStartOnboarding = async () => {
    if (!teacherId) return;

    try {
      // Create account link with enhanced success/failure handling
      const currentUrl = window.location.origin;
      const result = await createAccountLink({
        type: 'account_onboarding',
        refreshUrl: `${currentUrl}/teacher/stripe-connect-status?success=false&reason=refresh`,
        returnUrl: `${currentUrl}/teacher/stripe-connect-status?success=true`
      }).unwrap();

      if (result.data?.url) {
        // Use window.location.href for better success/failure handling
        window.location.href = result.data.url;
        setIsWizardOpen(false);
      } else {
        throw new Error('No onboarding URL received from Stripe');
      }
    } catch (error: any) {
      console.error('Failed to create onboarding link:', error);

      // Enhanced error handling
      let errorMessage = 'Failed to start onboarding process';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      // You can add toast notification here if needed
      alert(errorMessage);
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn 70% Revenue Share',
      description: 'Keep 70% of every course sale with automatic payouts to your bank account',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Globe,
      title: 'Global Payment Processing',
      description: 'Accept payments from students in 135+ countries with local payment methods',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with PCI DSS compliance and fraud protection',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Clock,
      title: 'Fast Payouts',
      description: 'Receive your earnings with flexible payout schedules and real-time tracking',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const features = [
    'Automatic payment splitting (70% teacher, 30% platform)',
    'Real-time earnings dashboard and analytics',
    'Comprehensive transaction history and reporting',
    'Multiple payout schedules (daily, weekly, monthly)',
    'Support for 135+ currencies and payment methods',
    'Advanced fraud protection and dispute management',
    'Tax reporting and invoice generation',
    'Mobile-optimized payment experience for students'
  ];

  const isConnected = stripeStatus?.data?.isConnected;
  const isVerified = stripeStatus?.data?.isVerified;
  const onboardingComplete = stripeStatus?.data?.onboardingComplete;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Stripe Connect</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your Stripe account to start receiving payments from students worldwide. 
            Secure, fast, and designed for educators.
          </p>
        </div>

        {/* Status Overview */}
        {isConnected ? (
          <StripeStatusTracker
            stripeStatus={stripeStatus?.data}
            isLoading={isStripeStatusLoading}
            onRefresh={refetchStripeStatus}
            onCompleteSetup={() => setIsWizardOpen(true)}
          />
        ) : (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    Ready to start earning?
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Connect your Stripe account in just a few minutes and start receiving payments from students.
                  </p>
                  <Button 
                    onClick={() => setIsWizardOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Earnings Preview */}
        {isConnected && teacherEarnings?.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Your Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${teacherEarnings.data.total?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-green-700">Total Earnings</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${teacherEarnings.data.monthly?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-blue-700">This Month</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${teacherEarnings.data.weekly?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-purple-700">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {benefits.map((benefit, index) => {
            const BenefitIcon = benefit.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", benefit.bgColor)}>
                      <BenefitIcon className={cn("w-6 h-6", benefit.color)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              What's Included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-blue-900">Your security is our priority</p>
              <p className="text-sm text-blue-800">
                We use Stripe Connect, the same payment infrastructure trusted by millions of businesses worldwide. 
                Your financial information is encrypted and never stored on our servers.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Setting up payments should be simple. If you encounter any issues or have questions, 
                our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                  <a href="/help/stripe-setup" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Setup Guide
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/support" target="_blank" rel="noopener noreferrer">
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Wizard */}
        <StripeOnboardingWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onStartOnboarding={handleStartOnboarding}
          isLoading={isCreatingOnboardingLink}
          stripeStatus={stripeStatus?.data}
        />
      </div>
    </div>
  );
};

export default StripeConnect;
