import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetTransactionAnalyticsQuery } from "@/redux/features/payment/payment.api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileDown,
  LineChart as LineChartIcon,
  Loader2,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";
import { formatCurrency } from "@/lib/utils";

// Define chart colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

const TransactionAnalytics = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [period, setPeriod] = useState("30days");
  const [chartType, setChartType] = useState("bar");
  const [groupBy, setGroupBy] = useState("day");
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date();
    
    switch (period) {
      case "7days":
        return {
          startDate: format(subDays(now, 7), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "30days":
        return {
          startDate: format(subDays(now, 30), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "90days":
        return {
          startDate: format(subDays(now, 90), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "6months":
        return {
          startDate: format(subMonths(now, 6), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "1year":
        return {
          startDate: format(subYears(now, 1), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      default:
        return {
          startDate: format(subDays(now, 30), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch transaction analytics
  const { data, isLoading, error } = useGetTransactionAnalyticsQuery(
    {
      teacherId: user?._id as string,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
    },
    { skip: !user?._id }
  );

  // Format data for charts
  const formatChartData = () => {
    if (!data?.timeSeriesData) return [];

    return data.timeSeriesData.map((item: any) => ({
      name: item.period,
      sales: item.count,
      revenue: item.amount,
      earnings: item.teacherEarnings,
    }));
  };

  // Format data for course breakdown
  const formatCourseData = () => {
    if (!data?.courseBreakdown) return [];

    return data.courseBreakdown.map((item: any) => ({
      name: item.courseTitle,
      value: item.teacherEarnings,
      count: item.count,
      revenue: item.amount,
    }));
  };

  const chartData = formatChartData();
  const courseData = formatCourseData();

  // Handle CSV export
  const handleExportCSV = () => {
    if (!data) return;

    setIsExporting(true);

    try {
      // Create CSV content for time series data
      const timeSeriesHeaders = ["Period", "Sales", "Revenue", "Earnings"];
      const timeSeriesRows = [
        timeSeriesHeaders.join(","),
        ...chartData.map((item: any) => [
          item.name,
          item.sales,
          formatCurrency(item.revenue).replace("$", ""),
          formatCurrency(item.earnings).replace("$", ""),
        ].join(",")),
      ];

      // Create CSV content for course breakdown
      const courseHeaders = ["Course", "Sales", "Revenue", "Earnings"];
      const courseRows = [
        courseHeaders.join(","),
        ...courseData.map((item: any) => [
          `"${item.name}"`,
          item.count,
          formatCurrency(item.revenue).replace("$", ""),
          formatCurrency(item.value).replace("$", ""),
        ].join(",")),
      ];

      // Combine both datasets
      const csvContent = [
        "Transaction Analytics",
        `Period: ${period}, Date Range: ${dateRange.startDate} to ${dateRange.endDate}`,
        "",
        "Time Series Data:",
        ...timeSeriesRows,
        "",
        "Course Breakdown:",
        ...courseRows,
      ].join("\n");

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `transaction-analytics-${period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
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
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Transaction Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading transaction data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaction Analytics</CardTitle>
          <CardDescription>
            Detailed analysis of your course sales and earnings
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportCSV}
            disabled={isExporting || !data}
            title="Export to CSV"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0">
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-2xl font-bold">{data?.summary?.totalSales || 0}</h3>
                  {data?.summary?.salesGrowth && (
                    <Badge variant={data.summary.salesGrowth > 0 ? "success" : "destructive"} className="flex items-center gap-1">
                      {data.summary.salesGrowth > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(data.summary.salesGrowth)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-2xl font-bold">{formatCurrency(data?.summary?.totalRevenue || 0)}</h3>
                  {data?.summary?.revenueGrowth && (
                    <Badge variant={data.summary.revenueGrowth > 0 ? "success" : "destructive"} className="flex items-center gap-1">
                      {data.summary.revenueGrowth > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(data.summary.revenueGrowth)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0">
                  <p className="text-sm font-medium text-muted-foreground">Your Earnings</p>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-2xl font-bold">{formatCurrency(data?.summary?.totalEarnings || 0)}</h3>
                  {data?.summary?.earningsGrowth && (
                    <Badge variant={data.summary.earningsGrowth > 0 ? "success" : "destructive"} className="flex items-center gap-1">
                      {data.summary.earningsGrowth > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(data.summary.earningsGrowth)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Per Sale</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(
                      data?.summary?.totalSales
                        ? data.summary.totalEarnings / data.summary.totalSales
                        : 0
                    )}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "pie" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("pie")}
                className="h-8 w-8 p-0"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
            </div>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Charts */}
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[400px] w-full">
                    {chartData.length > 0 ? (
                      chartType === "pie" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={courseData}
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
                              {courseData.map((entry: any, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : chartType === "line" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="sales"
                              stroke="#3b82f6"
                              activeDot={{ r: 8 }}
                              name="Sales"
                            />
                          </LineChart>
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
                              dataKey="sales"
                              fill="#3b82f6"
                              name="Sales"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground mb-2">No sales data available</p>
                          <p className="text-sm text-muted-foreground/70">
                            Try selecting a different time period
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[400px] w-full">
                    {chartData.length > 0 ? (
                      chartType === "pie" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={courseData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="revenue"
                              nameKey="name"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {courseData.map((entry: any, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : chartType === "line" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="#ef4444"
                              activeDot={{ r: 8 }}
                              name="Revenue"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar
                              dataKey="revenue"
                              fill="#ef4444"
                              name="Revenue"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground mb-2">No revenue data available</p>
                          <p className="text-sm text-muted-foreground/70">
                            Try selecting a different time period
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[400px] w-full">
                    {chartData.length > 0 ? (
                      chartType === "pie" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={courseData}
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
                              {courseData.map((entry: any, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : chartType === "line" ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="earnings"
                              stroke="#10b981"
                              activeDot={{ r: 8 }}
                              name="Earnings"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar
                              dataKey="earnings"
                              fill="#10b981"
                              name="Earnings"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground mb-2">No earnings data available</p>
                          <p className="text-sm text-muted-foreground/70">
                            Try selecting a different time period
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Course Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Course Breakdown</CardTitle>
              <CardDescription>Performance by course</CardDescription>
            </CardHeader>
            <CardContent>
              {courseData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Your Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseData.map((course: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell className="text-right">{course.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(course.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(course.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Course Data</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    There are no course sales in the selected time period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionAnalytics;
