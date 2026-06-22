import { useState, useEffect, useMemo } from 'react';
import { useGetTeacherEarningsQuery, useGetTeacherTransactionsQuery, useGetTeacherPayoutsQuery } from '@/redux/features/payment/payment.api';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { config } from '@/config';

interface FinancialAnalyticsData {
  earnings: {
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
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
    courseTitle: string;
    studentName: string;
    status: string;
    type: 'sale' | 'payout' | 'refund';
  }>;
  payouts: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    method: string;
  }>;
  analytics: {
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
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFinancialAnalytics = (period: string = '30d'): FinancialAnalyticsData => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  const [error, setError] = useState<string | null>(null);

  // Fetch earnings data
  const {
    data: earningsData,
    isLoading: isEarningsLoading,
    error: earningsError,
    refetch: refetchEarnings
  } = useGetTeacherEarningsQuery(teacherId, { 
    skip: !teacherId,
    pollingInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  // Fetch transactions data
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useGetTeacherTransactionsQuery({ teacherId, period }, { 
    skip: !teacherId,
    pollingInterval: 60000, // Poll every minute
  });

  // Fetch payouts data
  const {
    data: payoutsData,
    isLoading: isPayoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts
  } = useGetTeacherPayoutsQuery(teacherId, { 
    skip: !teacherId,
    pollingInterval: 120000, // Poll every 2 minutes
  });

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Process earnings data with growth calculations
  const processedEarnings = useMemo(() => {
    if (!earningsData?.data) {
      return {
        total: 0,
        monthly: 0,
        weekly: 0,
        yearly: 0,
        daily: 0,
        growth: { monthly: 0, weekly: 0, yearly: 0 }
      };
    }

    const data = earningsData.data;
    
    // Calculate daily average from weekly earnings
    const daily = data.weekly / 7;

    // Calculate growth (these would come from API in real implementation)
    const growth = {
      monthly: calculateGrowth(data.monthly, data.previousMonth || 0),
      weekly: calculateGrowth(data.weekly, data.previousWeek || 0),
      yearly: calculateGrowth(data.yearly, data.previousYear || 0),
    };

    return {
      total: data.total || 0,
      monthly: data.monthly || 0,
      weekly: data.weekly || 0,
      yearly: data.yearly || 0,
      daily,
      growth
    };
  }, [earningsData]);

  // Process transactions data
  const processedTransactions = useMemo(() => {
    if (!transactionsData?.data) return [];

    return transactionsData.data.map((transaction: any) => ({
      id: transaction._id,
      date: transaction.createdAt,
      amount: transaction.teacherEarning || transaction.totalAmount,
      courseTitle: transaction.courseId?.title || 'Unknown Course',
      studentName: transaction.studentId?.name || 'Unknown Student',
      status: transaction.status || 'completed',
      type: 'sale' as const
    }));
  }, [transactionsData]);

  // Process payouts data
  const processedPayouts = useMemo(() => {
    if (!payoutsData?.data) return [];

    return payoutsData.data.map((payout: any) => ({
      id: payout._id,
      date: payout.createdAt,
      amount: payout.amount,
      status: payout.status || 'pending',
      method: payout.method || 'Bank Account'
    }));
  }, [payoutsData]);

  // Calculate analytics metrics
  const analytics = useMemo(() => {
    const transactions = processedTransactions;
    const totalTransactions = transactions.length;
    
    // Calculate average order value
    const totalRevenue = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate conversion rate (placeholder - would need more data)
    const conversionRate = 2.5; // This would be calculated from actual visitor/enrollment data

    // Get unique students count
    const uniqueStudents = new Set(transactions.map((t: any) => t.studentName)).size;

    // Calculate top performing courses
    const courseRevenue = transactions.reduce((acc: any, transaction: any) => {
      const courseTitle = transaction.courseTitle;
      if (!acc[courseTitle]) {
        acc[courseTitle] = { revenue: 0, enrollments: 0 };
      }
      acc[courseTitle].revenue += transaction.amount;
      acc[courseTitle].enrollments += 1;
      return acc;
    }, {} as Record<string, { revenue: number; enrollments: number }>);

    const topPerformingCourses = Object.entries(courseRevenue)
      .map(([title, data]: [string, any]) => ({
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        revenue: data.revenue,
        enrollments: data.enrollments
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      conversionRate,
      averageOrderValue,
      totalStudents: uniqueStudents,
      activeCourses: topPerformingCourses.length,
      topPerformingCourses
    };
  }, [processedTransactions]);

  // Combined loading state
  const isLoading = isEarningsLoading || isTransactionsLoading || isPayoutsLoading;

  // Handle errors
  useEffect(() => {
    if (earningsError || transactionsError || payoutsError) {
      const getErrorMessage = (error: any) => {
        if (error?.data?.message) return error.data.message;
        if (error?.message) return error.message;
        if (typeof error === 'string') return error;
        return 'Unknown error occurred';
      };

      const errorMessage =
        getErrorMessage(earningsError) ||
        getErrorMessage(transactionsError) ||
        getErrorMessage(payoutsError) ||
        'Failed to load financial data';
      setError(errorMessage);
    } else {
      setError(null);
    }
  }, [earningsError, transactionsError, payoutsError]);

  // Combined refetch function
  const refetch = () => {
    refetchEarnings();
    refetchTransactions();
    refetchPayouts();
  };

  return {
    earnings: processedEarnings,
    transactions: processedTransactions,
    payouts: processedPayouts,
    analytics,
    isLoading,
    error,
    refetch
  };
};

// Hook for real-time earnings updates
export const useRealTimeEarnings = (teacherId: string) => {
  const [earnings, setEarnings] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!teacherId) return;

    // Set up WebSocket connection for real-time updates
    // This would connect to your backend WebSocket server
    const ws = new WebSocket(`${config.wsBaseUrl}/earnings/${teacherId}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'earnings_update') {
          setEarnings(data.earnings);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [teacherId]);

  return { earnings, lastUpdate };
};

// Hook for exporting financial data
export const useFinancialDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (type: 'earnings' | 'transactions' | 'payouts', format: 'csv' | 'pdf' = 'csv') => {
    setIsExporting(true);
    
    try {
      // This would call your backend API to generate and download the export
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/payments/export/${type}?format=${format}`, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting };
};
