import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Award,
  Clock,
  GraduationCap,
  Globe,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useGetMonthlyImpactReportQuery,
  useGetAvailableMonthsQuery,
} from "@/redux/features/impact/impactApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ImpactReport = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useGetMonthlyImpactReportQuery({
    year: selectedYear,
    month: selectedMonth,
  });
  const { data: monthsData } = useGetAvailableMonthsQuery();

  const report = data?.data;
  const availableMonths = monthsData?.data ?? [];

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <section className="py-12 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Monthly Impact Report</h1>
              <p className="text-green-100 mt-1">
                Platform metrics and sustainability education impact
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  {report?.period?.label ?? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                {(availableMonths.length > 0 ? availableMonths : (() => {
                  const fallback: { year: number; month: number }[] = [];
                  for (let i = 0; i < 12; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    fallback.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
                  }
                  return fallback;
                })()).map(({ year, month }) => (
                  <DropdownMenuItem
                    key={`${year}-${month}`}
                    onClick={() => {
                      setSelectedYear(year);
                      setSelectedMonth(month);
                    }}
                  >
                    {MONTH_NAMES[month - 1]} {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="h-6 w-24 bg-gray-200 rounded mt-2" />
                    <div className="h-4 w-32 bg-gray-200 rounded mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : report ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                This Month ({report.period.label})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{report.newEnrollments}</CardTitle>
                        <p className="text-sm text-gray-500">New Enrollments</p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{report.newCoursesPublished}</CardTitle>
                        <p className="text-sm text-gray-500">New Courses Created</p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <Award className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{report.certificatesIssued}</CardTitle>
                        <p className="text-sm text-gray-500">Certificates Issued</p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <GraduationCap className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          {report.lecturesCompletedThisMonth}
                        </CardTitle>
                        <p className="text-sm text-gray-500">Lectures Completed</p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-100">
                        <Clock className="h-6 w-6 text-cyan-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          {formatDuration(report.watchTimeMinutes)}
                        </CardTitle>
                        <p className="text-sm text-gray-500">Total Watch Time</p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-6">All-Time Totals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(report.totalStudents)}</p>
                        <p className="text-sm text-gray-500">Total Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(report.totalTeachers)}</p>
                        <p className="text-sm text-gray-500">Total Teachers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <BookOpen className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{report.totalPublishedCourses}</p>
                        <p className="text-sm text-gray-500">Published Courses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(report.totalEnrollments)}</p>
                        <p className="text-sm text-gray-500">Total Enrollments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No impact data available for this period.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default ImpactReport;
