import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

const StepIndicator = ({
  steps,
  currentStep,
  completedSteps,
  className,
  onStepClick,
}: StepIndicatorProps) => {

  return (
    <div className={cn("w-full", className)}>

      {/* Mobile view - Horizontal scrollable steps */}
      <div className="md:hidden overflow-x-auto pb-4 hide-scrollbar">
        <div className="relative flex items-center justify-between min-w-max py-2 mx-auto w-full max-w-[320px]">
          {/* Connecting lines between steps - positioned in the middle of circles */}
          <div
            className="absolute top-1/2 left-6 right-6 h-0.5 bg-gray-200 z-0 transform -translate-y-1/2"
          />

          {/* Progress line - with animation */}
          <motion.div
            className="absolute top-1/2 left-6 h-1 bg-gradient-to-r from-blue-500 to-green-500 z-0 rounded-full transform -translate-y-1/2"
            initial={{ width: "0%" }}
            animate={{
              width: currentStep === 0
                ? "0%"
                : currentStep >= steps.length - 1
                  ? "calc(100% - 12px)" // Stop at the last step, not beyond
                  : `calc(${((currentStep) / (steps.length - 1)) * 100}% - ${currentStep * 4}px)`
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {steps.map((step, index) => (
            <TooltipProvider key={step.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex flex-col items-center space-y-2 relative z-10 px-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => onStepClick?.(index)}
                      disabled={!onStepClick}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 focus:outline-none",
                        onStepClick ? "cursor-pointer" : "cursor-default",
                        currentStep === index
                          ? "border-blue-600 bg-white text-blue-600 ring-2 ring-blue-100"
                          : completedSteps.includes(index) || index < currentStep
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white text-gray-500"
                      )}
                      whileHover={onStepClick ? { scale: 1.05 } : {}}
                      whileTap={onStepClick ? { scale: 0.95 } : {}}
                      aria-current={currentStep === index ? "step" : undefined}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`step-${index}-${completedSteps.includes(index) ? "completed" : currentStep === index ? "current" : "pending"}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center"
                        >
                          {completedSteps.includes(index) || index < currentStep ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-semibold">{index + 1}</span>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.button>
                    <span
                      className={cn(
                        "text-xs font-medium text-center whitespace-nowrap px-1 max-w-[80px] truncate",
                        currentStep === index
                          ? "text-blue-600"
                          : completedSteps.includes(index) || index < currentStep
                          ? "text-green-600"
                          : "text-gray-500"
                      )}
                    >
                      {step.title}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs p-3 bg-white shadow-lg border border-gray-100 rounded-lg"
                  sideOffset={8}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{step.title}</p>
                    {step.description && <p className="text-xs text-gray-500">{step.description}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Tablet view */}
      <div className="hidden md:block lg:hidden">
        <div className="relative flex items-center justify-between px-6 py-3">
          {/* Background connecting line */}
          <div
            className="absolute top-1/2 left-[40px] right-[40px] h-1 bg-gray-200 z-0 transform -translate-y-1/2"
          />

          {/* Progress connecting line */}
          <motion.div
            className="absolute top-1/2 left-[40px] h-1 bg-gradient-to-r from-blue-500 to-green-500 z-0 rounded-full transform -translate-y-1/2"
            initial={{ width: "0%" }}
            animate={{
              width: currentStep === 0
                ? "0%"
                : currentStep >= steps.length - 1
                  ? "calc(100% - 80px)" // Stop at the last step
                  : `calc(${((currentStep) / (steps.length - 1)) * 100}% - ${currentStep * 8}px)`
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Steps */}
          {steps.map((step, index) => (
            <TooltipProvider key={step.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="relative z-10 flex flex-col items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => onStepClick?.(index)}
                      disabled={!onStepClick}
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full border-2 focus:outline-none",
                        onStepClick ? "cursor-pointer" : "cursor-default",
                        currentStep === index
                          ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100"
                          : completedSteps.includes(index) || index < currentStep
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white text-gray-500"
                      )}
                      whileHover={onStepClick ? { scale: 1.05 } : {}}
                      whileTap={onStepClick ? { scale: 0.95 } : {}}
                      aria-current={currentStep === index ? "step" : undefined}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`step-${index}-${completedSteps.includes(index) ? "completed" : currentStep === index ? "current" : "pending"}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center"
                        >
                          {completedSteps.includes(index) || index < currentStep ? (
                            <Check className="h-6 w-6" />
                          ) : (
                            <span className="text-lg font-semibold">{index + 1}</span>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.button>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium text-center max-w-[100px] truncate",
                        currentStep === index
                          ? "text-blue-600"
                          : completedSteps.includes(index) || index < currentStep
                          ? "text-green-600"
                          : "text-gray-500"
                      )}
                    >
                      {step.title}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs p-3 bg-white shadow-lg border border-gray-100 rounded-lg"
                  sideOffset={8}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{step.title}</p>
                    {step.description && <p className="text-xs text-gray-500">{step.description}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Desktop view - Full width steps with connecting lines */}
      <div className="hidden lg:block">
        <div className="relative flex items-center justify-between px-10 py-4">
          {/* Background connecting line - positioned in the middle of circles */}
          <div
            className="absolute top-1/2 left-[60px] right-[60px] h-1 bg-gray-200 z-0 transform -translate-y-1/2"
          />

          {/* Progress connecting line - with animation */}
          <motion.div
            className="absolute top-1/2 left-[60px] h-1 bg-gradient-to-r from-blue-500 to-green-500 z-0 rounded-full transform -translate-y-1/2"
            initial={{ width: "0%" }}
            animate={{
              width: currentStep === 0
                ? "0%"
                : currentStep >= steps.length - 1
                  ? "calc(100% - 120px)" // Stop at the last step, not beyond
                  : `calc(${((currentStep) / (steps.length - 1)) * 100}% - ${currentStep * 10}px)`
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Steps */}
          {steps.map((step, index) => (
            <TooltipProvider key={step.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="relative z-10 flex flex-col items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => onStepClick?.(index)}
                      disabled={!onStepClick}
                      className={cn(
                        "flex items-center justify-center w-16 h-16 rounded-full border-2 focus:outline-none",
                        onStepClick ? "cursor-pointer" : "cursor-default",
                        currentStep === index
                          ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100"
                          : completedSteps.includes(index) || index < currentStep
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white text-gray-500"
                      )}
                      whileHover={onStepClick ? { scale: 1.05 } : {}}
                      whileTap={onStepClick ? { scale: 0.95 } : {}}
                      aria-current={currentStep === index ? "step" : undefined}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`step-${index}-${completedSteps.includes(index) ? "completed" : currentStep === index ? "current" : "pending"}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center"
                        >
                          {completedSteps.includes(index) || index < currentStep ? (
                            <Check className="h-8 w-8" />
                          ) : (
                            <span className="text-xl font-semibold">{index + 1}</span>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.button>
                    <span
                      className={cn(
                        "mt-3 text-sm font-medium text-center max-w-[120px]",
                        currentStep === index
                          ? "text-blue-600"
                          : completedSteps.includes(index) || index < currentStep
                          ? "text-green-600"
                          : "text-gray-500"
                      )}
                    >
                      {step.title}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs p-3 bg-white shadow-lg border border-gray-100 rounded-lg"
                  sideOffset={8}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{step.title}</p>
                    {step.description && <p className="text-xs text-gray-500">{step.description}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
