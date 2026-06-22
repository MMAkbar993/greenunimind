import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Clock,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialAnalyticsDashboardProps {
  earnings?: {
    total: number;
    monthly: number;
    weekly: number;
    yearly: number;
    daily: number;
    growth: {
      monthly: number;
      weekly: number;
      yearly: number;
    };
  };
  transactions?: Array<{
    id: string;
    date: string;
    amount: number;
    courseTitle: string;
    studentName: string;
    status: string;
    type: 'sale' | 'payout' | 'refund';
  }>;
  payouts?: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    method: string;
  }>;
  analytics?: {
    conversionRate: number;
    averageOrderValue: number;
    totalStudents: number;
    activeCourses: number;
    topPerformingCourses: Array<{
      id: string;
      title: string;
      revenue: number;
      enrollments: number;
    }>;
  };
  isLoading?: boolean;
  onRefresh: () => void;
  onExportData: (type: 'earnings' | 'transactions' | 'payouts') => void;
  className?: string;
}

const FinancialAnalyticsDashboard: React.FC<FinancialAnalyticsDashboardProps> = ({
  earnings,
  transactions = [],
  payouts = [],
  analytics,
  isLoading = false,
  onRefresh,
  onExportData,
  className
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? ArrowUpRight : ArrowDownRight;
  };

  const earningsCards = useMemo(() => [
    {
      title: 'Total Earnings',
      value: formatCurrency(earnings?.total || 0),
      growth: earnings?.growth?.yearly || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      period: 'All time'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(earnings?.monthly || 0),
      growth: earnings?.growth?.monthly || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      period: 'This month'
    },
    {
      title: 'Weekly Revenue',
      value: formatCurrency(earnings?.weekly || 0),
      growth: earnings?.growth?.weekly || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      period: 'This week'
    },
    {
      title: 'Daily Average',
      value: formatCurrency(earnings?.daily || 0),
      growth: 0, // Calculate based on previous day
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      period: 'Today'
    }
  ], [earnings]);

  const analyticsCards = useMemo(() => [
    {
      title: 'Conversion Rate',
      value: `${analytics?.conversionRate || 0}%`,
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Avg. Order Value',
      value: formatCurrency(analytics?.averageOrderValue || 0),
      icon: CreditCard,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Total Students',
      value: analytics?.totalStudents?.toLocaleString() || '0',
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Active Courses',
      value: analytics?.activeCourses?.toString() || '0',
      icon: BarChart3,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ], [analytics]);

  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

  const getTransactionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Loading skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="w-20 h-6 bg-gray-100 rounded animate-pulse" />
                  <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Analytics</h2>
          <p className="text-gray-600">Track your earnings, transactions, and financial performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {earningsCards.map((card, index) => {
          const CardIcon = card.icon;
          const GrowthIcon = getGrowthIcon(card.growth);
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.bgColor)}>
                    <CardIcon className={cn("w-5 h-5", card.color)} />
                  </div>
                  {card.growth !== 0 && (
                    <div className={cn("flex items-center gap-1 text-sm", getGrowthColor(card.growth))}>
                      <GrowthIcon className="w-3 h-3" />
                      {formatPercentage(card.growth)}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.period}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {analyticsCards.map((card, index) => {
              const CardIcon = card.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.bgColor)}>
                        <CardIcon className={cn("w-5 h-5", card.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-xl font-bold text-gray-900">{card.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Top Performing Courses */}
          {analytics?.topPerformingCourses && analytics.topPerformingCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Top Performing Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformingCourses.slice(0, 5).map((course, index) => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-sm text-gray-600">{course.enrollments} enrollments</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(course.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportData('transactions')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.courseTitle}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.studentName} • {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getTransactionStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <p className="font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No transactions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payout History</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportData('payouts')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts.length > 0 ? (
                  payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Payout to {payout.method}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(payout.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPayoutStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                        <p className="font-bold text-gray-900">{formatCurrency(payout.amount)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No payouts found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Revenue chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Performance chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAnalyticsDashboard;
