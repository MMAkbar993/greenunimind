import React, { useState } from 'react';
import { AnalyticsFilters as AnalyticsFiltersType } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  X,
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersType;
  onFiltersChange: (filters: Partial<AnalyticsFiltersType>) => void;
  onClose: () => void;
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);

  // Mock data - in real app, this would come from API
  const availableCourses = [
    { id: '1', name: 'React Fundamentals', category: 'Frontend' },
    { id: '2', name: 'Advanced JavaScript', category: 'Frontend' },
    { id: '3', name: 'Node.js Backend', category: 'Backend' },
    { id: '4', name: 'TypeScript Mastery', category: 'Frontend' },
    { id: '5', name: 'Database Design', category: 'Backend' }
  ];

  const categories = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'Data Science'];
  const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France'];

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (type === 'start') {
      setStartDate(date);
      onFiltersChange({ startDate: date?.toISOString().split('T')[0] });
    } else {
      setEndDate(date);
      onFiltersChange({ endDate: date?.toISOString().split('T')[0] });
    }
  };

  const handleCourseSelect = (courseId: string) => {
    onFiltersChange({ courseId });
    setCourseSearchOpen(false);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFiltersChange({
      startDate: undefined,
      endDate: undefined,
      courseId: undefined
    });
  };

  const selectedCourse = availableCourses.find(course => course.id === filters.courseId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear All
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleDateChange('start', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM dd") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => handleDateChange('end', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Course Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Course</Label>
          <Popover open={courseSearchOpen} onOpenChange={setCourseSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={courseSearchOpen}
                className="w-full justify-between"
              >
                {selectedCourse ? selectedCourse.name : "Select course..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search courses..." />
                <CommandList>
                  <CommandEmpty>No course found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onFiltersChange({ courseId: undefined });
                        setCourseSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !filters.courseId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Courses
                    </CommandItem>
                    {availableCourses.map((course) => (
                      <CommandItem
                        key={course.id}
                        onSelect={() => handleCourseSelect(course.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.courseId === course.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{course.name}</span>
                          <span className="text-xs text-gray-500">{course.category}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Period */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Period</Label>
          <Select
            value={filters.period || 'monthly'}
            onValueChange={(value) => onFiltersChange({ period: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Filters */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Filters</Label>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const last7Days = new Date();
                last7Days.setDate(last7Days.getDate() - 7);
                setStartDate(last7Days);
                setEndDate(new Date());
                onFiltersChange({
                  startDate: last7Days.toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                });
              }}
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const last30Days = new Date();
                last30Days.setDate(last30Days.getDate() - 30);
                setStartDate(last30Days);
                setEndDate(new Date());
                onFiltersChange({
                  startDate: last30Days.toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                });
              }}
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const last90Days = new Date();
                last90Days.setDate(last90Days.getDate() - 90);
                setStartDate(last90Days);
                setEndDate(new Date());
                onFiltersChange({
                  startDate: last90Days.toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                });
              }}
            >
              Last 90 days
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.startDate || filters.endDate || filters.courseId) && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          <div className="flex flex-wrap gap-1">
            {filters.startDate && filters.endDate && (
              <Badge variant="secondary" className="text-xs">
                {format(new Date(filters.startDate), "MMM dd")} - {format(new Date(filters.endDate), "MMM dd")}
                <button
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    onFiltersChange({ startDate: undefined, endDate: undefined });
                  }}
                  className="ml-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCourse && (
              <Badge variant="secondary" className="text-xs">
                {selectedCourse.name}
                <button
                  onClick={() => onFiltersChange({ courseId: undefined })}
                  className="ml-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsFilters;
