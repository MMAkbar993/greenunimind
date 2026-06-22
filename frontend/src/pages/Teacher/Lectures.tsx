import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Clock,
  Video,
  Grid,
  List,
  MoreHorizontal,
  BookOpen,

} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useGetCreatorCourseQuery } from '@/redux/features/course/courseApi';
import { baseApi } from '@/redux/api/baseApi';
import { useAppDispatch } from '@/redux/hooks';
import { ICourse } from '@/types/course';
import { formatDuration } from '@/utils/formatDuration';
import { toast } from 'sonner';

// Types
interface LectureWithCourse {
  _id: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl?: string;
  pdfUrl?: string;
  isPreviewFree?: boolean;
  duration?: number;
  order?: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  course?: ICourse;
}

interface FilterOptions {
  course: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Main Component
const LecturesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filters, setFilters] = useState<FilterOptions>({
    course: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Data Fetching
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    refetch: refetchCourses,
  } = useGetCreatorCourseQuery({ id: teacherId! }, { skip: !teacherId });

  // Memoized Data Processing
  const courses = useMemo(() => coursesData?.data || [], [coursesData?.data]);

  const allLectures = useMemo(() => {
    return courses.flatMap((course: ICourse) =>
      (course.lectures || []).map((lecture: any) => ({
        ...lecture,
        courseId: course._id,
        course: course,
      }))
    );
  }, [courses]);

  const filteredLectures = useMemo(() => {
    let filtered = [...allLectures];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lecture) =>
          lecture.lectureTitle.toLowerCase().includes(lowercasedQuery) ||
          lecture.course?.title.toLowerCase().includes(lowercasedQuery)
      );
    }

    if (filters.course !== 'all') {
      filtered = filtered.filter((lecture) => lecture.courseId === filters.course);
    }

    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof LectureWithCourse] || 0;
      const bValue = b[filters.sortBy as keyof LectureWithCourse] || 0;

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allLectures, searchQuery, filters]);

  const stats = useMemo(() => ({
    totalLectures: allLectures.length,
    totalDuration: allLectures.reduce((sum, l) => sum + (l.duration || 0), 0),
    publishedLectures: allLectures.filter(l => l.videoUrl).length,
    draftLectures: allLectures.filter(l => !l.videoUrl).length,
  }), [allLectures]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    toast.promise(refetchCourses(), {
      loading: 'Refreshing lectures...',
      success: 'Lectures refreshed successfully!',
      error: 'Failed to refresh lectures.',
    });
  }, [refetchCourses]);

  const handleAction = (action: 'edit' | 'preview' | 'viewCourse', lecture: LectureWithCourse) => {
    const paths = {
      edit: `/teacher/courses/${lecture.courseId}/lecture/edit/${lecture._id}`,
      preview: `/teacher/courses/${lecture.courseId}/lecture/preview/${lecture._id}`,
      viewCourse: `/teacher/courses`,
    };
    navigate(paths[action]);
  };

  // Effects
  useEffect(() => {
    if (teacherId) {
      dispatch(baseApi.util.invalidateTags([{ type: 'courses', id: `creator-${teacherId}` }]));
    }
  }, [dispatch, teacherId]);

  // Render
  if (isUserLoading || isCoursesLoading) {
    return <LecturesSkeleton />;
  }

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Header onRefresh={handleRefresh} navigate={navigate} />
        <StatsGrid stats={stats} />
        <Filters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
          courses={courses}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <LecturesContent
          lectures={filteredLectures}
          viewMode={viewMode}
          onAction={handleAction}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

// Sub-components
const Header = ({ onRefresh, navigate }: { onRefresh: () => void, navigate: (path: string) => void }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lectures</h1>
      <p className="text-md text-gray-600 mt-1">Your central hub for all course lectures.</p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onRefresh} className="flex items-center gap-1.5">
        <RefreshCw className="w-4 h-4" />
        Refresh
      </Button>
      <Button size="sm" onClick={() => navigate('/teacher/courses')} className="flex items-center gap-1.5">
        <Plus className="w-4 h-4" />
        Add Course
      </Button>
    </div>
  </div>
);

const StatsGrid = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard icon={Video} title="Total Lectures" value={stats.totalLectures} color="blue" />
    <StatCard icon={Clock} title="Total Duration" value={formatDuration(stats.totalDuration)} color="green" />
    <StatCard icon={Eye} title="Published" value={stats.publishedLectures} color="purple" />
    <StatCard icon={Edit} title="Drafts" value={stats.draftLectures} color="orange" />
  </div>
);

const StatCard = ({ icon: Icon, title, value, color }: any) => (
  <Card>
    <CardContent className="p-4 flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const Filters = ({ searchQuery, setSearchQuery, filters, setFilters, courses, viewMode, setViewMode }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="w-full md:w-auto md:flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by lecture or course title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <Select value={filters.course} onValueChange={(value) => setFilters((p: any) => ({ ...p, course: value }))}>
            <SelectTrigger className="w-full md:w-[180px] h-10">
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
          <Select value={filters.sortBy} onValueChange={(value) => setFilters((p: any) => ({ ...p, sortBy: value }))}>
            <SelectTrigger className="w-full md:w-[160px] h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
              <SelectItem value="lectureTitle">Title</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="order">Order</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center bg-gray-100 rounded-md">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const LecturesContent = ({ lectures, viewMode, onAction, navigate }: any) => {
  if (lectures.length === 0) {
    return <EmptyState navigate={navigate} />;
  }

  return viewMode === 'table' ? (
    <LecturesTable lectures={lectures} onAction={onAction} />
  ) : (
    <LecturesGrid lectures={lectures} onAction={onAction} />
  );
};

const LecturesTable = ({ lectures, onAction }: any) => (
  <Card>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Lecture</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lectures.map((lecture: LectureWithCourse) => (
          <TableRow key={lecture._id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{lecture.lectureTitle}</p>
                  <p className="text-sm text-gray-500 truncate max-w-md">{lecture.instruction}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-gray-600">{lecture.course?.title}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {lecture.duration ? formatDuration(lecture.duration) : 'N/A'}
            </TableCell>
            <TableCell>
              <Badge variant={lecture.videoUrl ? 'success' : 'outline'}>
                {lecture.videoUrl ? 'Published' : 'Draft'}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {new Date(lecture.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <ActionsMenu lecture={lecture} onAction={onAction} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

const LecturesGrid = ({ lectures, onAction }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {lectures.map((lecture: LectureWithCourse) => (
      <Card key={lecture._id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-blue-100 rounded-md">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <ActionsMenu lecture={lecture} onAction={onAction} />
          </div>
          <CardTitle className="text-lg font-semibold mt-3 line-clamp-2 h-[56px]">
            {lecture.lectureTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-gray-500 mb-3 line-clamp-1">{lecture.course?.title}</p>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <Badge variant={lecture.videoUrl ? 'success' : 'outline'}>
              {lecture.videoUrl ? 'Published' : 'Draft'}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{lecture.duration ? formatDuration(lecture.duration) : 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const ActionsMenu = ({ lecture, onAction }: any) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onAction('preview', lecture)}>
        <Eye className="w-4 h-4 mr-2" /> Preview
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onAction('edit', lecture)}>
        <Edit className="w-4 h-4 mr-2" /> Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onAction('viewCourse', lecture)}>
        <BookOpen className="w-4 h-4 mr-2" /> View Course
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const EmptyState = ({ navigate }: { navigate: (path: string) => void }) => (
  <div className="text-center py-16 px-6 bg-white rounded-lg border-2 border-dashed">
    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
      <Video className="w-8 h-8 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mt-4">No Lectures Found</h3>
    <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
      It seems you haven't added any lectures yet. Start by creating a course and then add your lectures.
    </p>
    <Button onClick={() => navigate('/teacher/courses')}>
      <Plus className="w-4 h-4 mr-2" />
      Create a New Course
    </Button>
  </div>
);

const LecturesSkeleton = () => (
  <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
    <Skeleton className="h-16" />
    <Skeleton className="h-96" />
  </div>
);


export default LecturesPage;