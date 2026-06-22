import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Users, DollarSign, TrendingUp } from "lucide-react";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Loader2 } from "lucide-react";

const TeacherDashboard = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const {
    data: coursesData,
    isLoading,
    isError,
  } = useGetCreatorCourseQuery(
    { id: userData?.data?._id },
    { skip: !userData?.data?._id }
  );

  const courses = coursesData?.data || [];
  const publishedCourses = courses.filter(
    (course) => course.status === "published"
  );
  const totalStudents = publishedCourses.reduce(
    (sum, course) => sum + (course.enrolledStudents?.length || 0),
    0
  );
  const totalEarnings = publishedCourses.reduce((sum, course) => {
    if (course.isFree === "paid" && course.coursePrice && course.enrolledStudents?.length > 0) {
      return sum + (course.coursePrice * course.enrolledStudents.length);
    }
    return sum;
  }, 0);
  const avgRating =
    courses.length > 0
      ? (
          courses.reduce((sum, course) => sum + (course.rating || 0), 0) /
          courses.length
        ).toFixed(1)
      : "0.0";

  const stats = [
    {
      title: "Total Courses",
      value: courses.length.toString(),
      icon: <BookOpen className="h-6 w-6 text-edu-primary" />,
      change: `+${publishedCourses.length} published`,
    },
    {
      title: "Total Students",
      value: totalStudents.toString(),
      icon: <Users className="h-6 w-6 text-edu-secondary" />,
      change: `+${totalStudents} enrolled`,
    },
    {
      title: "Total Earnings",
      value: `$${totalEarnings}`,
      icon: <DollarSign className="h-6 w-6 text-edu-accent" />,
      change: `$${totalEarnings} earned`,
    },
    {
      title: "Avg. Course Rating",
      value: `${avgRating}/5`,
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      change: "Based on all courses",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error loading dashboard data</p>
      </div>
    );
  }

  return (
    <main className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <Button asChild className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
          <Link to="/teacher/courses/create" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Create New Course
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="stats-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Button variant="outline" asChild className="w-full">
                <Link to="/teacher/courses">View All Courses</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/teacher/earnings">View Earnings</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/teacher/profile">Edit Profile</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/teacher/settings">Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            {courses.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/teacher/courses">View All</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  You haven't created any courses yet.
                </p>
                <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Link to="/teacher/courses/create">
                    <Plus className="mr-2 h-4 w-4" /> Create Your First Course
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course._id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(course.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        course.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {course.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default TeacherDashboard;
