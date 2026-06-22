import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  RefreshCw,
  AlertCircle,
  Calendar,
  Settings,
  PieChart
} from 'lucide-react';
import FinancialAnalyticsDashboard from '@/components/Analytics/FinancialAnalyticsDashboard';
import { useFinancialAnalytics, useFinancialDataExport } from '@/hooks/useFinancialAnalytics';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useCheckStripeAccountStatusQuery } from '@/redux/features/payment/payment.api';
import { cn } from '@/lib/utils';

const FinancialAnalytics: React.FC = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  
  const [activeTab, setActiveTab] = useState('dashboard');

  // Get Stripe account status
  const { data: stripeStatus } = useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });

  // Get financial analytics data
  const {
    earnings,
    transactions,
    payouts,
    analytics,
    isLoading,
    error,
    refetch
  } = useFinancialAnalytics('30d');

  // Export functionality
  const { exportData, isExporting } = useFinancialDataExport();

  const handleExportData = async (type: 'earnings' | 'transactions' | 'payouts') => {
    try {
      await exportData(type, 'csv');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isStripeConnected = stripeStatus?.data?.isConnected;
  const isStripeVerified = stripeStatus?.data?.isVerified;

  // Show setup message if Stripe is not connected
  if (!isStripeConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Analytics</h1>
              <p className="text-lg text-gray-600">
                Track your earnings, analyze performance, and manage your financial data
              </p>
            </div>

            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Stripe account to start tracking your financial analytics and earnings data.
              </AlertDescription>
            </Alert>

            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/teacher/stripe-connect">
                <DollarSign className="w-4 h-4 mr-2" />
                Connect Stripe Account
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into your earnings, transactions, and financial performance
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={refetch}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Refresh Data
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExportData('earnings')}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stripe Status Alert */}
        {isStripeConnected && !isStripeVerified && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-yellow-800">
                  Your Stripe account is connected but pending verification. Some features may be limited.
                </span>
                <Button variant="outline" size="sm" asChild>
                  <a href="/teacher/stripe-connect">
                    Complete Setup
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Detailed</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <FinancialAnalyticsDashboard
              earnings={earnings}
              transactions={transactions}
              payouts={payouts}
              analytics={analytics}
              isLoading={isLoading}
              onRefresh={refetch}
              onExportData={handleExportData}
            />
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Detailed Earnings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Earnings Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">Total Lifetime Earnings</span>
                      <span className="text-xl font-bold text-green-600">
                        ${earnings.total.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">This Year</p>
                        <p className="text-lg font-bold text-blue-800">
                          ${earnings.yearly.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">This Month</p>
                        <p className="text-lg font-bold text-purple-800">
                          ${earnings.monthly.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">This Week</p>
                        <p className="text-lg font-bold text-orange-800">
                          ${earnings.weekly.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-600 font-medium">Daily Avg</p>
                        <p className="text-lg font-bold text-indigo-800">
                          ${earnings.daily.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium text-gray-700">Average Order Value</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${analytics.averageOrderValue.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium text-gray-700">Total Students</span>
                      <span className="text-lg font-bold text-gray-900">
                        {analytics.totalStudents.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium text-gray-700">Active Courses</span>
                      <span className="text-lg font-bold text-gray-900">
                        {analytics.activeCourses}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium text-gray-700">Conversion Rate</span>
                      <span className="text-lg font-bold text-gray-900">
                        {analytics.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Recent Financial Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.courseTitle}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.studentName} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${transaction.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                      </div>
                    </div>
                  ))}
                  
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No recent transactions
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleExportData('earnings')}
                    disabled={isExporting}
                  >
                    <Download className="w-6 h-6" />
                    <span>Earnings Report</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleExportData('transactions')}
                    disabled={isExporting}
                  >
                    <Download className="w-6 h-6" />
                    <span>Transaction Report</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleExportData('payouts')}
                    disabled={isExporting}
                  >
                    <Download className="w-6 h-6" />
                    <span>Payout Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Real-time Updates</h4>
                      <p className="text-sm text-gray-600">Enable real-time earnings updates</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Reports</h4>
                      <p className="text-sm text-gray-600">Receive weekly financial summaries</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Setup
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Data Export</h4>
                      <p className="text-sm text-gray-600">Configure automatic data exports</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FinancialAnalytics;
