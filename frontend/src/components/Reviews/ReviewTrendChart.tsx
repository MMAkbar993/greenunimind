import { useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewTrendChartProps } from "@/types/review";

const ReviewTrendChart: React.FC<ReviewTrendChartProps> = ({
  data,
  height = 300,
  className
}) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: new Date(item.period).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-brand-primary">
              <span className="font-medium">Rating:</span> {payload[0]?.value?.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Reviews:</span> {payload[1]?.value || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const averageRating = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.averageRating, 0) / data.length;
  }, [data]);

  const totalReviews = useMemo(() => {
    return data.reduce((sum, item) => sum + item.totalReviews, 0);
  }, [data]);

  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-primary" />
          Review Trends
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Avg Rating:</span> {averageRating.toFixed(1)}
          </div>
          <div>
            <span className="font-medium">Total Reviews:</span> {totalReviews.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No trend data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reviewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
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
                yAxisId="rating"
                orientation="left"
                domain={[0, 5]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              
              <YAxis 
                yAxisId="reviews"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                yAxisId="rating"
                type="monotone"
                dataKey="averageRating"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#ratingGradient)"
                dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#22C55E', strokeWidth: 2 }}
              />
              
              <Line
                yAxisId="reviews"
                type="monotone"
                dataKey="totalReviews"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewTrendChart;
