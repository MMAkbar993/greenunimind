import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Star,
  Award,
  Clock,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CourseStatsCardProps } from "@/types/course-management";
import CourseMetricsCard from "./CourseMetricsCard";

const CourseStatsOverview: React.FC<CourseStatsCardProps> = ({
  stats,
  isLoading = false,
  timeRange = 'month',
  onTimeRangeChange,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
        {[...Array(4)].map((_, i) => (
          <CourseMetricsCard
            key={i}
            title=""
            value=""
            icon={<div />}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  const metricsCards = [
    {
      title: "Total Courses",
      value: stats.totalCourses,
      change: stats.monthlyGrowth,
      changeType: (stats.monthlyGrowth >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' | 'neutral',
      icon: <BookOpen className="w-5 h-5" />,
      description: `${stats.publishedCourses} published, ${stats.draftCourses} drafts`
    },
    {
      title: "Total Students",
      value: stats.totalEnrollments,
      change: stats.weeklyGrowth,
      changeType: (stats.weeklyGrowth >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' | 'neutral',
      icon: <Users className="w-5 h-5" />,
      description: `${stats.recentActivity} new this week`
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: undefined,
      changeType: 'neutral' as 'positive' | 'negative' | 'neutral',
      icon: <DollarSign className="w-5 h-5" />,
      description: "Lifetime earnings"
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      change: undefined,
      changeType: (stats.averageRating >= 4.5 ? 'positive' : stats.averageRating >= 3.5 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      icon: <Star className="w-5 h-5" />,
      description: "Out of 5.0 stars"
    }
  ];

  const additionalMetrics = [
    {
      title: "Completion Rate",
      value: `${stats.averageCompletionRate.toFixed(1)}%`,
      icon: <Award className="w-5 h-5" />,
      description: "Average across all courses"
    },
    {
      title: "Top Performer",
      value: stats.topPerformingCourse || "N/A",
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Best performing course"
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Time Range Selector */}
      {onTimeRangeChange && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Course Overview</h2>
          <div className="flex items-center gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  timeRange === range
                    ? "bg-brand-primary text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric, index) => (
          <CourseMetricsCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
            description={metric.description}
          />
        ))}
      </div>

      {/* Course Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-primary" />
              Course Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: 'Published', count: stats.publishedCourses, color: 'bg-green-500' },
                { label: 'Draft', count: stats.draftCourses, color: 'bg-yellow-500' },
                { label: 'Archived', count: stats.archivedCourses, color: 'bg-gray-500' }
              ].map((status) => {
                const percentage = stats.totalCourses > 0 ? (status.count / stats.totalCourses) * 100 : 0;
                
                return (
                  <div key={status.label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-20">
                      <div className={cn("w-3 h-3 rounded-full", status.color)} />
                      <span className="text-sm font-medium text-gray-600">{status.label}</span>
                    </div>
                    
                    <div className="flex-1 relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full transition-all duration-300", status.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-16 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {status.count}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <Card className="dashboard-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {additionalMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 rounded-lg bg-brand-accent text-brand-primary">
                    {metric.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Create Course', icon: <BookOpen className="w-4 h-4" />, action: 'create' },
              { label: 'View Analytics', icon: <BarChart3 className="w-4 h-4" />, action: 'analytics' },
              { label: 'Manage Students', icon: <Users className="w-4 h-4" />, action: 'students' },
              { label: 'Revenue Report', icon: <DollarSign className="w-4 h-4" />, action: 'revenue' }
            ].map((action, index) => (
              <button
                key={index}
                className="flex items-center gap-2 p-3 text-left border border-gray-200 rounded-lg hover:border-brand-primary hover:bg-brand-accent transition-colors"
              >
                <div className="p-1 rounded bg-brand-accent text-brand-primary">
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseStatsOverview;
