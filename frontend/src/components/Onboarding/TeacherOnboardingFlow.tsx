import React, { useState } from 'react';
import {
  CheckCircle,
  ArrowRight,
  BookOpen,
  CreditCard,
  User,
  Lightbulb,
  Play,
  Camera,
  Award,
  Target,
  Rocket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  action?: {
    text: string;
    url: string;
    external?: boolean;
  };
  tips?: string[];
  estimatedTime?: string;
}

interface TeacherOnboardingFlowProps {
  className?: string;
  onStepComplete?: (stepId: string) => void;
  userProfile?: {
    hasCompletedProfile: boolean;
    hasStripeConnected: boolean;
    hasCreatedCourse: boolean;
    hasPublishedCourse: boolean;
  };
}

const TeacherOnboardingFlow: React.FC<TeacherOnboardingFlowProps> = ({
  className,
  onStepComplete,
  userProfile = {
    hasCompletedProfile: false,
    hasStripeConnected: false,
    hasCreatedCourse: false,
    hasPublishedCourse: false,
  }
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your photo, bio, and teaching credentials to build trust with students',
      icon: User,
      completed: userProfile.hasCompletedProfile,
      action: {
        text: 'Complete Profile',
        url: '/teacher/profile/edit'
      },
      tips: [
        'Add a professional photo',
        'Write a compelling bio',
        'List your qualifications'
      ],
      estimatedTime: '5 minutes'
    },
    {
      id: 'course',
      title: 'Create Your First Course',
      description: 'Design and structure your course with our easy-to-use course builder',
      icon: BookOpen,
      completed: userProfile.hasCreatedCourse,
      action: {
        text: 'Create Course',
        url: '/teacher/courses/create'
      },
      tips: [
        'Start with a clear learning objective',
        'Break content into digestible sections',
        'Add engaging video content'
      ],
      estimatedTime: '30 minutes'
    },
    {
      id: 'content',
      title: 'Add Course Content',
      description: 'Upload videos, create quizzes, and add supplementary materials',
      icon: Camera,
      completed: false, // This would be determined by checking if course has content
      action: {
        text: 'Add Content',
        url: '/teacher/courses'
      },
      tips: [
        'Record high-quality videos',
        'Add downloadable resources',
        'Create interactive quizzes'
      ],
      estimatedTime: '2-4 hours'
    },
    {
      id: 'stripe',
      title: 'Set Up Payments',
      description: 'Connect your Stripe account to start earning from course sales',
      icon: CreditCard,
      completed: userProfile.hasStripeConnected,
      action: {
        text: 'Connect Stripe',
        url: '/teacher/earnings'
      },
      tips: [
        'Secure payment processing',
        'Automatic 70/30 revenue split',
        'Weekly payout options'
      ],
      estimatedTime: '10 minutes'
    },
    {
      id: 'publish',
      title: 'Publish Your Course',
      description: 'Review your course and make it available to students worldwide',
      icon: Rocket,
      completed: userProfile.hasPublishedCourse,
      action: {
        text: 'Publish Course',
        url: '/teacher/courses'
      },
      tips: [
        'Preview your course',
        'Set competitive pricing',
        'Write compelling course description'
      ],
      estimatedTime: '15 minutes'
    }
  ];

  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / onboardingSteps.length) * 100;

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleStepAction = (step: OnboardingStep) => {
    if (onStepComplete) {
      onStepComplete(step.id);
    }
  };

  return (
    <Card className={cn("teacher-onboarding-flow", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="w-6 h-6 text-blue-600" />
              Getting Started Checklist
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Complete these steps to set up your teaching profile and start earning
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {completedSteps}/{onboardingSteps.length} Complete
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {onboardingSteps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === index;
          const isCompleted = step.completed;
          
          return (
            <div
              key={step.id}
              className={cn(
                "border rounded-lg p-4 transition-all duration-200 cursor-pointer",
                isCompleted && "bg-green-50 border-green-200",
                isActive && !isCompleted && "ring-2 ring-blue-500 ring-opacity-50 border-blue-200",
                !isCompleted && !isActive && "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleStepClick(index)}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  isCompleted ? "bg-green-100" : "bg-blue-100"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <StepIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    {step.estimatedTime && (
                      <Badge variant="outline" className="text-xs">
                        {step.estimatedTime}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                  {isActive && step.tips && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Tips:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-center gap-2">
                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.action && !isCompleted && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleStepAction(step)}
                    >
                      <Link to={step.action.url} className="flex items-center gap-2">
                        {step.action.text}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Success Message */}
        {completedSteps === onboardingSteps.length && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Congratulations! 🎉
            </h3>
            <p className="text-gray-600 mb-4">
              You've completed the onboarding process. You're now ready to start teaching and earning!
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/teacher/dashboard" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherOnboardingFlow;
