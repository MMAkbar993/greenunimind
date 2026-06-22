import { useState } from "react";
import { MessageSquare, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewListProps } from "@/types/review";
import ReviewCard from "./ReviewCard";

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  showCourse = true,
  showActions = true,
  onRespond
}) => {
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = () => {
    if (onLoadMore && !loadingMore) {
      setLoadingMore(true);
      try {
        onLoadMore();
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const ReviewSkeleton = () => (
    <div className="dashboard-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          {showCourse && <Skeleton className="h-3 w-40" />}
        </div>
        <Skeleton className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );

  if (isLoading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <ReviewSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!isLoading && reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No reviews yet
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          When students leave reviews for your courses, they'll appear here. 
          Keep creating great content to encourage more feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Review Cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            showCourse={showCourse}
            showActions={showActions}
            onRespond={onRespond}
          />
        ))}
      </div>

      {/* Loading More Skeletons */}
      {loadingMore && (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <ReviewSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loadingMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="min-w-32"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More Reviews
              </>
            )}
          </Button>
        </div>
      )}

      {/* End of List Message */}
      {!hasMore && reviews.length > 0 && (
        <div className="text-center py-6 text-gray-500 text-sm border-t border-gray-100">
          You've reached the end of the reviews list
        </div>
      )}
    </div>
  );
};

export default ReviewList;
