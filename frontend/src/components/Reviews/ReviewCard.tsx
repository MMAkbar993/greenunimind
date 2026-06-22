import { useState } from "react";
import { MessageSquare, Calendar, BookOpen, MoreVertical, Reply, Flag, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ReviewCardProps } from "@/types/review";
import StarRating from "./StarRating";

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showCourse = true,
  showActions = true,
  onRespond,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHelpful, setIsHelpful] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const shouldTruncate = review.comment.length > 200;
  const displayComment = shouldTruncate && !isExpanded 
    ? review.comment.slice(0, 200) + '...' 
    : review.comment;

  const handleRespond = () => {
    if (onRespond) {
      onRespond(review._id);
    }
  };

  const handleMarkHelpful = () => {
    setIsHelpful(!isHelpful);
    // TODO: Implement API call to mark as helpful
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card
      className={cn("dashboard-card hover:shadow-md transition-shadow duration-200", className)}
      role="article"
      aria-label={`Review by ${review.student.name}`}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Student Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={review.student.profileImg} 
                  alt={review.student.name}
                />
                <AvatarFallback className="bg-brand-accent text-brand-primary font-medium">
                  {getInitials(review.student.name)}
                </AvatarFallback>
              </Avatar>

              {/* Student Info and Rating */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {review.student.name}
                  </h4>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getRatingColor(review.rating))}
                  >
                    {review.rating}.0
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <StarRating 
                    rating={review.rating} 
                    size="sm" 
                    showValue={false}
                  />
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {/* Course Info */}
                {showCourse && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <BookOpen className="w-3 h-3" />
                    <span className="truncate">{review.course.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRespond}>
                    <Reply className="w-4 h-4 mr-2" />
                    Respond
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMarkHelpful}>
                    <Heart className={cn("w-4 h-4 mr-2", isHelpful && "fill-current text-red-500")} />
                    {isHelpful ? 'Remove from helpful' : 'Mark as helpful'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <p className="text-gray-700 leading-relaxed">
              {displayComment}
            </p>
            
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-brand-primary hover:text-brand-primary-dark p-0 h-auto font-medium"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkHelpful}
                  className={cn(
                    "text-gray-600 hover:text-red-600 transition-colors",
                    isHelpful && "text-red-600"
                  )}
                >
                  <Heart className={cn("w-4 h-4 mr-1", isHelpful && "fill-current")} />
                  Helpful
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRespond}
                  className="text-gray-600 hover:text-brand-primary transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Respond
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Review #{review._id.slice(-6)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
