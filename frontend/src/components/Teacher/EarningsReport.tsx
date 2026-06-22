import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { format, subMonths, startOfYear, endOfYear } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Download,
  FileDown,
  LineChart,
  Loader2,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  TooltipProps,
} from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useGetPayoutInfoQuery } from '@/redux/features/payment/payment.api';

// Define chart colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

const EarningsReport = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [period, setPeriod] = useState("year");
  const [isExporting, setIsExporting] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("");

  // Get current date for period calculations
  const now = new Date();
  const currentYear = now.getFullYear();

  // Calculate date ranges based on period
  const getDateRange = () => {
    switch (period) {
      case "month":
        return {
          startDate: format(now, "yyyy-MM-01"),
          endDate: format(now, "yyyy-MM-dd"),
          label: format(now, "MMMM yyyy"),
        };
      case "quarter":
        { const quarterStart = new Date(now);
        quarterStart.setMonth(Math.floor(now.getMonth() / 3) * 3);
        quarterStart.setDate(1);
        return {
          startDate: format(quarterStart, "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
          label: `Q${Math.floor(now.getMonth() / 3) + 1} ${currentYear}`,
        }; }
      case "year":
        return {
          startDate: format(startOfYear(now), "yyyy-MM-dd"),
          endDate: format(endOfYear(now), "yyyy-MM-dd"),
          label: `${currentYear}`,
        };
      case "last6months":
        return {
          startDate: format(subMonths(now, 6), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
          label: `Last 6 Months`,
        };
      default:
        return {
          startDate: format(startOfYear(now), "yyyy-MM-dd"),
          endDate: format(endOfYear(now), "yyyy-MM-dd"),
          label: `${currentYear}`,
        };
    }
  };

  const dateRange = getDateRange();

  // Calculate comparison date range if needed
  const getComparisonDateRange = () => {
    if (!showComparison || !comparisonPeriod) return null;

    switch (comparisonPeriod) {
      case "previousPeriod":
        switch (period) {
          case "month":
            const prevMonth = new Date(now);
            prevMonth.setMonth(now.getMonth() - 1);
            return {
              label: format(prevMonth, "MMMM yyyy"),
            };
          case "quarter":
            const prevQuarter = new Date(now);
            prevQuarter.setMonth(Math.floor(now.getMonth() / 3) * 3 - 3);
            return {
              label: `Q${Math.floor(prevQuarter.getMonth() / 3) + 1} ${prevQuarter.getFullYear()}`,
            };
          case "year":
            return {
              label: `${currentYear - 1}`,
            };
          case "last6months":
            return {
              label: `Previous 6 Months`,
            };
          default:
            return null;
        }
      case "previousYear":
        switch (period) {
          case "month":
            const sameMonthLastYear = new Date(now);
            sameMonthLastYear.setFullYear(now.getFullYear() - 1);
            return {
              label: format(sameMonthLastYear, "MMMM yyyy"),
            };
          case "quarter":
            const sameQuarterLastYear = new Date(now);
            sameQuarterLastYear.setFullYear(now.getFullYear() - 1);
            return {
              label: `Q${Math.floor(now.getMonth() / 3) + 1} ${currentYear - 1}`,
            };
          case "year":
            return {
              label: `${currentYear - 1}`,
            };
          case "last6months":
            return {
              label: `Same 6 Months Last Year`,
            };
          default:
            return null;
        }
      default:
        return null;
    }
  };

  const comparisonRange = getComparisonDateRange();

  // Fetch payout info
  const { data, isLoading, error } = useGetPayoutInfoQuery(
    { teacherId: user?._id as string, period: dateRange.label },
    { skip: !user?._id }
  );

  // Fetch comparison data if needed
  const { data: comparisonData } = useGetPayoutInfoQuery(
    { teacherId: user?._id as string, period: comparisonRange?.label },
    { skip: !user?._id || !showComparison || !comparisonRange }
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!data?.monthlyBreakdown) return [];

    const baseData = data.monthlyBreakdown.map((item: any) => ({
      name: format(new Date(item.month + "-01"), "MMM"),
      earnings: item.earnings,
      courses: item.coursesSold,
    }));

    // If comparison data is available, add it to the chart data
    if (showComparison && comparisonData?.monthlyBreakdown) {
      // Create a map of month names to comparison data
      const comparisonMap = new Map();
      comparisonData.monthlyBreakdown.forEach((item: any) => {
        const monthName = format(new Date(item.month + "-01"), "MMM");
        comparisonMap.set(monthName, {
          comparisonEarnings: item.earnings,
          comparisonCourses: item.coursesSold,
        });
      });

      // Add comparison data to base data where months match
      return baseData.map((item: { name: string; earnings: number; courses: number }) => {
        const comparisonItem = comparisonMap.get(item.name);
        if (comparisonItem) {
          return {
            ...item,
            ...comparisonItem,
          };
        }
        return item;
      });
    }

    return baseData;
  };

  // Prepare course sales data for pie chart
  const preparePieChartData = () => {
    if (!data?.currentPeriod?.coursesSold) return [];

    return data.currentPeriod.coursesSold.map((course: any) => ({
      name: course.courseId.title,
      value: course.earnings,
      count: course.count,
    }));
  };

  // Prepare comparison summary data
  const prepareComparisonSummary = () => {
    if (!showComparison || !comparisonData?.currentPeriod) return null;

    const currentEarnings = data?.currentPeriod?.earnings || 0;
    const comparisonEarnings = comparisonData?.currentPeriod?.earnings || 0;
    const currentCoursesSold = data?.currentPeriod?.coursesSold?.reduce(
      (total: number, course: any) => total + course.count,
      0
    ) || 0;
    const comparisonCoursesSold = comparisonData?.currentPeriod?.coursesSold?.reduce(
      (total: number, course: any) => total + course.count,
      0
    ) || 0;

    // Calculate percentage changes
    const earningsChange = comparisonEarnings > 0
      ? ((currentEarnings - comparisonEarnings) / comparisonEarnings) * 100
      : 0;
    const coursesChange = comparisonCoursesSold > 0
      ? ((currentCoursesSold - comparisonCoursesSold) / comparisonCoursesSold) * 100
      : 0;

    return {
      currentEarnings,
      comparisonEarnings,
      earningsChange,
      currentCoursesSold,
      comparisonCoursesSold,
      coursesChange,
      comparisonLabel: comparisonRange?.label || "",
    };
  };

  const chartData = prepareChartData();
  const pieChartData = preparePieChartData();
  const comparisonSummary = prepareComparisonSummary();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium">{label}</p>

          {/* Current period data */}
          {payload.find(p => p.dataKey === 'earnings') && (
            <p className="text-green-600">
              {formatCurrency(payload.find(p => p.dataKey === 'earnings')?.value as number)}
              <span className="text-xs text-muted-foreground ml-1">Current</span>
            </p>
          )}

          {/* Comparison period data */}
          {payload.find(p => p.dataKey === 'comparisonEarnings') && (
            <p className="text-indigo-600">
              {formatCurrency(payload.find(p => p.dataKey === 'comparisonEarnings')?.value as number)}
              <span className="text-xs text-muted-foreground ml-1">Comparison</span>
            </p>
          )}

          {/* Course sales data */}
          {payload.find(p => p.dataKey === 'courses') && (
            <p className="text-blue-600">{payload.find(p => p.dataKey === 'courses')?.value} courses sold</p>
          )}

          {/* Comparison course sales data */}
          {payload.find(p => p.dataKey === 'comparisonCourses') && (
            <p className="text-purple-600">
              {payload.find(p => p.dataKey === 'comparisonCourses')?.value} courses sold
              <span className="text-xs text-muted-foreground ml-1">Comparison</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const reportElement = document.getElementById("earnings-report");
      if (!reportElement) {
        console.error("Report element not found");
        setIsExporting(false);
        return;
      }

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`earnings-report-${dateRange.label}${showComparison ? `-vs-${comparisonRange?.label}` : ''}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[300px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Earnings Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading earnings data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="earnings-report">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Earnings Report</CardTitle>
          <CardDescription>
            Detailed earnings report for {dateRange.label}
            {showComparison && comparisonRange && (
              <span className="ml-1">compared to {comparisonRange.label}</span>
            )}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={showComparison ? comparisonPeriod : "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  setShowComparison(false);
                  setComparisonPeriod("");
                } else {
                  setShowComparison(true);
                  setComparisonPeriod(value);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Compare with..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No comparison</SelectItem>
                <SelectItem value="previousPeriod">Previous period</SelectItem>
                <SelectItem value="previousYear">Same period last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Earnings
                  </p>
                  <h3 className="text-2xl font-bold text-green-600">
                    {formatCurrency(data?.currentPeriod?.earnings || 0)}
                  </h3>
                  {showComparison && comparisonData?.currentPeriod && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">vs </span>
                      <span className="font-medium text-indigo-600">
                        {formatCurrency(comparisonData.currentPeriod.earnings || 0)}
                      </span>
                      {comparisonData.currentPeriod.earnings > 0 && (
                        <span className={`ml-1 ${data?.currentPeriod?.earnings > comparisonData.currentPeriod.earnings ? 'text-green-500' : 'text-red-500'}`}>
                          ({data?.currentPeriod?.earnings > comparisonData.currentPeriod.earnings ? '+' : ''}
                          {Math.round(((data?.currentPeriod?.earnings || 0) - (comparisonData.currentPeriod.earnings || 0)) / (comparisonData.currentPeriod.earnings || 1) * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Courses Sold
                  </p>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {data?.currentPeriod?.coursesSold?.reduce(
                      (total: number, course: any) => total + course.count,
                      0
                    ) || 0}
                  </h3>
                  {showComparison && comparisonData?.currentPeriod && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">vs </span>
                      <span className="font-medium text-indigo-600">
                        {comparisonData.currentPeriod.coursesSold?.reduce(
                          (total: number, course: any) => total + course.count,
                          0
                        ) || 0}
                      </span>
                      {(comparisonData.currentPeriod.coursesSold?.reduce(
                        (total: number, course: any) => total + course.count,
                        0
                      ) || 0) > 0 && (
                        <span className={`ml-1 ${
                          (data?.currentPeriod?.coursesSold?.reduce(
                            (total: number, course: any) => total + course.count,
                            0
                          ) || 0) >
                          (comparisonData.currentPeriod.coursesSold?.reduce(
                            (total: number, course: any) => total + course.count,
                            0
                          ) || 0) ? 'text-green-500' : 'text-red-500'}`}>
                          ({
                            (data?.currentPeriod?.coursesSold?.reduce(
                              (total: number, course: any) => total + course.count,
                              0
                            ) || 0) >
                            (comparisonData.currentPeriod.coursesSold?.reduce(
                              (total: number, course: any) => total + course.count,
                              0
                            ) || 0) ? '+' : ''}
                          {Math.round((
                            (data?.currentPeriod?.coursesSold?.reduce(
                              (total: number, course: any) => total + course.count,
                              0
                            ) || 0) -
                            (comparisonData.currentPeriod.coursesSold?.reduce(
                              (total: number, course: any) => total + course.count,
                              0
                            ) || 0)
                          ) / (comparisonData.currentPeriod.coursesSold?.reduce(
                            (total: number, course: any) => total + course.count,
                            0
                          ) || 1) * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Avg. Per Course
                  </p>
                  <h3 className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      data?.currentPeriod?.coursesSold?.length > 0
                        ? data.currentPeriod.earnings /
                            data.currentPeriod.coursesSold.length
                        : 0
                    )}
                  </h3>
                  {showComparison && comparisonData?.currentPeriod && comparisonData.currentPeriod.coursesSold?.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">vs </span>
                      <span className="font-medium text-indigo-600">
                        {formatCurrency(
                          comparisonData.currentPeriod.coursesSold.length > 0
                            ? comparisonData.currentPeriod.earnings /
                                comparisonData.currentPeriod.coursesSold.length
                            : 0
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Tabs */}
          <Tabs defaultValue="earnings" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant={chartType === "bar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                  className="h-8 w-8 p-0"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("line")}
                  className="h-8 w-8 p-0"
                >
                  <LineChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === "pie" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("pie")}
                  className="h-8 w-8 p-0"
                >
                  <PieChart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="earnings" className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[400px] w-full">
                    {chartData.length > 0 ? (
                      chartType === "pie" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {pieChartData.map((_entry, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatCurrency(value as number)}
                            />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : chartType === "line" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="earnings"
                              stroke="#10b981"
                              activeDot={{ r: 8 }}
                              name="Earnings"
                            />
                            {showComparison && (
                              <Line
                                type="monotone"
                                dataKey="comparisonEarnings"
                                stroke="#6366f1"
                                strokeDasharray="5 5"
                                activeDot={{ r: 6 }}
                                name={`${comparisonRange?.label || "Comparison"} Earnings`}
                              />
                            )}
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                              dataKey="earnings"
                              fill="#10b981"
                              name="Earnings"
                              radius={[4, 4, 0, 0]}
                            />
                            {showComparison && (
                              <Bar
                                dataKey="comparisonEarnings"
                                fill="#6366f1"
                                name={`${comparisonRange?.label || "Comparison"} Earnings`}
                                radius={[4, 4, 0, 0]}
                              />
                            )}
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground mb-2">No earnings data available</p>
                          <p className="text-sm text-muted-foreground/70">
                            Start selling courses to see your earnings chart
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[400px] w-full">
                    {chartData.length > 0 ? (
                      chartType === "pie" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="name"
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {pieChartData.map((_entry, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : chartType === "line" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="courses"
                              stroke="#3b82f6"
                              activeDot={{ r: 8 }}
                              name="Courses Sold"
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="courses"
                              fill="#3b82f6"
                              name="Courses Sold"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground mb-2">No course sales data available</p>
                          <p className="text-sm text-muted-foreground/70">
                            Start selling courses to see your course sales chart
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsReport;
