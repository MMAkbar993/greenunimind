import React from 'react';
import { cn } from '@/lib/utils';
import { StepperStep } from './stepper-step';

export interface Step {
  id: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className
}) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Horizontal Stepper with Progress Lines - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between w-full max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const stepStatus = 
            step.id < currentStep ? 'completed' : 
            step.id === currentStep ? 'current' : 
            'upcoming';

          const isLastStep = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Step Component */}
              <div className="flex flex-col items-center flex-shrink-0">
                <StepperStep
                  step={step}
                  status={stepStatus}
                  onClick={() => onStepClick?.(step.id)}
                  clickable={!!onStepClick && step.id <= currentStep}
                />
              </div>

              {/* Progress Line (except after the last step) */}
              {!isLastStep && (
                <div className="flex-1 px-4">
                  <div 
                    className={cn(
                      "h-0.5 w-full transition-all duration-500 ease-in-out",
                      stepStatus === 'completed' || (stepStatus === 'current' && index < steps.length - 1)
                        ? "bg-green-500" 
                        : "bg-gray-300"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Layout - Vertical on smaller screens */}
      <div className="md:hidden mt-8 space-y-6">
        {steps.map((step, index) => {
          const stepStatus = 
            step.id < currentStep ? 'completed' : 
            step.id === currentStep ? 'current' : 
            'upcoming';

          const isLastStep = index === steps.length - 1;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <StepperStep
                step={step}
                status={stepStatus}
                onClick={() => onStepClick?.(step.id)}
                clickable={!!onStepClick && step.id <= currentStep}
                isMobile={true}
              />
              
              {/* Vertical Line for Mobile */}
              {!isLastStep && (
                <div className="mt-4 mb-2">
                  <div 
                    className={cn(
                      "w-0.5 h-8 transition-all duration-500 ease-in-out",
                      stepStatus === 'completed' 
                        ? "bg-green-500" 
                        : "bg-gray-300"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
