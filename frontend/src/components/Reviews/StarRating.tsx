import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRatingProps } from "@/types/review";

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 'md',
  showValue = true,
  readonly = true,
  onChange,
  className
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onChange) {
      onChange(starRating);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.floor(rating);
      const isHalfFilled = i === Math.ceil(rating) && rating % 1 !== 0;
      
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleStarClick(i)}
          disabled={readonly}
          className={cn(
            "relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default"
          )}
          aria-label={`${readonly ? 'Rating:' : 'Rate'} ${i} star${i !== 1 ? 's' : ''}`}
          aria-pressed={!readonly ? i <= rating : undefined}
          tabIndex={readonly ? -1 : 0}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors duration-200",
              isFilled || isHalfFilled
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 fill-gray-300"
            )}
          />
          {isHalfFilled && (
            <Star
              className={cn(
                sizeClasses[size],
                "absolute top-0 left-0 text-yellow-400 fill-yellow-400",
                "clip-path-half"
              )}
              style={{
                clipPath: `polygon(0 0, ${(rating % 1) * 100}% 0, ${(rating % 1) * 100}% 100%, 0 100%)`
              }}
            />
          )}
        </button>
      );
    }
    return stars;
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showValue && (
        <span className={cn(
          "font-medium text-gray-700 ml-1",
          textSizeClasses[size]
        )}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
