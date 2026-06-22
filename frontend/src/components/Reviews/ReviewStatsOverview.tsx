import { Star, MessageSquare, TrendingUp, Heart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReviewStatsCardProps } from "@/types/review";
import ReviewMetricsCard from "./ReviewMetricsCard";
import RatingDistribution from "./RatingDistribution";
import StarRating from "./StarRating";

const ReviewStatsOverview: React.FC<ReviewStatsCardProps> = ({
  stats,
  isLoading = false,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="w-12 h-6 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsCards = [
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      change: stats.monthlyGrowth,
      changeType: (stats.monthlyGrowth >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' | 'neutral',
      icon: <MessageSquare className="w-5 h-5" />,
      description: `${stats.recentReviews} this month`
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      change: stats.weeklyGrowth,
      changeType: (stats.weeklyGrowth >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' | 'neutral',
      icon: <Star className="w-5 h-5" />,
      description: "Out of 5.0 stars"
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate}%`,
      change: undefined,
      changeType: 'neutral' as 'positive' | 'negative' | 'neutral',
      icon: <Heart className="w-5 h-5" />,
      description: "Reviews responded to"
    },
    {
      title: "Sentiment Score",
      value: `${stats.sentimentScore}%`,
      change: undefined,
      changeType: (stats.sentimentScore >= 70 ? 'positive' : stats.sentimentScore >= 50 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Positive sentiment"
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric, index) => (
          <ReviewMetricsCard
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

      {/* Rating Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Rating Display */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-primary" />
              Overall Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarRating 
                rating={stats.averageRating} 
                size="lg" 
                showValue={false}
                className="justify-center mb-2"
              />
              <p className="text-sm text-gray-600">
                Based on {stats.totalReviews.toLocaleString()} reviews
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="dashboard-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Rating Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RatingDistribution 
              distribution={stats.ratingDistribution}
              totalReviews={stats.totalReviews}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewStatsOverview;
