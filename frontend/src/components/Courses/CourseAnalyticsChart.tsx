import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseAnalyticsChartProps } from "@/types/course-management";

const CourseAnalyticsChart: React.FC<CourseAnalyticsChartProps> = ({
  data,
  type,
  timeRange,
  height = 300,
  className
}) => {
  const chartConfig = useMemo(() => {
    switch (type) {
      case 'enrollment':
        return {
          title: 'Enrollment Trends',
          icon: <Users className="w-5 h-5 text-brand-primary" />,
          dataKey: 'enrollmentCount',
          color: '#22C55E',
          gradientId: 'enrollmentGradient',
          format: (value: number) => value.toLocaleString()
        };
      case 'revenue':
        return {
          title: 'Revenue Trends',
          icon: <DollarSign className="w-5 h-5 text-brand-primary" />,
          dataKey: 'totalRevenue',
          color: '#10B981',
          gradientId: 'revenueGradient',
          format: (value: number) => `$${value.toLocaleString()}`
        };
      case 'rating':
        return {
          title: 'Rating Trends',
          icon: <Star className="w-5 h-5 text-brand-primary" />,
          dataKey: 'averageRating',
          color: '#F59E0B',
          gradientId: 'ratingGradient',
          format: (value: number) => value.toFixed(1)
        };
      case 'completion':
        return {
          title: 'Completion Rate Trends',
          icon: <Award className="w-5 h-5 text-brand-primary" />,
          dataKey: 'completionRate',
          color: '#8B5CF6',
          gradientId: 'completionGradient',
          format: (value: number) => `${value.toFixed(1)}%`
        };
      default:
        return {
          title: 'Analytics',
          icon: <TrendingUp className="w-5 h-5 text-brand-primary" />,
          dataKey: 'value',
          color: '#22C55E',
          gradientId: 'defaultGradient',
          format: (value: number) => value.toString()
        };
    }
  }, [type]);

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      index,
      formattedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(timeRange === 'year' && { year: 'numeric' })
      })
    }));
  }, [data, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-sm" style={{ color: chartConfig.color }}>
              <span className="font-medium">{chartConfig.title}:</span>{' '}
              {chartConfig.format(payload[0]?.value || 0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const averageValue = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[chartConfig.dataKey as keyof typeof item] as number || 0), 0);
    return sum / data.length;
  }, [data, chartConfig.dataKey]);

  const totalValue = useMemo(() => {
    return data.reduce((acc, item) => acc + (item[chartConfig.dataKey as keyof typeof item] as number || 0), 0);
  }, [data, chartConfig.dataKey]);

  const renderChart = () => {
    if (type === 'enrollment' || type === 'revenue') {
      return (
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id={chartConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartConfig.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartConfig.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={chartConfig.format}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey={chartConfig.dataKey}
            stroke={chartConfig.color}
            strokeWidth={2}
            fill={`url(#${chartConfig.gradientId})`}
            dot={{ fill: chartConfig.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: chartConfig.color, strokeWidth: 2 }}
          />
        </AreaChart>
      );
    } else if (type === 'rating' || type === 'completion') {
      return (
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={chartConfig.format}
            domain={type === 'rating' ? [0, 5] : [0, 100]}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line
            type="monotone"
            dataKey={chartConfig.dataKey}
            stroke={chartConfig.color}
            strokeWidth={3}
            dot={{ fill: chartConfig.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: chartConfig.color, strokeWidth: 2 }}
          />
        </LineChart>
      );
    }

    return null;
  };

  if (data.length === 0) {
    return (
      <Card className={cn("dashboard-card", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {chartConfig.icon}
            {chartConfig.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No data available for the selected period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {chartConfig.icon}
          {chartConfig.title}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Average:</span> {chartConfig.format(averageValue)}
          </div>
          {(type === 'enrollment' || type === 'revenue') && (
            <div>
              <span className="font-medium">Total:</span> {chartConfig.format(totalValue)}
            </div>
          )}
          <div>
            <span className="font-medium">Period:</span> {timeRange}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CourseAnalyticsChart;
