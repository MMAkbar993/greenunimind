import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReviewMetricsCardProps } from "@/types/review";

const ReviewMetricsCard: React.FC<ReviewMetricsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  className
}) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'negative':
        return <ArrowDownRight className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={cn("dashboard-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-accent text-brand-primary">
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {title}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(value)}
              </p>
              
              {description && (
                <p className="text-xs text-gray-500">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              getChangeColor()
            )}>
              {getChangeIcon()}
              <span>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewMetricsCard;
