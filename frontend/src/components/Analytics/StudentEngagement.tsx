import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  useGetEngagementMetricsQuery,
  useGetStudentEngagementDetailsQuery,
} from '@/redux/features/analytics/analyticsApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { AnalyticsFilters } from '@/types/analytics';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowUpDown,
  Clock,
  Download,
  Mail,
  MessageSquare,
  MoreVertical,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface StudentEngagementProps {
  filters: AnalyticsFilters;
}

const StudentEngagement: React.FC<StudentEngagementProps> = ({ filters }) => {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('engagementScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  const {
    data: engagementData,
    isLoading,
    error,
  } = useGetStudentEngagementDetailsQuery(
    {
      teacherId: teacherId || '',
      filters,
      page,
      limit: 20,
      sortBy,
      sortOrder,
    },
    { skip: !teacherId }
  );

  // Get engagement metrics for summary data
  const { data: engagementMetrics, isLoading: isMetricsLoading } = useGetEngagementMetricsQuery(
    { teacherId: teacherId || '', filters },
    { skip: !teacherId }
  );

  const students = engagementData?.data?.data || [];
  const pagination = engagementData?.data?.pagination;
  const metrics = engagementMetrics?.data;

  // Transform real data for charts
  const engagementTrendData = React.useMemo(() => {
    if (!metrics?.trendData) {
      return [
        { week: 'Week 1', engagement: 0, activeStudents: 0 },
        { week: 'Week 2', engagement: 0, activeStudents: 0 },
        { week: 'Week 3', engagement: 0, activeStudents: 0 },
        { week: 'Week 4', engagement: 0, activeStudents: 0 },
        { week: 'Week 5', engagement: 0, activeStudents: 0 },
        { week: 'Week 6', engagement: 0, activeStudents: 0 },
      ];
    }
    return metrics.trendData.map((item: any, index: number) => ({
      week: `Week ${index + 1}`,
      engagement: item.engagement || 0,
      activeStudents: item.activeStudents || 0,
    }));
  }, [metrics?.trendData]);

  const engagementDistributionData = React.useMemo(() => {
    if (!metrics?.distribution) {
      return [
        { name: 'High (80-100)', value: 0, color: '#10B981' },
        { name: 'Medium (60-79)', value: 0, color: '#F59E0B' },
        { name: 'Low (40-59)', value: 0, color: '#EF4444' },
        { name: 'Very Low (0-39)', value: 0, color: '#6B7280' },
      ];
    }
    return [
      { name: 'High (80-100)', value: metrics.distribution.high || 0, color: '#10B981' },
      { name: 'Medium (60-79)', value: metrics.distribution.medium || 0, color: '#F59E0B' },
      { name: 'Low (40-59)', value: metrics.distribution.low || 0, color: '#EF4444' },
      { name: 'Very Low (0-39)', value: metrics.distribution.veryLow || 0, color: '#6B7280' },
    ];
  }, [metrics?.distribution]);

  const chartConfig = {
    engagement: {
      label: 'Engagement Score',
      color: 'hsl(var(--chart-1))',
    },
    activeStudents: {
      label: 'Active Students',
      color: 'hsl(var(--chart-2))',
    },
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Low';
    return 'Very Low';
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMetricsLoading ? '...' : (metrics?.totalStudents || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.growthRate
                ? `${metrics.growthRate > 0 ? '+' : ''}${metrics.growthRate}% from last month`
                : 'No growth data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5%</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2h</div>
            <p className="text-xs text-muted-foreground">+0.8h from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="var(--color-engagement)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {engagementDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-gray-600">{data.value}% of students</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {engagementDistributionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Student Details</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagementScore">Engagement</SelectItem>
                  <SelectItem value="totalTimeSpent">Study Time</SelectItem>
                  <SelectItem value="coursesCompleted">Completed</SelectItem>
                  <SelectItem value="lastActiveDate">Last Active</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('engagementScore')}
                  >
                    <div className="flex items-center gap-1">
                      Engagement
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('totalTimeSpent')}
                  >
                    <div className="flex items-center gap-1">
                      Study Time
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('lastActiveDate')}
                  >
                    <div className="flex items-center gap-1">
                      Last Active
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" alt={student.studentName} />
                          <AvatarFallback className="text-xs">
                            {student.studentName
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.studentName}</div>
                          <div className="text-sm text-gray-500">{student.studentEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', getEngagementColor(student.engagementScore))}>
                        {student.engagementScore}% {getEngagementLabel(student.engagementScore)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {Math.round(student.totalTimeSpent / 60)}h {student.totalTimeSpent % 60}m
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${student.averageProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{student.averageProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(student.lastActiveDate), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Mail className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} students
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEngagement;
