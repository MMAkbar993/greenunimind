import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wallet,
  AlertCircle,
  RefreshCw,
  Plus,
  Settings,
  CreditCard
} from 'lucide-react';
import PayoutManagement from '@/components/Payout/PayoutManagement';
import PayoutRequestModal from '@/components/Payout/PayoutRequestModal';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import {
  useGetUpcomingPayoutQuery,
  useGetTeacherEarningsQuery,
  useCreatePayoutRequestMutation,
  useCheckStripeAccountStatusQuery
} from '@/redux/features/payment/payment.api';
import { cn } from '@/lib/utils';

const TeacherPayoutManagement: React.FC = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Get Stripe account status
  const { data: stripeStatus } = useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });

  // Get earnings and payout data
  const {
    isLoading: isEarningsLoading,
    refetch: refetchEarnings
  } = useGetTeacherEarningsQuery(teacherId, { skip: !teacherId });

  const {
    data: upcomingPayoutData,
    isLoading: isPayoutLoading,
    refetch: refetchPayout
  } = useGetUpcomingPayoutQuery(teacherId, { skip: !teacherId });

  // Mutations
  const [createPayoutRequest, { isLoading: isCreatingPayout }] = useCreatePayoutRequestMutation();

  const isStripeConnected = stripeStatus?.data?.isConnected;
  const isStripeVerified = stripeStatus?.data?.isVerified;

  // Mock data for demonstration - in real app, this would come from API
  const mockPayouts = [
    {
      id: '1',
      amount: 1250.00,
      status: 'completed' as const,
      method: 'Bank Account',
      destination: '****1234',
      requestedDate: '2024-01-15T10:00:00Z',
      processedDate: '2024-01-16T14:30:00Z',
      transactionIds: ['tx1', 'tx2', 'tx3'],
      fees: 12.50
    },
    {
      id: '2',
      amount: 850.00,
      status: 'processing' as const,
      method: 'Bank Account',
      destination: '****1234',
      requestedDate: '2024-01-20T09:15:00Z',
      transactionIds: ['tx4', 'tx5'],
      fees: 8.50
    },
    {
      id: '3',
      amount: 2100.00,
      status: 'pending' as const,
      method: 'Bank Account',
      destination: '****1234',
      requestedDate: '2024-01-22T16:45:00Z',
      transactionIds: ['tx6', 'tx7', 'tx8', 'tx9'],
      fees: 21.00
    }
  ];

  const mockPayoutMethods = [
    {
      id: 'bank1',
      type: 'bank_account' as const,
      name: 'Chase Bank',
      details: 'Checking ****1234',
      isDefault: true,
      estimatedDays: 2,
      fees: 0.01 // 1%
    },
    {
      id: 'debit1',
      type: 'debit_card' as const,
      name: 'Visa Debit',
      details: '****5678',
      isDefault: false,
      estimatedDays: 1,
      fees: 0.015 // 1.5%
    }
  ];

  const mockSchedule = {
    frequency: 'weekly' as const,
    dayOfWeek: 1, // Monday
    minimumAmount: 50,
    nextPayoutDate: '2024-01-29T10:00:00Z'
  };

  const availableBalance = upcomingPayoutData?.data?.amount || 0;
  const pendingBalance = mockPayouts
    .filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleRefresh = () => {
    refetchEarnings();
    refetchPayout();
  };

  const handleRequestPayout = async (amount: number) => {
    if (!teacherId) return;
    
    try {
      await createPayoutRequest({ 
        teacherId, 
        amount 
      }).unwrap();
      
      // Close modal and refresh data
      setIsPayoutModalOpen(false);
      handleRefresh();
      
      console.log('Payout request created successfully');
    } catch (error) {
      console.error('Failed to create payout request:', error);
    }
  };

  const handlePayoutModalRequest = async (data: {
    amount: number;
    methodId: string;
    description?: string;
  }) => {
    await handleRequestPayout(data.amount);
  };

  const handleUpdateSchedule = (schedule: any) => {
    // This would call an API to update the payout schedule
    console.log('Updating payout schedule:', schedule);
  };

  // Show setup message if Stripe is not connected
  if (!isStripeConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payout Management</h1>
              <p className="text-lg text-gray-600">
                Manage your earnings and payout preferences
              </p>
            </div>

            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Stripe account to start receiving payouts from your course sales.
              </AlertDescription>
            </Alert>

            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/teacher/stripe-connect">
                <CreditCard className="w-4 h-4 mr-2" />
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
            <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your earnings, request payouts, and configure payout preferences
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isEarningsLoading || isPayoutLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", (isEarningsLoading || isPayoutLoading) && "animate-spin")} />
              Refresh
            </Button>
            
            <Button
              onClick={() => setIsPayoutModalOpen(true)}
              disabled={availableBalance <= 0}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Request Payout
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
                  Your Stripe account is connected but pending verification. Payouts may be delayed.
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

        {/* Main Payout Management Component */}
        <PayoutManagement
          payouts={mockPayouts}
          availableBalance={availableBalance}
          pendingBalance={pendingBalance}
          schedule={mockSchedule}
          isLoading={isEarningsLoading || isPayoutLoading}
          onRequestPayout={handleRequestPayout}
          onUpdateSchedule={handleUpdateSchedule}
          onRefresh={handleRefresh}
          isRequestingPayout={isCreatingPayout}
        />

        {/* Payout Request Modal */}
        <PayoutRequestModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          onSubmit={handlePayoutModalRequest}
          availableBalance={availableBalance}
          minimumAmount={mockSchedule.minimumAmount}
          payoutMethods={mockPayoutMethods}
          isLoading={isCreatingPayout}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Payout Settings</h3>
                  <p className="text-sm text-gray-600">Configure automatic payouts and preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                  <p className="text-sm text-gray-600">Manage your bank accounts and cards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Earnings History</h3>
                  <p className="text-sm text-gray-600">View detailed earnings and transaction history</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                If you have questions about payouts, processing times, or fees, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                  <a href="/help/payouts" target="_blank" rel="noopener noreferrer">
                    Payout Guide
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/support" target="_blank" rel="noopener noreferrer">
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherPayoutManagement;
