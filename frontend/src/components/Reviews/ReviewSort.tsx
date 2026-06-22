import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ReviewSortProps, ReviewFilters } from "@/types/review";

const ReviewSort: React.FC<ReviewSortProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  className
}) => {
  const sortOptions: Array<{
    value: ReviewFilters['sortBy'];
    label: string;
  }> = [
    { value: 'createdAt', label: 'Date' },
    { value: 'rating', label: 'Rating' },
    { value: 'course', label: 'Course' },
  ];

  const getSortIcon = () => {
    if (sortOrder === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    } else if (sortOrder === 'desc') {
      return <ArrowDown className="w-4 h-4" />;
    }
    return <ArrowUpDown className="w-4 h-4" />;
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Sort';
  };

  const handleSortSelect = (newSortBy: ReviewFilters['sortBy']) => {
    if (newSortBy === sortBy) {
      // Toggle order if same field
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      onSortChange(newSortBy, newOrder);
    } else {
      // Default to desc for new field
      onSortChange(newSortBy, 'desc');
    }
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newOrder);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10">
            {getSortIcon()}
            <span className="ml-2">Sort by {getCurrentSortLabel()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortSelect(option.value)}
              className={cn(
                "cursor-pointer",
                sortBy === option.value && "bg-brand-accent text-brand-primary"
              )}
            >
              <span className="flex-1">{option.label}</span>
              {sortBy === option.value && (
                <span className="ml-2">
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                </span>
              )}
            </DropdownMenuItem>
          ))}
          
          {sortBy && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={toggleSortOrder}
                className="cursor-pointer"
              >
                <span className="flex-1">
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </span>
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-4 h-4 ml-2" />
                ) : (
                  <ArrowDown className="w-4 h-4 ml-2" />
                )}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ReviewSort;
