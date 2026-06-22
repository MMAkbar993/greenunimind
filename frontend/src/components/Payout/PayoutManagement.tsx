import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  RefreshCw,
  Settings,
  Info,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: string;
  destination: string;
  requestedDate: string;
  processedDate?: string;
  estimatedArrival?: string;
  description?: string;
  transactionIds: string[];
  fees?: number;
}

interface PayoutSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  minimumAmount: number;
  nextPayoutDate?: string;
}

interface PayoutManagementProps {
  payouts: Payout[];
  availableBalance: number;
  pendingBalance: number;
  schedule: PayoutSchedule;
  isLoading?: boolean;
  onRequestPayout: (amount: number) => void;
  onUpdateSchedule: (schedule: PayoutSchedule) => void;
  onRefresh: () => void;
  isRequestingPayout?: boolean;
  className?: string;
}

const PayoutManagement: React.FC<PayoutManagementProps> = ({
  payouts,
  availableBalance,
  pendingBalance,
  schedule,
  isLoading = false,
  onRequestPayout,
  onUpdateSchedule,
  onRefresh,
  isRequestingPayout = false,
  className
}) => {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstimatedArrival = (status: string, processedDate?: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'failed' || status === 'cancelled') return 'N/A';
    
    if (processedDate) {
      const processed = new Date(processedDate);
      const estimated = new Date(processed.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
      return estimated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return '1-2 business days';
  };

  const handleRequestPayout = () => {
    const amount = customAmount ? parseFloat(customAmount) : availableBalance;
    if (amount > 0 && amount <= availableBalance) {
      onRequestPayout(amount);
      setCustomAmount('');
    }
  };

  const recentPayouts = payouts
    .sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())
    .slice(0, 5);

  const payoutStats = {
    totalPayouts: payouts.length,
    completedPayouts: payouts.filter(p => p.status === 'completed').length,
    totalPaidOut: payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    averageAmount: payouts.length > 0 
      ? payouts.reduce((sum, p) => sum + p.amount, 0) / payouts.length 
      : 0,
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="w-16 h-6 bg-gray-100 rounded animate-pulse" />
                  </div>
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
          <h2 className="text-2xl font-bold text-gray-900">Payout Management</h2>
          <p className="text-gray-600">Manage your earnings and payout schedule</p>
        </div>
        
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Available Balance</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(availableBalance)}</p>
                <p className="text-xs text-green-600">Ready for payout</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-800">{formatCurrency(pendingBalance)}</p>
                <p className="text-xs text-yellow-600">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Paid Out</p>
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(payoutStats.totalPaidOut)}</p>
                <p className="text-xs text-blue-600">{payoutStats.completedPayouts} payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Payout Action */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Request Payout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    placeholder={`Max: ${formatCurrency(availableBalance)}`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-10"
                    max={availableBalance}
                    min={schedule.minimumAmount}
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-end gap-2">
                <Button
                  onClick={() => setCustomAmount(availableBalance.toString())}
                  variant="outline"
                  size="sm"
                  disabled={availableBalance <= 0}
                >
                  Max Amount
                </Button>
                <Button
                  onClick={handleRequestPayout}
                  disabled={
                    isRequestingPayout || 
                    availableBalance <= 0 || 
                    (customAmount && parseFloat(customAmount) > availableBalance) ||
                    (customAmount && parseFloat(customAmount) < schedule.minimumAmount)
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isRequestingPayout ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>
              </div>
            </div>

            {availableBalance < schedule.minimumAmount && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Minimum payout amount is {formatCurrency(schedule.minimumAmount)}. 
                  Current available balance: {formatCurrency(availableBalance)}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-600">
              <p>• Payouts typically arrive in 1-2 business days</p>
              <p>• Minimum payout amount: {formatCurrency(schedule.minimumAmount)}</p>
              <p>• Next automatic payout: {schedule.nextPayoutDate ? formatDate(schedule.nextPayoutDate) : 'Not scheduled'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Payouts</p>
                    <p className="text-xl font-bold text-gray-900">{payoutStats.totalPayouts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-xl font-bold text-green-600">{payoutStats.completedPayouts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Amount</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(payoutStats.averageAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Schedule</p>
                    <p className="text-xl font-bold text-orange-600 capitalize">{schedule.frequency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayouts.length > 0 ? (
                <div className="space-y-4">
                  {recentPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{formatCurrency(payout.amount)}</p>
                            <Badge className={cn("text-xs border", getStatusColor(payout.status))}>
                              {getStatusIcon(payout.status)}
                              <span className="ml-1 capitalize">{payout.status}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {payout.method} • {formatDate(payout.requestedDate)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Estimated arrival: {getEstimatedArrival(payout.status, payout.processedDate)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <ArrowUpRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No payouts yet</p>
                  <p className="text-sm">Your payout history will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payout History</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payouts.length > 0 ? (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{formatCurrency(payout.amount)}</p>
                            <Badge className={cn("text-xs border", getStatusColor(payout.status))}>
                              {getStatusIcon(payout.status)}
                              <span className="ml-1 capitalize">{payout.status}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {payout.method} • Requested: {formatDate(payout.requestedDate)}
                          </p>
                          {payout.processedDate && (
                            <p className="text-xs text-gray-500">
                              Processed: {formatDate(payout.processedDate)}
                            </p>
                          )}
                          {payout.description && (
                            <p className="text-xs text-gray-500">{payout.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {payout.transactionIds.length} transaction{payout.transactionIds.length !== 1 ? 's' : ''}
                        </p>
                        {payout.fees && (
                          <p className="text-xs text-gray-500">Fee: {formatCurrency(payout.fees)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No payout history</p>
                  <p className="text-sm">Your completed payouts will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Payout Schedule Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Frequency
                  </label>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => onUpdateSchedule({
                      ...schedule,
                      frequency: e.target.value as PayoutSchedule['frequency']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="manual">Manual (Request when needed)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Payout Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={schedule.minimumAmount}
                      onChange={(e) => onUpdateSchedule({
                        ...schedule,
                        minimumAmount: parseFloat(e.target.value) || 0
                      })}
                      className="pl-10"
                      min={1}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Payouts will only be processed when your balance reaches this amount
                  </p>
                </div>

                {schedule.nextPayoutDate && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Next automatic payout:</strong> {formatDate(schedule.nextPayoutDate)}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => onUpdateSchedule(schedule)}
                    className="w-full sm:w-auto"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Update Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayoutManagement;
