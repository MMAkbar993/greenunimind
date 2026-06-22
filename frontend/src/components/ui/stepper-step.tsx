import React from 'react';
import { cn } from '@/lib/utils';
import { Check, BookOpen, FileText, Settings, Eye } from 'lucide-react';
import { Step } from './stepper';

type StepStatus = 'completed' | 'current' | 'upcoming';

interface StepperStepProps {
  step: Step;
  status: StepStatus;
  onClick?: () => void;
  clickable?: boolean;
  isMobile?: boolean;
}

const getStepIcon = (stepId: number, status: StepStatus) => {
  if (status === 'completed') {
    return <Check size={20} className="text-white" />;
  }

  const iconMap = {
    1: <BookOpen size={20} />,
    2: <FileText size={20} />,
    3: <Settings size={20} />,
    4: <Eye size={20} />
  };

  return iconMap[stepId as keyof typeof iconMap] || <span className="text-base font-bold">{stepId}</span>;
};

export const StepperStep: React.FC<StepperStepProps> = ({
  step,
  status,
  onClick,
  clickable = false,
  isMobile = false
}) => {
  const getCircleClasses = () => {
    const baseClasses = "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 flex-shrink-0";
    
    switch (status) {
      case 'completed':
        return cn(baseClasses, "bg-green-500 border-green-500 text-white shadow-md");
      case 'current':
        return cn(baseClasses, "bg-green-500 border-green-500 text-white shadow-lg ring-4 ring-green-200");
      case 'upcoming':
        return cn(baseClasses, "bg-white border-gray-300 text-gray-400");
      default:
        return baseClasses;
    }
  };

  const getTextClasses = () => {
    switch (status) {
      case 'completed':
        return "text-gray-600";
      case 'current':
        return "text-gray-900";
      case 'upcoming':
        return "text-gray-400";
      default:
        return "";
    }
  };

  const getTitleClasses = () => {
    switch (status) {
      case 'current':
        return "font-bold text-gray-900";
      case 'completed':
        return "font-medium text-gray-700";
      case 'upcoming':
        return "font-medium text-gray-400";
      default:
        return "";
    }
  };

  const getHoverClasses = () => {
    if (clickable) {
      return "cursor-pointer hover:scale-105 transition-transform duration-200";
    }
    return "";
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center text-center max-w-xs",
        getHoverClasses(),
        isMobile ? "w-full" : ""
      )}
      onClick={clickable ? onClick : undefined}
    >
      {/* Step Circle */}
      <div className={getCircleClasses()}>
        {getStepIcon(step.id, status)}
      </div>
      
      {/* Step Content - Below the circle for better alignment */}
      <div className="flex flex-col items-center mt-3">
        <h3 className={cn("text-sm leading-tight mb-1", getTitleClasses())}>
          {step.title}
        </h3>
        <p className={cn("text-xs leading-relaxed", getTextClasses())}>
          {step.description}
        </p>
      </div>
    </div>
  );
};
