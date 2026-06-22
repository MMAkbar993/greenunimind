import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Video,
  Search,
  Filter,
  Grid3X3,
  List,
  RefreshCw,
  Download,
  Upload,
  Settings,
  HelpCircle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnhancedDashboardHeaderProps {
  title: string;
  subtitle?: string;
  courseCount: number;
  lectureCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onRefresh: () => void;
  className?: string;
}

const EnhancedDashboardHeader: React.FC<EnhancedDashboardHeaderProps> = ({
  title,
  subtitle,
  courseCount,
  lectureCount,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  className
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-600 mb-4">
              {subtitle}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-primary" />
              <span className="text-sm font-medium text-gray-900">{courseCount}</span>
              <span className="text-sm text-gray-600">Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-brand-primary" />
              <span className="text-sm font-medium text-gray-900">{lectureCount}</span>
              <span className="text-sm text-gray-600">Lectures</span>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            asChild
            size="lg"
            className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Link to="/teacher/courses/create" className="flex items-center">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Create New Course
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="border-brand-primary text-brand-primary hover:bg-brand-accent"
              >
                <Zap className="w-5 h-5 mr-2" />
                Quick Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/teacher/courses/import">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/teacher/courses/templates">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Course Templates
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/teacher/analytics">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/teacher/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/teacher/help">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search courses and lectures..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "px-3 py-1.5",
                viewMode === 'grid' 
                  ? "bg-white shadow-sm text-gray-900" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "px-3 py-1.5",
                viewMode === 'list' 
                  ? "bg-white shadow-sm text-gray-900" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <span>All Courses</span>
                <Badge variant="secondary" className="ml-auto">
                  {courseCount}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Published</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Draft</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Archived</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Recently Updated</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Most Popular</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-brand-accent to-brand-primary/10 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-primary">
              {courseCount}
            </div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-primary">
              {lectureCount}
            </div>
            <div className="text-sm text-gray-600">Total Lectures</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-primary">
              {Math.round(lectureCount / Math.max(courseCount, 1))}
            </div>
            <div className="text-sm text-gray-600">Avg Lectures/Course</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-primary">
              {courseCount > 0 ? Math.round((courseCount / (courseCount + 1)) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardHeader;
