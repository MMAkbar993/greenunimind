import { useState } from "react";
import { 
  Filter, 
  X, 
  Calendar, 
  BookOpen, 
  DollarSign, 
  RotateCcw,
  Star,
  Users,
  Clock,
  Save,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CourseFiltersProps, CourseStatus, CourseLevel } from "@/types/course-management";
import { COURSE_CATEGORIES } from "@/types/course.types";

const CourseFilters: React.FC<CourseFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  isLoading = false,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const statusOptions: CourseStatus[] = ['draft', 'published', 'archived', 'pending', 'rejected'];
  const levelOptions: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

  const handleStatusToggle = (status: CourseStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.category || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    onFiltersChange({ ...filters, category: newCategories });
  };

  const handleLevelToggle = (level: CourseLevel) => {
    const currentLevels = filters.level || [];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level];
    
    onFiltersChange({ ...filters, level: newLevels });
  };

  const handlePriceRangeChange = (values: number[]) => {
    onFiltersChange({ 
      ...filters, 
      priceRange: { min: values[0], max: values[1] } 
    });
  };

  const handleEnrollmentRangeChange = (values: number[]) => {
    onFiltersChange({ 
      ...filters, 
      enrollmentRange: { min: values[0], max: values[1] } 
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({ 
      ...filters, 
      dateRange: { 
        ...filters.dateRange, 
        [field]: value || undefined 
      } 
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      category: [],
      level: [],
      priceRange: { min: 0, max: 10000 },
      isFree: undefined,
      dateRange: {},
      enrollmentRange: { min: 0, max: 10000 },
      ratingRange: { min: 0, max: 5 },
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
      tags: [],
      instructor: '',
      language: '',
      duration: { min: 0, max: 1000 }
    });
  };

  const saveCurrentFilter = () => {
    if (saveFilterName.trim() && onSaveFilter) {
      onSaveFilter(saveFilterName.trim(), filters);
      setSaveFilterName("");
      setShowSaveDialog(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.category?.length) count++;
    if (filters.level?.length) count++;
    if (filters.search) count++;
    if (filters.isFree !== undefined) count++;
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) count++;
    if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 10000)) count++;
    if (filters.enrollmentRange && (filters.enrollmentRange.min > 0 || filters.enrollmentRange.max < 10000)) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const StatusFilter = () => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Status
        </Label>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {statusOptions.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusToggle(status)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors w-full text-left text-sm",
                filters.status?.includes(status)
                  ? "border-brand-primary bg-brand-accent text-brand-primary"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                status === 'published' && 'bg-green-500',
                status === 'draft' && 'bg-yellow-500',
                status === 'archived' && 'bg-gray-500',
                status === 'pending' && 'bg-blue-500',
                status === 'rejected' && 'bg-red-500'
              )} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  const CategoryFilter = () => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Category
        </Label>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2 max-h-48 overflow-y-auto">
        {COURSE_CATEGORIES.slice(0, 10).map((category) => (
          <div key={category} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryToggle(category)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors w-full text-left text-sm",
                filters.category?.includes(category)
                  ? "border-brand-primary bg-brand-accent text-brand-primary"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {category}
            </button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  const LevelFilter = () => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Level
        </Label>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {levelOptions.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleLevelToggle(level)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors w-full text-left text-sm",
                filters.level?.includes(level)
                  ? "border-brand-primary bg-brand-accent text-brand-primary"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {level}
            </button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  const PriceFilter = () => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Price Range
        </Label>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFiltersChange({ ...filters, isFree: true })}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                filters.isFree === true
                  ? "border-brand-primary bg-brand-accent text-brand-primary"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              Free Only
            </button>
            <button
              onClick={() => onFiltersChange({ ...filters, isFree: false })}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                filters.isFree === false
                  ? "border-brand-primary bg-brand-accent text-brand-primary"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              Paid Only
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>${filters.priceRange?.min || 0}</span>
              <span>${filters.priceRange?.max || 10000}</span>
            </div>
            <Slider
              value={[filters.priceRange?.min || 0, filters.priceRange?.max || 10000]}
              onValueChange={handlePriceRangeChange}
              max={10000}
              step={10}
              className="w-full"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  const EnrollmentFilter = () => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Enrollments
        </Label>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{filters.enrollmentRange?.min || 0}</span>
          <span>{filters.enrollmentRange?.max || 10000}+</span>
        </div>
        <Slider
          value={[filters.enrollmentRange?.min || 0, filters.enrollmentRange?.max || 10000]}
          onValueChange={handleEnrollmentRangeChange}
          max={10000}
          step={10}
          className="w-full"
        />
      </CollapsibleContent>
    </Collapsible>
  );

  const DateFilter = () => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date Range
        </Label>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="startDate" className="text-xs text-gray-600">From</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.dateRange?.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-xs text-gray-600">To</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.dateRange?.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
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
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              <StatusFilter />
              <CategoryFilter />
              <LevelFilter />
              <PriceFilter />
              <EnrollmentFilter />
              <DateFilter />
              
              {/* Save Filter */}
              {onSaveFilter && (
                <div className="pt-4 border-t">
                  {!showSaveDialog ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSaveDialog(true)}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Filter
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Filter name"
                        value={saveFilterName}
                        onChange={(e) => setSaveFilterName(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={saveCurrentFilter}
                          disabled={!saveFilterName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowSaveDialog(false);
                            setSaveFilterName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <Select onValueChange={(value) => {
          const savedFilter = savedFilters.find(f => f.id === value);
          if (savedFilter && onLoadFilter) {
            onLoadFilter(savedFilter.filters);
          }
        }}>
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder="Saved filters" />
          </SelectTrigger>
          <SelectContent>
            {savedFilters.map((savedFilter) => (
              <SelectItem key={savedFilter.id} value={savedFilter.id}>
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3 h-3" />
                  {savedFilter.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.status?.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="bg-brand-accent text-brand-primary"
            >
              {status}
              <button
                onClick={() => handleStatusToggle(status)}
                className="ml-1 hover:text-brand-primary-dark"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          {filters.category?.slice(0, 2).map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="bg-brand-accent text-brand-primary"
            >
              {category}
              <button
                onClick={() => handleCategoryToggle(category)}
                className="ml-1 hover:text-brand-primary-dark"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          {filters.category && filters.category.length > 2 && (
            <Badge variant="secondary" className="bg-brand-accent text-brand-primary">
              +{filters.category.length - 2} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseFilters;
