import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface StepperStep {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ModernStepperProps {
  steps: StepperStep[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const ModernStepper: React.FC<ModernStepperProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  className
}) => {
  const isStepCompleted = (index: number) => completedSteps.includes(index);
  const isStepCurrent = (index: number) => index === currentStep;
  const isStepClickable = (index: number) => 
    index <= currentStep || isStepCompleted(index) || onStepClick;

  return (
    <Card className={cn("p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg", className)}>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => {
            const completed = isStepCompleted(index);
            const current = isStepCurrent(index);
            const clickable = isStepClickable(index);
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center relative flex-1">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-6 left-1/2 w-full h-0.5 z-0">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500 ease-in-out",
                        (completed || (current && index < currentStep))
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gray-200"
                      )}
                      style={{ 
                        marginLeft: '24px', 
                        width: 'calc(100% - 48px)' 
                      }}
                    />
                  </div>
                )}

                {/* Step Indicator */}
                <button
                  onClick={() => clickable && onStepClick?.(index)}
                  disabled={!clickable}
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 z-10 group",
                    "focus:outline-none focus:ring-4 focus:ring-green-100",
                    completed
                      ? "bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600 hover:scale-105"
                      : current
                        ? "bg-green-500 text-white shadow-lg shadow-green-200 animate-pulse"
                        : clickable
                          ? "bg-white border-2 border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500 hover:scale-105 shadow-md"
                          : "bg-gray-100 border-2 border-gray-200 text-gray-300 cursor-not-allowed"
                  )}
                  aria-current={current ? "step" : undefined}
                  role="button"
                  tabIndex={clickable ? 0 : -1}
                >
                  {completed ? (
                    <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                  ) : StepIcon ? (
                    <StepIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                  
                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-20 group-active:bg-green-400 transition-opacity duration-150" />
                </button>

                {/* Step Content */}
                <div className="mt-3 text-center max-w-[120px]">
                  <h3 className={cn(
                    "text-sm font-semibold transition-all duration-300 leading-tight",
                    (current || completed)
                      ? "text-green-700"
                      : "text-gray-500"
                  )}>
                    {step.title}
                  </h3>
                  {step.subtitle && (
                    <p className={cn(
                      "text-xs mt-1 transition-all duration-300 leading-tight",
                      (current || completed)
                        ? "text-green-600"
                        : "text-gray-400"
                    )}>
                      {step.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const completed = isStepCompleted(index);
          const current = isStepCurrent(index);
          const clickable = isStepClickable(index);
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-start space-x-4 relative">
              {/* Vertical Connecting Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 z-0">
                  <div className={cn(
                    "w-full h-full transition-all duration-500 ease-in-out",
                    (completed || (current && index < currentStep))
                      ? "bg-gradient-to-b from-green-500 to-green-600"
                      : "bg-gray-200"
                  )} />
                </div>
              )}

              {/* Step Indicator */}
              <button
                onClick={() => clickable && onStepClick?.(index)}
                disabled={!clickable}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 flex-shrink-0 z-10",
                  "focus:outline-none focus:ring-4 focus:ring-green-100",
                  completed
                    ? "bg-green-500 text-white shadow-lg shadow-green-200"
                    : current
                      ? "bg-green-500 text-white shadow-lg shadow-green-200 animate-pulse"
                      : clickable
                        ? "bg-white border-2 border-gray-300 text-gray-400 hover:border-green-400"
                        : "bg-gray-100 border-2 border-gray-200 text-gray-300 cursor-not-allowed"
                )}
                aria-current={current ? "step" : undefined}
              >
                {completed ? (
                  <Check className="w-5 h-5" />
                ) : StepIcon ? (
                  <StepIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </button>

              {/* Step Content */}
              <div className="flex-1 pt-2">
                <h3 className={cn(
                  "text-sm font-semibold mb-1",
                  (current || completed)
                    ? "text-green-700"
                    : "text-gray-500"
                )}>
                  {step.title}
                </h3>
                {step.subtitle && (
                  <p className={cn(
                    "text-xs leading-tight",
                    (current || completed)
                      ? "text-green-600"
                      : "text-gray-400"
                  )}>
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ModernStepper;
