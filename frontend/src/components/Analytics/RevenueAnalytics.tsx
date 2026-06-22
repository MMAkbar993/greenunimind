import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useValidatedTeacherId } from '@/hooks/useValidatedTeacherId';
import { useGetRevenueAnalyticsQuery } from '@/redux/features/analytics/analyticsApi';
import { AnalyticsFilters } from '@/types/analytics';
import { CreditCard, DollarSign, Target, TrendingUp } from 'lucide-react';
import React from 'react';

interface RevenueAnalyticsProps {
  filters: AnalyticsFilters;
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ filters }) => {
  const { teacherId, isValidTeacherId, shouldSkipQuery } = useValidatedTeacherId();

  const {
    data: revenueData,
    isLoading: isRevenueLoading,
    error: revenueError,
  } = useGetRevenueAnalyticsQuery(
    { teacherId: teacherId || '', filters },
    { skip: shouldSkipQuery }
  );

  const revenue = revenueData?.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isRevenueLoading ? '...' : `$${(revenue?.totalRevenue || 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenue?.growthRate
                ? `${revenue.growthRate > 0 ? '+' : ''}${revenue.growthRate}% from last month`
                : 'No growth data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isRevenueLoading
                ? '...'
                : `${revenue?.monthlyGrowth > 0 ? '+' : ''}${(revenue?.monthlyGrowth || 0).toFixed(
                    1
                  )}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenue?.monthlyGrowthChange
                ? `${
                    revenue.monthlyGrowthChange > 0 ? '+' : ''
                  }${revenue.monthlyGrowthChange.toFixed(1)}% from last month`
                : 'No change data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isRevenueLoading ? '...' : `$${(revenue?.averageOrderValue || 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenue?.averageOrderValueChange
                ? `${revenue.averageOrderValueChange > 0 ? '+' : ''}$${Math.abs(
                    revenue.averageOrderValueChange
                  ).toFixed(2)} from last month`
                : 'No change data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isRevenueLoading ? '...' : `${(revenue?.conversionRate || 0).toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenue?.conversionRateChange
                ? `${
                    revenue.conversionRateChange > 0 ? '+' : ''
                  }${revenue.conversionRateChange.toFixed(1)}% from last month`
                : 'No change data available'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Revenue Analytics Dashboard</p>
              <p className="text-sm">Detailed revenue analytics will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAnalytics;
