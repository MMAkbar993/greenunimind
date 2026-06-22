import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RatingDistributionProps } from "@/types/review";

const RatingDistribution: React.FC<RatingDistributionProps> = ({
  distribution,
  totalReviews,
  className
}) => {
  const ratings = [5, 4, 3, 2, 1];

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  const getBarColor = (rating: number) => {
    switch (rating) {
      case 5:
        return "bg-green-500";
      case 4:
        return "bg-green-400";
      case 3:
        return "bg-yellow-400";
      case 2:
        return "bg-orange-400";
      case 1:
        return "bg-red-400";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Rating Distribution
      </h3>
      
      {ratings.map((rating) => {
        const count = distribution[rating as keyof typeof distribution] || 0;
        const percentage = getPercentage(count);
        
        return (
          <div key={rating} className="flex items-center gap-3">
            {/* Rating with star */}
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium text-gray-600 w-2">
                {rating}
              </span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </div>
            
            {/* Progress bar */}
            <div className="flex-1 relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    getBarColor(rating)
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            
            {/* Count and percentage */}
            <div className="flex items-center gap-2 w-16 text-right">
              <span className="text-xs text-gray-500">
                {count}
              </span>
              <span className="text-xs text-gray-400">
                ({percentage.toFixed(0)}%)
              </span>
            </div>
          </div>
        );
      })}
      
      {totalReviews === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No reviews yet
        </div>
      )}
    </div>
  );
};

export default RatingDistribution;
