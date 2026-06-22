import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BarChart, Calendar, DollarSign, Users, Info } from "lucide-react";
import { useGetPayoutInfoQuery, useGetTeacherEarningsQuery } from "@/redux/features/payment/payment.api";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EarningsSummaryProps {
  teacherId: string;
}

const EarningsSummary = ({ teacherId }: EarningsSummaryProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);

  // Get teacher earnings data directly
  const {
    data: earningsData,
    isLoading: isEarningsLoading,
    error: earningsError
  } = useGetTeacherEarningsQuery(teacherId);

  // Get payout info for charts and period-specific data
  const {
    data: payoutInfo,
    isLoading: isPayoutInfoLoading,
    error: payoutError
  } = useGetPayoutInfoQuery({
    teacherId,
    period: selectedPeriod,
  });

  // Get user data to access teacher details
  const { data: userData } = useGetMeQuery(undefined);
  const teacher = userData?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'short' });
  };

  // Define types for the data
  interface MonthlyBreakdown {
    month: string;
    earnings: number;
    coursesSold: number;
  }

  interface CourseSold {
    courseId: {
      _id: string;
      title: string;
      courseThumbnail?: string;
    };
    count: number;
    earnings: number;
  }

  // Prepare chart data
  const chartData = payoutInfo?.monthlyBreakdown?.map((item: MonthlyBreakdown) => ({
    name: formatMonth(item.month),
    earnings: item.earnings,
    courses: item.coursesSold,
  })) || [];

  // Calculate total courses sold
  const totalCoursesSold = teacher?.courses?.length || 0;

  // Get earnings from API response or teacher object if available
  const totalEarnings = earningsData?.totalEarnings || teacher?.totalEarnings || 0;

  // Get monthly earnings from API response, payout info, or teacher object
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  const currentMonthData = payoutInfo?.monthlyBreakdown?.find(
    (item: MonthlyBreakdown) => item.month.startsWith(currentMonth)
  );

  // Use current month data from payout info if available, otherwise fall back to other sources
  const monthlyEarnings = currentMonthData?.earnings ||
    payoutInfo?.currentPeriod?.earnings ||
    earningsData?.monthlyEarnings ||
    teacher?.earnings?.monthly ||
    0;

  // Get total courses sold from API response, payout info, or calculate from teacher object
  const totalCoursesCount = earningsData?.totalCoursesSold ||
    payoutInfo?.currentPeriod?.coursesSold?.reduce((total: number, course: any) => total + course.count, 0) ||
    totalCoursesSold;

  // Get average earnings per course from API response or calculate
  const avgPerCourse = earningsData?.avgPerCourse ||
    (totalCoursesCount > 0 ? totalEarnings / totalCoursesCount : 0);

  const isLoading = isEarningsLoading || isPayoutInfoLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Summary</CardTitle>
          <CardDescription>Your earnings overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-6 w-[120px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check for errors
  const hasError = earningsError || payoutError;
  if (hasError) {
    return (
      <Card className="border border-red-200">
        <CardHeader>
          <CardTitle>Earnings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p>Error loading earnings data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Earnings Summary</CardTitle>
          <CardDescription>
            Your earnings overview for {selectedPeriod ? `${formatMonth(payoutInfo?.currentPeriod?.month || '')} ${payoutInfo?.currentPeriod?.year}` : 'all time'}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {selectedPeriod ? `${formatMonth(payoutInfo?.currentPeriod?.month || '')} ${payoutInfo?.currentPeriod?.year}` : 'All Time'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedPeriod(undefined)}>
              All Time
            </DropdownMenuItem>
            {payoutInfo?.monthlyBreakdown?.map((item: MonthlyBreakdown) => (
              <DropdownMenuItem
                key={item.month}
                onClick={() => setSelectedPeriod(item.month)}
              >
                {formatMonth(item.month)} {item.month.split('-')[0]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border border-muted/30 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Total earnings from all your courses</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <h3 className="text-2xl font-bold">{formatCurrency(totalEarnings)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted/30 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-muted-foreground">Monthly Earnings</p>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Earnings from the current month</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <h3 className="text-2xl font-bold">{formatCurrency(monthlyEarnings)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted/30 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-muted-foreground">Courses Sold</p>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Total number of courses sold</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <h3 className="text-2xl font-bold">{totalCoursesCount}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted/30 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 p-3 rounded-full">
                  <BarChart className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-muted-foreground">Avg. Per Course</p>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Average earnings per course</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <h3 className="text-2xl font-bold">{formatCurrency(avgPerCourse)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Monthly Earnings</h3>
            <div className="text-sm text-muted-foreground">
              {chartData.length > 0 ?
                `Showing data for ${chartData.length} month${chartData.length > 1 ? 's' : ''}` :
                'No monthly data available'}
            </div>
          </div>
          <Card className="overflow-hidden border border-muted/30 p-4">
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar
                      dataKey="earnings"
                      fill="#10b981"
                      name="Earnings"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">No earnings data available</p>
                    <p className="text-sm text-muted-foreground/70">Start selling courses to see your earnings chart</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Top Selling Courses */}
        {payoutInfo?.currentPeriod?.coursesSold && payoutInfo.currentPeriod.coursesSold.length > 0 ? (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Top Selling Courses</h3>
              <div className="text-sm text-muted-foreground">
                {payoutInfo.currentPeriod.coursesSold.length} course{payoutInfo.currentPeriod.coursesSold.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {payoutInfo.currentPeriod.coursesSold.map((course: CourseSold) => (
                <Card key={course.courseId._id} className="overflow-hidden border border-muted/30 shadow-sm hover:shadow transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      {course.courseId.courseThumbnail ? (
                        <img
                          src={course.courseId.courseThumbnail}
                          alt={course.courseId.title}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center">
                          <BarChart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{course.courseId.title}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-muted-foreground">{course.count} sold</span>
                          <span className="text-sm font-medium text-green-600">{formatCurrency(course.earnings)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <Card className="border border-muted/30 p-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Course Sales Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Once you start selling courses, you'll see detailed information about your top-performing courses here.
                </p>
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EarningsSummary;
