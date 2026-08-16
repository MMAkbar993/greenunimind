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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import {
  useGetTeacherInvoicesQuery,
  useGetTeacherInvoiceStatsQuery,
  useResendInvoiceEmailMutation,
  useDownloadInvoicePdfMutation,
  useCheckStripeAccountStatusQuery,
  useGetInvoicePreferencesQuery,
  useUpdateInvoicePreferencesMutation
} from '@/redux/features/payment/payment.api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TeacherInvoiceManagement: React.FC = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  
  const [activeTab, setActiveTab] = useState('invoices');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Get Stripe account status
  const { data: stripeStatus } = useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });

  // Get teacher invoices (auto-generated from completed transactions)
  const {
    data: invoicesData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useGetTeacherInvoicesQuery(teacherId, { skip: !teacherId });

  // Get invoice statistics
  const {
    data: invoiceStats,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useGetTeacherInvoiceStatsQuery({ teacherId, period: selectedPeriod }, { skip: !teacherId });

  // Mutations
  const [resendInvoiceEmail] = useResendInvoiceEmailMutation();
  const [downloadInvoicePdf] = useDownloadInvoicePdfMutation();

  // Invoice preferences (Settings tab)
  const { data: preferencesData } = useGetInvoicePreferencesQuery(teacherId, { skip: !teacherId });
  const [updateInvoicePreferences, { isLoading: isSavingPreferences }] = useUpdateInvoicePreferencesMutation();
  const preferences = preferencesData?.data;
  const [businessNameDraft, setBusinessNameDraft] = useState('');
  const [isEditingBusinessName, setIsEditingBusinessName] = useState(false);

  const handleTogglePreference = async (key: 'autoGenerate' | 'emailNotificationsEnabled', value: boolean) => {
    try {
      await updateInvoicePreferences({ teacherId, [key]: value }).unwrap();
      toast.success('Preference updated');
    } catch (error) {
      toast.error('Failed to update preference');
    }
  };

  const handleSaveBusinessName = async () => {
    try {
      await updateInvoicePreferences({ teacherId, businessName: businessNameDraft }).unwrap();
      toast.success('Invoice template updated');
      setIsEditingBusinessName(false);
    } catch (error) {
      toast.error('Failed to update invoice template');
    }
  };

  const isStripeConnected = stripeStatus?.data?.isConnected;
  const isStripeVerified = stripeStatus?.data?.isVerified;

  const invoices = invoicesData?.data || [];

  const handleRefresh = () => {
    refetchTransactions();
    refetchStats();
  };

  const handleResendEmail = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv: any) => inv.invoiceId === invoiceId);
      if (invoice) {
        await resendInvoiceEmail(invoice.transactionId).unwrap();
        toast.success('Invoice email sent');
      }
    } catch (error) {
      toast.error('Failed to resend invoice email');
    }
  };

  const fetchInvoiceBlob = async (transactionId: string) => {
    const result = await downloadInvoicePdf(transactionId).unwrap();
    if (!(result instanceof Blob)) {
      throw new Error((result as { message?: string })?.message || 'Failed to generate invoice PDF.');
    }
    return result;
  };

  const handleViewInvoice = async (transactionId: string) => {
    try {
      const blob = await fetchInvoiceBlob(transactionId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      toast.error('Failed to open invoice');
    }
  };

  const handleDownloadInvoice = async (transactionId: string, invoiceId: string) => {
    try {
      const blob = await fetchInvoiceBlob(transactionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download invoice');
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
              onViewInvoice={handleViewInvoice}
              onDownloadInvoice={handleDownloadInvoice}
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
                    <Switch
                      checked={preferences?.autoGenerate ?? true}
                      disabled={isSavingPreferences}
                      onCheckedChange={(checked) => handleTogglePreference('autoGenerate', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Send invoice emails to students automatically</p>
                    </div>
                    <Switch
                      checked={preferences?.emailNotificationsEnabled ?? true}
                      disabled={isSavingPreferences}
                      onCheckedChange={(checked) => handleTogglePreference('emailNotificationsEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Invoice Template</h4>
                      <p className="text-sm text-gray-600">Customize the business name shown on your invoices</p>
                      {isEditingBusinessName ? (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex-1 max-w-sm">
                            <Label htmlFor="businessName" className="sr-only">Business name</Label>
                            <Input
                              id="businessName"
                              placeholder="GreenUniMind AI"
                              value={businessNameDraft}
                              onChange={(e) => setBusinessNameDraft(e.target.value)}
                            />
                          </div>
                          <Button size="sm" onClick={handleSaveBusinessName} disabled={isSavingPreferences}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingBusinessName(false)}
                            disabled={isSavingPreferences}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : preferences?.businessName ? (
                        <p className="text-sm text-gray-900 font-medium mt-1">"{preferences.businessName}"</p>
                      ) : null}
                    </div>
                    {!isEditingBusinessName && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBusinessNameDraft(preferences?.businessName || '');
                          setIsEditingBusinessName(true);
                        }}
                      >
                        Customize
                      </Button>
                    )}
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
