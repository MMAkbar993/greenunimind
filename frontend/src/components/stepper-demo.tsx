import React, { useState } from 'react';
import { BookOpen, Upload, Settings, Eye, User, CreditCard, Package, Truck } from 'lucide-react';
import { ModernStepper, StepperStep } from '@/components/ui/modern-stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Course Creation Steps
const courseSteps: StepperStep[] = [
  {
    id: 'basics',
    title: 'Course Basics',
    subtitle: 'Essential information',
    icon: BookOpen
  },
  {
    id: 'content',
    title: 'Course Content',
    subtitle: 'Media and objectives',
    icon: Upload
  },
  {
    id: 'settings',
    title: 'Pricing & Settings',
    subtitle: 'Price and features',
    icon: Settings
  },
  {
    id: 'review',
    title: 'Review & Publish',
    subtitle: 'Final review',
    icon: Eye
  }
];

// E-commerce Checkout Steps
const checkoutSteps: StepperStep[] = [
  {
    id: 'account',
    title: 'Account',
    subtitle: 'Login or register',
    icon: User
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'Payment details',
    icon: CreditCard
  },
  {
    id: 'review',
    title: 'Review',
    subtitle: 'Order summary',
    icon: Package
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    subtitle: 'Order complete',
    icon: Truck
  }
];

// Simple numbered steps
const onboardingSteps: StepperStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    subtitle: 'Get started'
  },
  {
    id: 'profile',
    title: 'Profile Setup',
    subtitle: 'Basic information'
  },
  {
    id: 'preferences',
    title: 'Preferences',
    subtitle: 'Customize experience'
  },
  {
    id: 'complete',
    title: 'Complete',
    subtitle: 'You\'re all set!'
  }
];

export const StepperDemo: React.FC = () => {
  const [courseStep, setCourseStep] = useState(0);
  const [courseCompleted, setCourseCompleted] = useState<number[]>([]);
  
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutCompleted, setCheckoutCompleted] = useState<number[]>([0]);
  
  const [onboardingStep, setOnboardingStep] = useState(2);
  const [onboardingCompleted, setOnboardingCompleted] = useState<number[]>([0, 1]);

  const handleCourseNext = () => {
    if (courseStep < courseSteps.length - 1) {
      setCourseCompleted(prev => [...prev, courseStep]);
      setCourseStep(prev => prev + 1);
    }
  };

  const handleCheckoutNext = () => {
    if (checkoutStep < checkoutSteps.length - 1) {
      setCheckoutCompleted(prev => [...prev, checkoutStep]);
      setCheckoutStep(prev => prev + 1);
    }
  };

  const handleOnboardingNext = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingCompleted(prev => [...prev, onboardingStep]);
      setOnboardingStep(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Modern Stepper Components
          </h1>
          <p className="text-gray-600 text-lg">
            Professional, responsive stepper UI components for modern applications
          </p>
        </div>

        {/* Course Creation Stepper */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Course Creation Flow
            </CardTitle>
            <CardDescription>
              Professional course creation stepper with icons and smooth animations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModernStepper
              steps={courseSteps}
              currentStep={courseStep}
              completedSteps={courseCompleted}
              onStepClick={(index) => {
                if (index <= courseStep || courseCompleted.includes(index)) {
                  setCourseStep(index);
                }
              }}
              className="mb-6"
            />
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCourseStep(Math.max(0, courseStep - 1))}
                disabled={courseStep === 0}
              >
                Previous
              </Button>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Current: {courseSteps[courseStep].title}
                </p>
              </div>
              <Button
                onClick={handleCourseNext}
                disabled={courseStep === courseSteps.length - 1}
                className="bg-green-600 hover:bg-green-700"
              >
                Next Step
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* E-commerce Checkout Stepper */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              E-commerce Checkout
            </CardTitle>
            <CardDescription>
              Checkout flow with payment and shipping steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModernStepper
              steps={checkoutSteps}
              currentStep={checkoutStep}
              completedSteps={checkoutCompleted}
              onStepClick={(index) => {
                if (index <= checkoutStep || checkoutCompleted.includes(index)) {
                  setCheckoutStep(index);
                }
              }}
              className="mb-6"
            />
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCheckoutStep(Math.max(0, checkoutStep - 1))}
                disabled={checkoutStep === 0}
              >
                Back
              </Button>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Step: {checkoutSteps[checkoutStep].title}
                </p>
              </div>
              <Button
                onClick={handleCheckoutNext}
                disabled={checkoutStep === checkoutSteps.length - 1}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simple Numbered Stepper */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              User Onboarding
            </CardTitle>
            <CardDescription>
              Simple numbered stepper for onboarding flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModernStepper
              steps={onboardingSteps}
              currentStep={onboardingStep}
              completedSteps={onboardingCompleted}
              onStepClick={(index) => {
                if (index <= onboardingStep || onboardingCompleted.includes(index)) {
                  setOnboardingStep(index);
                }
              }}
              className="mb-6"
            />
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setOnboardingStep(Math.max(0, onboardingStep - 1))}
                disabled={onboardingStep === 0}
              >
                Previous
              </Button>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {onboardingSteps[onboardingStep].title} - {onboardingSteps[onboardingStep].subtitle}
                </p>
              </div>
              <Button
                onClick={handleOnboardingNext}
                disabled={onboardingStep === onboardingSteps.length - 1}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StepperDemo;
