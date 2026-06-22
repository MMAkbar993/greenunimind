import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  BarChart3,
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import InvoiceManagement from '@/components/Invoice/InvoiceManagement';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import {
  useGetTeacherTransactionsQuery,
  useGetTeacherInvoiceStatsQuery,
  useResendInvoiceEmailMutation,
  useGenerateInvoiceMutation,
  useCheckStripeAccountStatusQuery
} from '@/redux/features/payment/payment.api';
import { cn } from '@/lib/utils';

const TeacherInvoiceManagement: React.FC = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  
  const [activeTab, setActiveTab] = useState('invoices');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Get Stripe account status
  const { data: stripeStatus } = useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });

  // Get teacher transactions (which include invoice data)
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useGetTeacherTransactionsQuery({ teacherId, period: selectedPeriod }, { skip: !teacherId });

  // Get invoice statistics
  const {
    data: invoiceStats,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useGetTeacherInvoiceStatsQuery({ teacherId, period: selectedPeriod }, { skip: !teacherId });

  // Mutations
  const [resendInvoiceEmail] = useResendInvoiceEmailMutation();
  const [generateInvoice] = useGenerateInvoiceMutation();

  const isStripeConnected = stripeStatus?.data?.isConnected;
  const isStripeVerified = stripeStatus?.data?.isVerified;

  // Transform transactions data to invoice format
  const invoices = transactionsData?.data?.map((transaction: any) => ({
    id: transaction._id,
    transactionId: transaction._id,
    invoiceId: transaction.stripeInvoiceId || 'N/A',
    invoiceUrl: transaction.stripeInvoiceUrl || '',
    pdfUrl: transaction.stripePdfUrl || '',
    status: transaction.invoiceStatus || transaction.status || 'paid',
    amount: transaction.teacherEarning || transaction.totalAmount,
    courseTitle: transaction.courseId?.title || 'Unknown Course',
    studentName: `${transaction.studentId?.name?.firstName || ''} ${transaction.studentId?.name?.lastName || ''}`.trim() || 'Unknown Student',
    studentEmail: transaction.studentId?.email || '',
    teacherName: `${userData?.data?.name?.firstName || ''} ${userData?.data?.name?.lastName || ''}`.trim(),
    created: transaction.createdAt,
  })) || [];

  const handleRefresh = () => {
    refetchTransactions();
    refetchStats();
  };

  const handleResendEmail = async (invoiceId: string) => {
    try {
      const transaction = invoices.find((inv: any) => inv.invoiceId === invoiceId);
      if (transaction) {
        await resendInvoiceEmail(transaction.transactionId).unwrap();
        // Show success message (you might want to add a toast notification here)
        console.log('Invoice email resent successfully');
      }
    } catch (error) {
      console.error('Failed to resend invoice email:', error);
    }
  };

  const handleGenerateInvoice = async (transactionId: string) => {
    try {
      const transaction = transactionsData?.data?.find((t: any) => t._id === transactionId);
      if (transaction && teacherId) {
        await generateInvoice({
          transactionId,
          studentId: transaction.studentId._id,
          courseId: transaction.courseId._id,
          amount: transaction.totalAmount,
          teacherStripeAccountId: stripeStatus?.data?.accountId || '',
        }).unwrap();
        
        // Refresh data after generating invoice
        handleRefresh();
        console.log('Invoice generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate invoice:', error);
    }
  };

  // Show setup message if Stripe is not connected
  if (!isStripeConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Management</h1>
              <p className="text-lg text-gray-600">
                Manage and track invoices for your course sales
              </p>
            </div>

            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Stripe account to start generating and managing invoices for your course sales.
              </AlertDescription>
            </Alert>

            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/teacher/stripe-connect">
                <FileText className="w-4 h-4 mr-2" />
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
            <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
            <p className="text-gray-600 mt-1">
              Manage invoices, track payments, and handle billing for your courses
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isTransactionsLoading || isStatsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", (isTransactionsLoading || isStatsLoading) && "animate-spin")} />
              Refresh
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
                  Your Stripe account is connected but pending verification. Invoice generation may be limited.
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

        {/* Invoice Statistics */}
        {invoiceStats?.data && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">{invoiceStats.data.totalInvoices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${invoiceStats.data.totalAmount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Amount</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${invoiceStats.data.averageAmount?.toFixed(0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Period</p>
                    <p className="text-lg font-bold text-orange-600 capitalize">
                      {selectedPeriod.replace('d', ' days').replace('y', ' year')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Invoice List</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            <InvoiceManagement
              invoices={invoices}
              isLoading={isTransactionsLoading}
              onRefresh={handleRefresh}
              onResendEmail={handleResendEmail}
              onGenerateInvoice={handleGenerateInvoice}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Automatic Invoice Generation</h4>
                      <p className="text-sm text-gray-600">Automatically generate invoices for new course purchases</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enabled
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Send invoice emails to students automatically</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Invoice Template</h4>
                      <p className="text-sm text-gray-600">Customize your invoice template and branding</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Customize
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

export default TeacherInvoiceManagement;
