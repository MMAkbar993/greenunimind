import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useValidatedTeacherId } from '@/hooks/useValidatedTeacherId';
import { cn } from '@/lib/utils';
import {
  useGetDashboardSummaryQuery,
  useGetRealTimeDataQuery,
} from '@/redux/features/analytics/analyticsApi';
import { AnalyticsFilters as AnalyticsFiltersType } from '@/types/analytics';
import {
  BarChart3,
  BookOpen,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  Filter,
  MoreVertical,
  RefreshCw,
  Settings,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AnalyticsFiltersComponent from './AnalyticsFilters';
import AnalyticsOverview from './AnalyticsOverview';
import CoursePerformance from './CoursePerformance';
import CustomDashboard from './CustomDashboard';
import GeographicInsights from './GeographicInsights';
import PredictiveInsights from './PredictiveInsights';
import RevenueAnalytics from './RevenueAnalytics';
import StudentEngagement from './StudentEngagement';

const AnalyticsLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<AnalyticsFiltersType>({
    period: 'monthly',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { teacherId, isValidTeacherId, shouldSkipQuery } = useValidatedTeacherId();

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetDashboardSummaryQuery(teacherId || '', {
    skip: shouldSkipQuery,
  });

  const {
    data: realTimeData,
    isLoading: isRealTimeLoading,
    refetch: refetchRealTime,
  } = useGetRealTimeDataQuery(
    { teacherId: teacherId || '' },
    {
      skip: shouldSkipQuery || !autoRefresh,
    }
  );

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchDashboard();
      refetchRealTime();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh, refetchDashboard, refetchRealTime]);

  const handleFilterChange = (newFilters: Partial<AnalyticsFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    // Export functionality will be implemented
    console.log('Exporting as:', format);
  };

  const handleRefresh = () => {
    refetchDashboard();
    refetchRealTime();
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-4 w-4" />,
      component: <AnalyticsOverview filters={filters} />,
    },
    {
      id: 'students',
      label: 'Students',
      icon: <Users className="h-4 w-4" />,
      component: <StudentEngagement filters={filters} />,
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: <BookOpen className="h-4 w-4" />,
      component: <CoursePerformance filters={filters} />,
    },
    {
      id: 'revenue',
      label: 'Revenue',
      icon: <DollarSign className="h-4 w-4" />,
      component: <RevenueAnalytics filters={filters} />,
    },
    {
      id: 'geographic',
      label: 'Geographic',
      icon: <TrendingUp className="h-4 w-4" />,
      component: <GeographicInsights filters={filters} />,
    },
    {
      id: 'predictive',
      label: 'Insights',
      icon: <Star className="h-4 w-4" />,
      component: <PredictiveInsights filters={filters} />,
    },
    {
      id: 'custom',
      label: 'Custom',
      icon: <Settings className="h-4 w-4" />,
      component: <CustomDashboard filters={filters} />,
    },
  ];

  if (isDashboardLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">
                Track your teaching performance and student engagement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Real-time indicator */}
            {realTimeData && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            )}

            {/* Period selector */}
            <Select
              value={filters.period}
              onValueChange={value => handleFilterChange({ period: value as any })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>

            {/* Filters toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={cn(filtersVisible && 'bg-blue-50 border-blue-200')}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {filtersVisible ? (
                <EyeOff className="h-4 w-4 ml-1" />
              ) : (
                <Eye className="h-4 w-4 ml-1" />
              )}
            </Button>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isDashboardLoading || isRealTimeLoading}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4 mr-1',
                  (isDashboardLoading || isRealTimeLoading) && 'animate-spin'
                )}
              />
              Refresh
            </Button>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAutoRefresh(!autoRefresh)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Dashboard Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters panel */}
        {filtersVisible && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AnalyticsFiltersComponent
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClose={() => setFiltersVisible(false)}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tab navigation */}
          <div className="bg-white border-b border-gray-200 px-4 lg:px-6">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-none lg:flex">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 text-xs lg:text-sm"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="h-full m-0 p-4 lg:p-6">
                {tab.component}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsLayout;
