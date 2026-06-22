import React from 'react';
import { DashboardStatCard } from '@/components/ui/dashboard-card';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  Star, 
  PlayCircle, 
  Award,
  TrendingUp,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsData {
  totalCourses: number;
  totalStudents: number;
  totalEarnings: number;
  totalLectures: number;
  avgRating: number;
  totalReviews: number;
  publishedCourses: number;
  draftCourses: number;
  newStudentsThisMonth: number;
  monthlyEarnings: number;
  coursesGrowth: number;
  studentsGrowth: number;
  earningsGrowth: number;
  ratingGrowth: number;
  performanceScore: string;
}

interface ModernStatsGridProps {
  stats: StatsData;
  isLoading?: boolean;
  className?: string;
  onStatClick?: (statId: string) => void;
}

export const ModernStatsGrid: React.FC<ModernStatsGridProps> = ({
  stats,
  isLoading = false,
  className,
  onStatClick,
}) => {
  // Generate modern stat cards with enterprise-grade design
  const statCards = [
    {
      id: 'total-courses',
      title: 'Total Courses',
      value: stats.totalCourses.toString(),
      icon: <BookOpen className="w-5 h-5" />,
      description: `${stats.publishedCourses} published, ${stats.draftCourses} drafts`,
      trend: stats.coursesGrowth >= 0 ? 'up' as const : 'down' as const,
      trendValue: `${stats.coursesGrowth >= 0 ? '+' : ''}${stats.coursesGrowth}%`,
      trendLabel: 'vs last month',
      color: 'primary' as const,
      onClick: () => onStatClick?.('courses'),
    },
    {
      id: 'total-students',
      title: 'Total Students',
      value: stats.totalStudents.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      description: `+${stats.newStudentsThisMonth} this month`,
      trend: stats.studentsGrowth >= 0 ? 'up' as const : 'down' as const,
      trendValue: `${stats.studentsGrowth >= 0 ? '+' : ''}${stats.studentsGrowth.toFixed(1)}%`,
      trendLabel: 'growth rate',
      color: 'secondary' as const,
      onClick: () => onStatClick?.('students'),
    },
    {
      id: 'total-earnings',
      title: 'Total Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      description: `$${stats.monthlyEarnings.toLocaleString()} this month`,
      trend: stats.earningsGrowth >= 0 ? 'up' as const : 'down' as const,
      trendValue: `${stats.earningsGrowth >= 0 ? '+' : ''}${stats.earningsGrowth.toFixed(1)}%`,
      trendLabel: 'revenue growth',
      color: 'warning' as const,
      onClick: () => onStatClick?.('earnings'),
    },
    {
      id: 'course-rating',
      title: 'Course Rating',
      value: `${stats.avgRating.toFixed(1)}/5`,
      icon: <Star className="w-5 h-5" />,
      description: `${stats.totalReviews} total reviews`,
      trend: stats.ratingGrowth >= 0 ? 'up' as const : 'down' as const,
      trendValue: `${stats.ratingGrowth >= 0 ? '+' : ''}${stats.ratingGrowth}%`,
      trendLabel: 'rating improvement',
      color: 'purple' as const,
      onClick: () => onStatClick?.('reviews'),
    },
    {
      id: 'total-lectures',
      title: 'Total Lectures',
      value: stats.totalLectures.toString(),
      icon: <PlayCircle className="w-5 h-5" />,
      description: 'Across all courses',
      trend: stats.coursesGrowth >= 0 ? 'up' as const : 'down' as const,
      trendValue: `${stats.coursesGrowth >= 0 ? '+' : ''}${stats.coursesGrowth.toFixed(1)}%`,
      trendLabel: 'content growth',
      color: 'indigo' as const,
      onClick: () => onStatClick?.('lectures'),
    },
    {
      id: 'performance-score',
      title: 'Performance Score',
      value: stats.performanceScore,
      icon: <Award className="w-5 h-5" />,
      description: 'Based on student feedback',
      trend: (stats.performanceScore === 'Excellent' || stats.performanceScore === 'Good') 
        ? 'up' as const 
        : 'down' as const,
      trendValue: stats.performanceScore === 'Excellent' 
        ? '+5%' 
        : stats.performanceScore === 'Good' 
        ? '+2%' 
        : '0%',
      trendLabel: 'quality score',
      color: 'success' as const,
      onClick: () => onStatClick?.('performance'),
    },
  ];

  return (
    <div className={cn(
      'grid gap-4 sm:gap-6',
      // Responsive grid layout optimized for different screen sizes
      'grid-cols-1',           // Mobile: 1 column
      'xs:grid-cols-2',        // Extra small: 2 columns
      'md:grid-cols-3',        // Medium: 3 columns
      'xl:grid-cols-6',        // Extra large: 6 columns
      // Ensure equal height cards
      'auto-rows-fr',
      className
    )}>
      {statCards.map((card) => (
        <DashboardStatCard
          key={card.id}
          title={card.title}
          value={card.value}
          icon={card.icon}
          description={card.description}
          trend={card.trend}
          trendValue={card.trendValue}
          trendLabel={card.trendLabel}
          color={card.color}
          onClick={card.onClick}
          isLoading={isLoading}
          className={cn(
            // Responsive minimum heights for consistent card sizing
            'min-h-[140px]',         // Base minimum height
            'xs:min-h-[150px]',      // Extra small screens
            'sm:min-h-[160px]',      // Small screens
            'lg:min-h-[170px]',      // Large screens
            // Ensure touch-friendly interaction areas
            'touch-target',
            // Accessibility improvements
            'focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
            'focus-visible:outline-none'
          )}
        />
      ))}
    </div>
  );
};

// Additional stats components for different dashboard sections
export interface QuickStatsProps {
  stats: Pick<StatsData, 'totalCourses' | 'totalStudents' | 'totalEarnings' | 'avgRating'>;
  isLoading?: boolean;
  className?: string;
  onStatClick?: (statId: string) => void;
}

// Simplified stats grid for smaller dashboard sections
export const QuickStatsGrid: React.FC<QuickStatsProps> = ({
  stats,
  isLoading = false,
  className,
  onStatClick,
}) => {
  const quickStats = [
    {
      id: 'courses',
      title: 'Courses',
      value: stats.totalCourses.toString(),
      icon: <BookOpen className="w-5 h-5" />,
      color: 'primary' as const,
    },
    {
      id: 'students',
      title: 'Students',
      value: stats.totalStudents.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'secondary' as const,
    },
    {
      id: 'earnings',
      title: 'Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'warning' as const,
    },
    {
      id: 'rating',
      title: 'Rating',
      value: `${stats.avgRating.toFixed(1)}/5`,
      icon: <Star className="w-5 h-5" />,
      color: 'purple' as const,
    },
  ];

  return (
    <div className={cn(
      'grid gap-4 grid-cols-2 sm:grid-cols-4',
      className
    )}>
      {quickStats.map((stat) => (
        <DashboardStatCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          onClick={() => onStatClick?.(stat.id)}
          isLoading={isLoading}
          className="min-h-[120px]"
        />
      ))}
    </div>
  );
};

// Performance metrics grid for analytics section
export interface PerformanceMetricsProps {
  metrics: {
    completionRate: number;
    engagementScore: number;
    satisfactionRate: number;
    retentionRate: number;
  };
  isLoading?: boolean;
  className?: string;
}

export const PerformanceMetricsGrid: React.FC<PerformanceMetricsProps> = ({
  metrics,
  isLoading = false,
  className,
}) => {
  const performanceStats = [
    {
      id: 'completion',
      title: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: <Target className="w-5 h-5" />,
      color: 'success' as const,
      trend: metrics.completionRate >= 70 ? 'up' as const : 'down' as const,
    },
    {
      id: 'engagement',
      title: 'Engagement Score',
      value: `${metrics.engagementScore}/100`,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'info' as const,
      trend: metrics.engagementScore >= 75 ? 'up' as const : 'down' as const,
    },
    {
      id: 'satisfaction',
      title: 'Satisfaction Rate',
      value: `${metrics.satisfactionRate}%`,
      icon: <Star className="w-5 h-5" />,
      color: 'purple' as const,
      trend: metrics.satisfactionRate >= 80 ? 'up' as const : 'down' as const,
    },
    {
      id: 'retention',
      title: 'Retention Rate',
      value: `${metrics.retentionRate}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'secondary' as const,
      trend: metrics.retentionRate >= 60 ? 'up' as const : 'down' as const,
    },
  ];

  return (
    <div className={cn(
      'grid gap-4 grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {performanceStats.map((stat) => (
        <DashboardStatCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
          isLoading={isLoading}
          className="min-h-[130px]"
        />
      ))}
    </div>
  );
};
