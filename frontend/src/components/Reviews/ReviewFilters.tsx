import { useState } from "react";
import { Filter, X, Calendar, BookOpen, Star, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ReviewFiltersProps } from "@/types/review";

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  filters,
  onFiltersChange,
  courses,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRatingToggle = (rating: number) => {
    const currentRatings = filters.rating || [];
    const newRatings = currentRatings.includes(rating)
      ? currentRatings.filter(r => r !== rating)
      : [...currentRatings, rating];
    
    onFiltersChange({ ...filters, rating: newRatings });
  };

  const handleCourseChange = (courseId: string) => {
    onFiltersChange({ 
      ...filters, 
      courseId: courseId === 'all' ? undefined : courseId 
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({
      rating: [],
      courseId: undefined,
      startDate: undefined,
      endDate: undefined,
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.rating?.length) count++;
    if (filters.courseId) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.search) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const RatingFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">Rating</Label>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRatingToggle(rating)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2",
                filters.rating?.includes(rating)
                  ? "border-brand-primary bg-brand-accent text-brand-primary"
                  : "border-gray-200 hover:border-gray-300"
              )}
              aria-pressed={filters.rating?.includes(rating)}
              aria-label={`Filter by ${rating} star${rating !== 1 ? 's' : ''}`}
            >
              <div className="flex items-center">
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                ))}
                {[...Array(5 - rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-gray-300" />
                ))}
              </div>
              <span className="text-sm">{rating} star{rating !== 1 ? 's' : ''}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const CourseFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">Course</Label>
      <Select
        value={filters.courseId || 'all'}
        onValueChange={handleCourseChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="All courses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All courses</SelectItem>
          {courses.map((course) => (
            <SelectItem key={course._id} value={course._id}>
              {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const DateFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">Date Range</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="startDate" className="text-xs text-gray-600">From</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="endDate" className="text-xs text-gray-600">To</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-10">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <RatingFilter />
              <CourseFilter />
              <DateFilter />
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.rating?.map((rating) => (
            <Badge
              key={rating}
              variant="secondary"
              className="bg-brand-accent text-brand-primary"
            >
              {rating} star{rating !== 1 ? 's' : ''}
              <button
                onClick={() => handleRatingToggle(rating)}
                className="ml-1 hover:text-brand-primary-dark"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          {filters.courseId && (
            <Badge variant="secondary" className="bg-brand-accent text-brand-primary">
              <BookOpen className="w-3 h-3 mr-1" />
              Course
              <button
                onClick={() => handleCourseChange('all')}
                className="ml-1 hover:text-brand-primary-dark"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary" className="bg-brand-accent text-brand-primary">
              <Calendar className="w-3 h-3 mr-1" />
              Date Range
              <button
                onClick={() => {
                  handleDateChange('startDate', '');
                  handleDateChange('endDate', '');
                }}
                className="ml-1 hover:text-brand-primary-dark"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewFilters;
