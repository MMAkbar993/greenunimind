import React from 'react';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FinancialSummaryProps {
  earnings?: {
    total: number;
    monthly: number;
    weekly: number;
    yearly: number;
  };
  upcomingPayout?: {
    amount: number;
    date: string;
    status: string;
  };
  isLoading?: boolean;
  onRequestPayout: () => void;
  onRefresh?: () => void;
  isRequestingPayout?: boolean;
  isRefreshing?: boolean;
  stripeConnected?: boolean;
  className?: string;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  earnings,
  upcomingPayout,
  isLoading = false,
  onRequestPayout,
  onRefresh,
  isRequestingPayout = false,
  isRefreshing = false,
  stripeConnected = false,
  className
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="financial-summary-card">
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
    );
  }

  const financialCards = [
    {
      title: "Total Earnings",
      value: formatCurrency(earnings?.total || 0),
      icon: DollarSign,
      change: `+${formatCurrency(earnings?.monthly || 0)} this month`,
      trend: "up",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Monthly Earnings",
      value: formatCurrency(earnings?.monthly || 0),
      icon: TrendingUp,
      change: `${formatCurrency(earnings?.weekly || 0)} this week`,
      trend: "up",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Available Balance",
      value: formatCurrency(upcomingPayout?.amount || 0),
      icon: Wallet,
      change: upcomingPayout?.date ? `Next payout: ${formatDate(upcomingPayout.date)}` : "No pending payout",
      trend: upcomingPayout?.amount ? "up" : "neutral",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Payout Status",
      value: upcomingPayout?.status ? upcomingPayout.status.charAt(0).toUpperCase() + upcomingPayout.status.slice(1) : "None",
      icon: Clock,
      change: upcomingPayout?.date ? formatDate(upcomingPayout.date) : "No scheduled payout",
      trend: "neutral",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
          <p className="text-sm text-gray-600">Real-time earnings and payout information</p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        )}
      </div>

      {/* Financial Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financialCards.map((card, index) => {
          const CardIcon = card.icon;
          return (
            <Card key={index} className="financial-summary-card hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.bgColor)}>
                    <CardIcon className={cn("w-5 h-5", card.color)} />
                  </div>
                  {card.trend === "up" && (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  )}
                  {card.trend === "down" && (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.change}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payout Action Card */}
      {stripeConnected && (
        <Card className="payout-action-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5 text-green-600" />
              Payout Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">Available for Payout</h3>
                  {upcomingPayout?.status && (
                    <Badge className={cn("text-xs", getPayoutStatusColor(upcomingPayout.status))}>
                      {upcomingPayout.status}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {formatCurrency(upcomingPayout?.amount || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  {upcomingPayout?.date 
                    ? `Next automatic payout: ${formatDate(upcomingPayout.date)}`
                    : "No automatic payout scheduled"
                  }
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={onRequestPayout}
                  disabled={isRequestingPayout || !upcomingPayout?.amount || upcomingPayout.amount <= 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isRequestingPayout ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialSummary;
