import { useState, useMemo } from "react";
import { Grid3X3, List, Table as TableIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { EnhancedCourse, CourseViewMode } from "@/types/course-management";
import CourseDataTable from "./CourseDataTable";
import CourseGridView from "./CourseGridView";
import ResponsiveCourseCard from "./ResponsiveCourseCard";
import CourseBulkActions from "./CourseBulkActions";

interface ResponsiveCourseListProps {
  courses: EnhancedCourse[];
  viewMode: CourseViewMode;
  onViewModeChange: (mode: CourseViewMode) => void;
  selectedCourses: string[];
  onSelectionChange: (courseIds: string[]) => void;
  onCourseAction: (action: string, course: EnhancedCourse) => void;
  onBulkAction: (action: string) => void;
  isLoading?: boolean;
  className?: string;
  tableColumns?: any[];
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  onColumnToggle?: (columnKey: string, visible: boolean) => void;
  onColumnResize?: (columnKey: string, width: number) => void;
}

const ResponsiveCourseList: React.FC<ResponsiveCourseListProps> = ({
  courses,
  viewMode,
  onViewModeChange,
  selectedCourses,
  onSelectionChange,
  onCourseAction,
  onBulkAction,
  isLoading = false,
  className,
  tableColumns = [],
  onSort,
  onColumnToggle,
  onColumnResize
}) => {
  const {
    isMobile,
    isTablet,
    shouldUseCardLayout,
    shouldStackElements,
    getGridColumns,
    getResponsiveClasses,
    getContainerPadding,
    getGridGap,
    getTouchTargetSize,
    shouldUseTouchInteractions
  } = useResponsiveLayout();

  // Force card layout on mobile regardless of viewMode preference
  const effectiveViewMode = shouldUseCardLayout() ? 'list' : viewMode;

  // Responsive grid columns
  const gridColumns = useMemo(() => {
    switch (effectiveViewMode) {
      case 'grid':
        return getGridColumns(1, 2, 3, 4);
      case 'list':
        return 1;
      case 'table':
      default:
        return 1;
    }
  }, [effectiveViewMode, getGridColumns]);

  const handleCourseSelect = (courseId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedCourses, courseId]);
    } else {
      onSelectionChange(selectedCourses.filter(id => id !== courseId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      onSelectionChange(courses.map(course => course._id));
    } else {
      onSelectionChange([]);
    }
  };

  const renderViewModeToggle = () => {
    if (shouldUseCardLayout()) {
      // On mobile, don't show view mode toggle since we force card layout
      return null;
    }

    return (
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          className={cn("h-8 px-3", getTouchTargetSize())}
        >
          <TableIcon className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Table</span>}
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          className={cn("h-8 px-3", getTouchTargetSize())}
        >
          <Grid3X3 className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Grid</span>}
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className={cn("h-8 px-3", getTouchTargetSize())}
        >
          <List className="w-4 h-4" />
          {!isMobile && <span className="ml-2">List</span>}
        </Button>
      </div>
    );
  };

  const renderBulkActions = () => {
    if (selectedCourses.length === 0) return null;

    return (
      <CourseBulkActions
        selectedCourses={selectedCourses}
        onBulkAction={onBulkAction}
        isLoading={isLoading}
        className="mb-4"
      />
    );
  };

  const renderTableView = () => {
    if (shouldUseCardLayout()) {
      // On mobile, render as responsive cards instead of table
      return renderCardListView();
    }

    return (
      <CourseDataTable
        courses={courses}
        columns={tableColumns}
        isLoading={isLoading}
        selectedCourses={selectedCourses}
        onSelectionChange={onSelectionChange}
        onSort={onSort}
        onColumnResize={onColumnResize}
        onColumnToggle={onColumnToggle}
        onRowClick={(course) => onCourseAction('view', course)}
        onBulkAction={onBulkAction}
      />
    );
  };

  const renderGridView = () => {
    return (
      <CourseGridView
        courses={courses}
        isLoading={isLoading}
        onEdit={(course) => onCourseAction('edit', course)}
        onDuplicate={(course) => onCourseAction('duplicate', course)}
        onDelete={(course) => onCourseAction('delete', course)}
        onViewAnalytics={(course) => onCourseAction('analytics', course)}
        onSortChange={onSort}
      />
    );
  };

  const renderCardListView = () => {
    if (isLoading) {
      return (
        <div className={cn("space-y-4", getGridGap())}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="dashboard-card">
              <CardContent className={cn("p-4", shouldUseTouchInteractions() && "p-6")}>
                <div className="animate-pulse space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                      <div className="h-5 w-full bg-gray-200 rounded" />
                      <div className="h-3 w-3/4 bg-gray-200 rounded" />
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded" />
                  </div>
                  <div className="h-32 w-full bg-gray-200 rounded-lg" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                      <div className="h-5 w-12 bg-gray-200 rounded" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                      <div className="h-5 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className={cn("space-y-4", getGridGap())}>
        {courses.map((course) => (
          <ResponsiveCourseCard
            key={course._id}
            course={course}
            isSelected={selectedCourses.includes(course._id)}
            onSelect={handleCourseSelect}
            onEdit={(course) => onCourseAction('edit', course)}
            onDuplicate={(course) => onCourseAction('duplicate', course)}
            onDelete={(course) => onCourseAction('delete', course)}
            onTogglePublish={(course) => onCourseAction('togglePublish', course)}
            onArchive={(course) => onCourseAction('archive', course)}
            onClick={(course) => onCourseAction('view', course)}
            showSelection={selectedCourses.length > 0 || courses.some(c => selectedCourses.includes(c._id))}
            isMobile={isMobile}
          />
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (effectiveViewMode) {
      case 'grid':
        return renderGridView();
      case 'list':
        return renderCardListView();
      case 'table':
      default:
        return renderTableView();
    }
  };

  return (
    <div className={cn("space-y-4", getContainerPadding(), className)}>
      {/* Header with view mode toggle */}
      <div className={cn(
        "flex items-center justify-between",
        shouldStackElements() && "flex-col gap-4 items-stretch"
      )}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Courses ({courses.length})
          </h2>
          {selectedCourses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedCourses.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
                className={getTouchTargetSize()}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {renderViewModeToggle()}
      </div>

      {/* Bulk actions */}
      {renderBulkActions()}

      {/* Course list content */}
      {renderContent()}

      {/* Empty state */}
      {courses.length === 0 && !isLoading && (
        <Card className="dashboard-card">
          <CardContent className={cn("p-12 text-center", getContainerPadding())}>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your filters or create a new course to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResponsiveCourseList;
