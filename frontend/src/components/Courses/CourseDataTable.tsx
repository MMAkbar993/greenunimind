import { useState, useMemo, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  CheckSquare,
  Square,
  Settings
} from "lucide-react";
import QuickLectureActions from "@/components/Lecture/QuickLectureActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CourseTableProps, EnhancedCourse, CourseSortField } from "@/types/course-management";

const CourseDataTable: React.FC<CourseTableProps> = ({
  courses,
  columns,
  isLoading = false,
  selectedCourses,
  onSelectionChange,
  onSort,
  onColumnResize,
  onColumnToggle,
  onRowClick,
  onBulkAction,
  className
}) => {
  const [sortField, setSortField] = useState<CourseSortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Memoized visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(col => col.visible);
  }, [columns]);

  // Handle column sorting
  const handleSort = useCallback((field: CourseSortField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  }, [sortField, sortOrder, onSort]);

  // Handle row selection
  const handleRowSelect = useCallback((courseId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedCourses, courseId]);
    } else {
      onSelectionChange(selectedCourses.filter(id => id !== courseId));
    }
  }, [selectedCourses, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      onSelectionChange(courses.map(course => course._id));
    } else {
      onSelectionChange([]);
    }
  }, [courses, onSelectionChange]);

  // Check if all rows are selected
  const isAllSelected = useMemo(() => {
    return courses.length > 0 && selectedCourses.length === courses.length;
  }, [courses.length, selectedCourses.length]);

  // Check if some rows are selected
  const isSomeSelected = useMemo(() => {
    return selectedCourses.length > 0 && selectedCourses.length < courses.length;
  }, [selectedCourses.length, courses.length]);

  // Format cell value based on column type
  const formatCellValue = useCallback((value: any, column: typeof columns[0]) => {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'rating':
        return typeof value === 'number' ? value.toFixed(1) : value;
      case 'status':
        return (
          <Badge 
            variant={value === 'published' ? 'default' : value === 'draft' ? 'secondary' : 'outline'}
            className={cn(
              value === 'published' && 'bg-green-100 text-green-800 hover:bg-green-100',
              value === 'draft' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
              value === 'archived' && 'bg-gray-100 text-gray-800 hover:bg-gray-100'
            )}
          >
            {value}
          </Badge>
        );
      default:
        return value;
    }
  }, []);

  // Get cell value from course object
  const getCellValue = useCallback((course: EnhancedCourse, columnKey: string) => {
    switch (columnKey) {
      case 'title':
        return course.title;
      case 'status':
        return course.status;
      case 'enrollments':
        return course.enrolledStudents?.length || 0;
      case 'price':
        return course.isFree === 'free' ? 'Free' : course.coursePrice || 0;
      case 'revenue':
        return course.totalRevenue || 0;
      case 'rating':
        return course.averageRating || 0;
      case 'updatedAt':
        return course.updatedAt;
      case 'createdAt':
        return course.createdAt;
      default:
        return (course as any)[columnKey];
    }
  }, []);

  // Render sort icon
  const renderSortIcon = useCallback((columnKey: string) => {
    if (sortField !== columnKey) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  }, [sortField, sortOrder]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={cn("dashboard-card", className)}>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Courses ({courses.length})
          {selectedCourses.length > 0 && (
            <Badge variant="secondary">
              {selectedCourses.length} selected
            </Badge>
          )}
        </CardTitle>
        
        <div className="flex items-center gap-2">
          {/* Column Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((column) => (
                <DropdownMenuItem
                  key={column.key}
                  onClick={() => onColumnToggle(column.key, !column.visible)}
                  className="flex items-center gap-2"
                >
                  {column.visible ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {column.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Select All Checkbox */}
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all courses"
                    className={isSomeSelected && !isAllSelected ? "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" : ""}
                  />
                </TableHead>
                
                {/* Column Headers */}
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "cursor-pointer select-none",
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    style={{ 
                      width: column.width,
                      minWidth: column.minWidth 
                    }}
                    onClick={() => column.sortable && handleSort(column.key as CourseSortField)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {column.sortable && renderSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
                
                {/* Actions Column */}
                <TableHead className="w-20 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {courses.map((course) => (
                <TableRow
                  key={course._id}
                  className={cn(
                    "cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedCourses.includes(course._id) && "bg-brand-accent"
                  )}
                  onClick={() => onRowClick?.(course)}
                >
                  {/* Selection Checkbox */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCourses.includes(course._id)}
                      onCheckedChange={(checked) => 
                        handleRowSelect(course._id, checked as boolean)
                      }
                      aria-label={`Select ${course.title}`}
                    />
                  </TableCell>
                  
                  {/* Data Cells */}
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.key === 'title' ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {course.title}
                          </div>
                          {course.subtitle && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {course.subtitle}
                            </div>
                          )}
                        </div>
                      ) : (
                        formatCellValue(getCellValue(course, column.key), column)
                      )}
                    </TableCell>
                  ))}
                  
                  {/* Actions Cell */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {/* Quick Lecture Actions */}
                      <QuickLectureActions
                        course={course as any}
                        variant="inline"
                        size="sm"
                        showLectureCount={false}
                      />

                      {/* More Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Empty State */}
        {courses.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Get started by creating your first course or adjust your filters to see existing courses.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseDataTable;
