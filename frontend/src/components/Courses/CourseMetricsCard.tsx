import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CourseMetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  className?: string;
  trend?: Array<{ date: string; value: number }>;
  isLoading?: boolean;
}

const CourseMetricsCard: React.FC<CourseMetricsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  className,
  trend,
  isLoading = false
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

  if (isLoading) {
    return (
      <Card className={cn("dashboard-card", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gray-100 animate-pulse">
                  <div className="w-5 h-5 bg-gray-300 rounded" />
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("dashboard-card hover:shadow-md transition-shadow duration-200", className)}>
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

        {/* Mini trend chart */}
        {trend && trend.length > 0 && (
          <div className="mt-4 h-8 flex items-end gap-1">
            {trend.slice(-7).map((point, index) => {
              const maxValue = Math.max(...trend.map(p => p.value));
              const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex-1 rounded-sm transition-all duration-200",
                    changeType === 'positive' ? 'bg-green-200' :
                    changeType === 'negative' ? 'bg-red-200' : 'bg-gray-200'
                  )}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${point.date}: ${point.value}`}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseMetricsCard;
