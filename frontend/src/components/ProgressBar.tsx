
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  showPercentageInBar?: boolean;
}

const ProgressBar = ({
  percentage,
  size = "md",
  showLabel = true,
  className,
  showPercentageInBar = false,
}: ProgressBarProps) => {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage || 0));

  // Size variants
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-4",
  };

  // Determine color based on progress
  const getColorClass = (percent: number) => {
    if (percent >= 100) return "bg-gradient-to-r from-green-500 to-green-600";
    if (percent >= 75) return "bg-gradient-to-r from-edu-purple to-purple-700";
    if (percent >= 50) return "bg-gradient-to-r from-blue-500 to-edu-purple";
    if (percent >= 25) return "bg-gradient-to-r from-blue-400 to-blue-500";
    return "bg-gradient-to-r from-blue-300 to-blue-400";
  };

  return (
    <div className={cn("w-full flex flex-col gap-1", className)}>
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden relative", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", getColorClass(clampedPercentage))}
          style={{ width: `${clampedPercentage}%` }}
        />

        {showPercentageInBar && size === "lg" && (
          <span className="absolute right-2 top-0 text-xs font-medium text-white">
            {clampedPercentage.toFixed(0)}%
          </span>
        )}
      </div>

      {showLabel && (
        <div className="text-xs text-gray-500 flex justify-end">
          {clampedPercentage.toFixed(0)}% Complete
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
