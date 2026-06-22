import { useState, useEffect } from "react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetEnrolledStudentsQuery } from "@/redux/features/teacher/teacherApi";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Info,
  Mail,
  Search,
  SlidersHorizontal,
  Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ICourse } from "@/types/course";
import { IEnrolledStudent, IStudentCourseProgress } from "@/redux/features/teacher/teacherSlice";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// StudentDetails component for showing detailed student information
interface StudentDetailsProps {
  student: IEnrolledStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentDetails = ({ student, open, onOpenChange }: StudentDetailsProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!student) return null;

  const fullName = `${student.name.firstName} ${student.name.middleName ? student.name.middleName + ' ' : ''}${student.name.lastName}`;
  const totalCourses = student.enrolledCourses.length;
  const completedCourses = student.enrolledCourses.filter(course => course.progress === 100).length;
  const averageProgress = totalCourses > 0
    ? student.enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / totalCourses
    : 0;

  const content = (
    <div className="space-y-6">
      {/* Student Profile */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-2">
        <Avatar className="h-20 w-20">
          <AvatarImage src={student.profileImg} alt={fullName} />
          <AvatarFallback className="text-lg">
            {student.name.firstName.charAt(0)}{student.name.lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-bold">{fullName}</h3>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{student.email}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
            <Badge variant="outline" className="bg-blue-50">
              {totalCourses} {totalCourses === 1 ? 'Course' : 'Courses'}
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              {completedCourses} Completed
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="courses">Enrolled Courses</TabsTrigger>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            {student.enrolledCourses.map((course) => (
              <Card key={course.courseId} className="mb-4 overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <Badge variant={course.progress === 100 ? "default" : "outline"}
                      className={course.progress === 100 ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                      {course.progress === 100 ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />

                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{course.completedLectures} / {course.totalLectures} lectures</span>
                      </div>
                      {course.progress === 100 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="h-3.5 w-3.5" />
                          <span>Certificate Generated</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Overall Progress</CardTitle>
              <CardDescription>
                Average completion across all courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Average Progress</span>
                    <span className="text-sm font-medium">{averageProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={averageProgress} className="h-2.5" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <h4 className="text-sm text-muted-foreground mb-1">Enrolled Courses</h4>
                    <p className="text-2xl font-bold">{totalCourses}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <h4 className="text-sm text-muted-foreground mb-1">Completed</h4>
                    <p className="text-2xl font-bold">{completedCourses}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Completion Rate</h4>
                  <div className="flex items-center">
                    <div className="w-full bg-slate-100 rounded-full h-5">
                      <div
                        className="bg-green-500 h-5 rounded-full flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(completedCourses / totalCourses) * 100 || 0}%` }}
                      >
                        {totalCourses > 0 ? ((completedCourses / totalCourses) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Detailed information about the student and their progress
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Student Details</DrawerTitle>
          <DrawerDescription>
            Detailed information about the student and their progress
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {content}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const Students = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  const [selectedStudent, setSelectedStudent] = useState<IEnrolledStudent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    data: enrolledStudentsData,
    isLoading: isStudentsLoading,
    isError: isStudentsError,
  } = useGetEnrolledStudentsQuery(teacherId, { skip: !teacherId });

  const { data: coursesData, isLoading: isCoursesLoading } =
    useGetCreatorCourseQuery({ id: teacherId }, { skip: !teacherId });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const courses = coursesData?.data || [];
  const enrolledStudents = enrolledStudentsData?.data || [];

  // Filter students based on search term, selected course, and status
  const filteredStudents = enrolledStudents.filter(
    (student: IEnrolledStudent) => {
      const fullName =
        `${student.name.firstName} ${student.name.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse =
        selectedCourse === "all" ||
        student.enrolledCourses.some(
          (course) => course.courseId === selectedCourse
        );

      const hasCompletedCourse = student.enrolledCourses.some(
        (course) => course.progress === 100
      );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && hasCompletedCourse) ||
        (statusFilter === "in-progress" && !hasCompletedCourse);

      return matchesSearch && matchesCourse && matchesStatus;
    }
  );

  // Calculate total students and completion stats
  const totalStudents = enrolledStudents.length;
  const completedStudents = enrolledStudents.filter((student) =>
    student.enrolledCourses.some((course) => course.progress === 100)
  ).length;

  const handleViewStudentDetails = (student: IEnrolledStudent) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  // Loading skeleton
  if (isStudentsLoading || isCoursesLoading) {
    return <StudentsPageSkeleton />;
  }

  // Error state
  if (isStudentsError) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load student data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <StudentDetails
        student={selectedStudent}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">
              Manage and track your enrolled students
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-3xl font-bold">{totalStudents}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-3xl font-bold">{completedStudents}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold">
                    {totalStudents > 0
                      ? Math.round((completedStudents / totalStudents) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    totalStudents > 0
                      ? (completedStudents / totalStudents) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course: ICourse) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Students Table */}
        <Card className="overflow-hidden border shadow-sm">
          <CardHeader className="bg-muted/30 py-4 px-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Enrolled Students</CardTitle>
                <CardDescription>
                  {filteredStudents.length}{" "}
                  {filteredStudents.length === 1 ? "student" : "students"} found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Enrolled Courses</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student: IEnrolledStudent) => (
                      <TableRow key={student._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="border">
                              <AvatarImage
                                src={student.profileImg}
                                alt={`${student.name.firstName} ${student.name.lastName}`}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {student.name.firstName.charAt(0)}{student.name.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {student.name.firstName} {student.name.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.enrolledCourses.length} {student.enrolledCourses.length === 1 ? 'course' : 'courses'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {student.enrolledCourses.slice(0, 2).map((course) => (
                              <Badge
                                key={course.courseId}
                                variant="outline"
                                className="whitespace-nowrap bg-slate-50"
                              >
                                {course.title}
                              </Badge>
                            ))}
                            {student.enrolledCourses.length > 2 && (
                              <Badge variant="outline" className="bg-slate-50">
                                +{student.enrolledCourses.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-3">
                            {student.enrolledCourses.slice(0, 2).map((course) => (
                              <div
                                key={course.courseId}
                                className="flex flex-col"
                              >
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="truncate max-w-[120px]">{course.title}</span>
                                  <span className="font-medium">{course.progress}%</span>
                                </div>
                                <Progress
                                  value={course.progress}
                                  className="h-1.5"
                                  // Add color based on progress
                                  style={{
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    '--progress-color': course.progress < 30
                                      ? 'rgba(239, 68, 68, 0.8)' // red
                                      : course.progress < 70
                                        ? 'rgba(245, 158, 11, 0.8)' // amber
                                        : 'rgba(34, 197, 94, 0.8)', // green
                                    '--progress-background': 'transparent',
                                  } as React.CSSProperties}
                                />
                              </div>
                            ))}
                            {student.enrolledCourses.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{student.enrolledCourses.length - 2} more courses
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewStudentDetails(student)}
                          >
                            <Info className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="bg-muted/30 mx-auto h-16 w-16 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground opacity-70" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No students found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  {searchTerm || selectedCourse !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters to find what you're looking for."
                    : "You don't have any enrolled students yet. Students will appear here once they enroll in your courses."}
                </p>
                {(searchTerm || selectedCourse !== "all" || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCourse("all");
                      setStatusFilter("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Skeleton loader for the students page
const StudentsPageSkeleton = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden border-l-4 border-l-gray-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full mr-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 py-4 px-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="hidden md:block flex-1 mx-8">
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="hidden md:block w-48">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="hidden md:flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;
