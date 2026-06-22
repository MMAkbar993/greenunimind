import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetPublishedCoursesQuery } from '@/redux/features/course/courseApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { addToCart } from '@/redux/features/cart/cartSlice';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/Pagination';
import { ICourse } from '@/types/course';
import { useGetAllCategoriesQuery } from '@/redux/features/category/categoryApi';
import {
  Search,
  Filter,
  SlidersHorizontal,
  BookOpen,
  Users,
  Clock,
  Award,
  Star,
  ChevronRight,
  Sparkles,
  Tag,
  GraduationCap
} from 'lucide-react';
import AdPlacement from '@/components/ads/AdPlacement';
import { debugOnly } from '@/utils/logger';
import { getPlainTextFromRichText } from '@/utils/renderRichText';

const AllCourses = () => {
  const getCategoryKey = (rawCategory: unknown): string => {
    if (!rawCategory) return '';
    if (typeof rawCategory === 'string') return rawCategory;
    if (typeof rawCategory === 'object') {
      const parsedCategory = rawCategory as { _id?: string; id?: string; name?: string };
      if (typeof parsedCategory._id === 'string') return parsedCategory._id;
      if (typeof parsedCategory.id === 'string') return parsedCategory.id;
      if (typeof parsedCategory.name === 'string') return parsedCategory.name;
    }
    return String(rawCategory);
  };

  const getEnrolledCourseId = (enrolledCourse: unknown): string => {
    if (typeof enrolledCourse === 'string') return enrolledCourse;
    if (!enrolledCourse || typeof enrolledCourse !== 'object') return '';

    const raw = enrolledCourse as {
      courseId?: string | { _id?: string };
      _id?: string;
    };

    if (typeof raw.courseId === 'string') return raw.courseId;
    if (raw.courseId && typeof raw.courseId === 'object' && typeof raw.courseId._id === 'string') {
      return raw.courseId._id;
    }
    if (typeof raw._id === 'string') return raw._id;

    return '';
  };

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Get search term from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const searchFromUrl = queryParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { data: courses, isLoading, isError } = useGetPublishedCoursesQuery(undefined);
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: userData } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });

  // Update search term when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchFromUrl = params.get('search') || '';
    setSearchTerm(searchFromUrl);
  }, [location.search]);

  // Extract unique categories and levels from courses
  const categoryLookup = (categoriesData?.data || []).reduce<Record<string, string>>((acc, category) => {
    acc[category._id] = category.name;
    return acc;
  }, {});

  const categories = courses?.data
    ? Array.from(
        new Set(
          courses.data
            .map((course: ICourse) => getCategoryKey(course.category))
            .filter(Boolean)
        )
      )
    : [];

  const levels = courses?.data ?
    Array.from(new Set(courses.data.map((course: ICourse) => course.courseLevel))) :
    [];

  // Filter courses based on search term and filters
  const filteredCourses = courses?.data ?
    courses.data.filter((course: ICourse) => {
      const matchesSearch = searchTerm === '' ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (getPlainTextFromRichText(course.description).toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === null || getCategoryKey(course.category) === selectedCategory;
      const matchesLevel = selectedLevel === null || course.courseLevel === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    }) :
    [];

  // Pagination logic
  const coursesPerPage = 9;
  const totalPages = Math.ceil((filteredCourses?.length || 0) / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses?.slice(indexOfFirstCourse, indexOfLastCourse);

  const handleEnroll = (e: React.MouseEvent, course: ICourse) => {
    e.stopPropagation();
    if (!userData?.data?._id) {
      toast.error("Please login to enroll in this course");
      navigate("/login");
      return;
    }

    // Check if student is already enrolled in this course
    const isAlreadyEnrolled = userData?.data?.enrolledCourses?.some(
      (enrolledCourse: unknown) => getEnrolledCourseId(enrolledCourse) === course._id
    );

    if (isAlreadyEnrolled) {
      navigate(`/student/course/${course._id}`);
      return;
    }

    dispatch(addToCart({ course, userId: userData.data._id }));
    toast.success("Course added to cart");
  };

  const isCourseEnrolled = (courseId?: string) =>
    !!courseId &&
    userData?.data?.enrolledCourses?.some(
      (enrolledCourse: unknown) => getEnrolledCourseId(enrolledCourse) === courseId
    );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedLevel(null);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Courses</h2>
          <p className="text-gray-600 mb-6">We encountered a problem while loading the courses. Please try again later.</p>
          <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9fafb] min-h-screen mt-5">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <div className="absolute top-10 left-[10%] w-64 h-64 rounded-full bg-green-300 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-10 right-[10%] w-72 h-72 rounded-full bg-blue-300 opacity-20 blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-yellow-200 opacity-20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Left Content */}
            <div className="md:w-1/2 text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span>Discover Your Potential</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-4">
                  Explore Our <span className="text-green-600 relative">
                    Courses
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5.5C50 -0.5 150 -0.5 299 5.5" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-8 leading-relaxed">
                  Discover a wide range of courses designed to help you master new skills, advance your career, and explore your passions.
                </p>

                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative max-w-xl"
                >
                  <div className="relative flex items-center">
                    <Input
                      type="text"
                      placeholder="Search for courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full py-6 pl-14 pr-4 text-gray-700 bg-white rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    />
                    <div className="absolute left-4 flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                      <Search className="text-green-600" size={18} />
                    </div>
                    <Button
                      className="absolute right-2 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 px-4"
                      onClick={() => debugOnly.log("Search for:", searchTerm)}
                    >
                      Search
                    </Button>
                  </div>
                </motion.div>

                {/* Popular Categories */}
                <div className="mt-8 hidden md:block">
                  <p className="text-sm text-gray-500 mb-3">Popular Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Programming', 'Design', 'Business', 'Marketing'].map((category, index) => (
                      <motion.button
                        key={category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + (index * 0.1) }}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center"
                        onClick={() => setSelectedCategory(category)}
                      >
                        <Tag className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                        {category}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Content - Illustration */}
            <motion.div
              className="md:w-1/2 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-green-100 rounded-full opacity-60"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-100 rounded-full opacity-60"></div>

                <img
                  src="/images/image11.png"
                  alt="Learning Illustration"
                  className="relative z-10 w-full h-auto rounded-2xl shadow-xl"
                />

                {/* Stats Floating Card */}
                <motion.div
                  className="absolute -bottom-5 -left-5 bg-white rounded-xl shadow-lg p-4 z-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Courses</p>
                      <p className="text-lg font-bold text-gray-900">{courses?.data?.length || 0}+</p>
                    </div>
                  </div>
                </motion.div>

                {/* Rating Floating Card */}
                <motion.div
                  className="absolute -top-5 -right-5 bg-white rounded-xl shadow-lg p-4 z-20"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Top Rated</p>
                      <div className="flex items-center">
                        <p className="text-lg font-bold text-gray-900 mr-1">4.9</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 sticky top-24 border border-gray-100">
                {/* Ad in sidebar - between courses */}
                <div className="mb-6">
                  <AdPlacement placement="courses" format="vertical" />
                </div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center text-gray-800">
                    <Filter className="mr-2 text-green-600" size={20} />
                    Filters
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Category Filter */}
                <div className="mb-8">
                  <h4 className="font-medium mb-4 text-gray-800 flex items-center">
                    <Tag className="mr-2 text-green-600 h-4 w-4" />
                    Categories
                  </h4>
                  <div className="space-y-3">
                    {isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full rounded-lg" />
                      ))
                    ) : (
                      categories.map((category, index) => (
                        <motion.div
                          key={index}
                          className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedCategory === category
                              ? 'bg-green-50 border-l-4 border-green-500'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedCategory(selectedCategory === category ? null : (category as string))}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                            selectedCategory === category ? 'bg-green-500' : 'border-2 border-gray-300'
                          }`}>
                            {selectedCategory === category && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                          </div>
                          <span className={`${selectedCategory === category ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                            {categoryLookup[String(category)] || String(category)}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Level Filter */}
                <div className="mb-8">
                  <h4 className="font-medium mb-4 text-gray-800 flex items-center">
                    <GraduationCap className="mr-2 text-green-600 h-4 w-4" />
                    Level
                  </h4>
                  <div className="space-y-3">
                    {isLoading ? (
                      Array(3).fill(0).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full rounded-lg" />
                      ))
                    ) : (
                      levels.map((level, index) => (
                        <motion.div
                          key={index}
                          className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedLevel === level
                              ? 'bg-green-50 border-l-4 border-green-500'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedLevel(selectedLevel === level ? '' : level as string)}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                            selectedLevel === level ? 'bg-green-500' : 'border-2 border-gray-300'
                          }`}>
                            {selectedLevel === level && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                          </div>
                          <span className={`${selectedLevel === level ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                            {String(level)}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mb-3 mx-auto">
                        <BookOpen className="text-green-600 h-5 w-5" />
                      </div>
                      <p className="text-center text-2xl font-bold text-gray-800">{courses?.data?.length || 0}</p>
                      <p className="text-center text-xs text-gray-600">Courses</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mb-3 mx-auto">
                        <Users className="text-blue-600 h-5 w-5" />
                      </div>
                      <p className="text-center text-2xl font-bold text-gray-800">1000+</p>
                      <p className="text-center text-xs text-gray-600">Students</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-5 text-white">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Why Choose Us
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <Clock className="h-4 w-4 mr-2 mt-0.5 text-green-200" />
                        <span>Learn at your own pace</span>
                      </li>
                      <li className="flex items-start">
                        <Award className="h-4 w-4 mr-2 mt-0.5 text-green-200" />
                        <span>Earn certificates</span>
                      </li>
                      <li className="flex items-start">
                        <Star className="h-4 w-4 mr-2 mt-0.5 text-green-200" />
                        <span>Expert instructors</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="lg:w-3/4">
              {/* Results Header */}
              <div className="bg-white rounded-2xl shadow-md p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
                    {searchTerm ? (
                      <>
                        <Search className="mr-2 text-green-600" size={20} />
                        Results for "{searchTerm}"
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 text-green-600" size={20} />
                        All Courses
                      </>
                    )}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Showing <span className="font-medium">{currentCourses?.length || 0}</span> of <span className="font-medium">{filteredCourses?.length || 0}</span> courses
                  </p>
                </div>
                <div className="flex items-center mt-4 sm:mt-0 bg-gray-50 rounded-lg p-1.5">
                  <SlidersHorizontal size={16} className="mr-2 text-gray-500" />
                  <select
                    className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-gray-700"
                    onChange={(e) => {
                      // Sort logic would go here
                      debugOnly.log(e.target.value);
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="a-z">A-Z</option>
                    <option value="z-a">Z-A</option>
                  </select>
                </div>
              </div>

              {/* Courses */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6).fill(0).map((_, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="p-1">
                        <Skeleton className="w-full h-[200px] rounded-xl" />
                      </div>
                      <div className="p-5">
                        <Skeleton className="h-7 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-10 w-28 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <AnimatePresence>
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {currentCourses.map((course: ICourse) => (
                      <motion.div
                        key={course._id}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                      >
                        {/* Card Header with Image */}
                        <div className="relative">
                          <div className="p-2">
                            <div
                              className="w-full h-[200px] rounded-xl bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${
                                  course.courseThumbnail ||
                                  "/images/default-course.jpg"
                                })`,
                              }}
                            />
                          </div>

                          {/* Level Badge */}
                          <div className="absolute top-4 left-4">
                            <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-800 shadow-sm flex items-center">
                              <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                              {course.courseLevel}
                            </div>
                          </div>

                          {/* Lectures Count */}
                          <div className="absolute bottom-4 right-4">
                            <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white shadow-sm flex items-center">
                              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                              {course.lectures?.length || 0} lectures
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div
                          className="p-5"
                          onClick={() =>
                            navigate(
                              isCourseEnrolled(course._id)
                                ? `/student/course/${course._id}`
                                : `/courses/${course._id}`
                            )
                          }
                        >
                          <div className="mb-3">
                            <div className="flex items-center mb-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                ))}
                              </div>
                              <span className="text-xs text-gray-500 ml-2">(24 reviews)</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-xl mb-2 line-clamp-1 hover:text-green-600 transition-colors cursor-pointer">
                              {course.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                              {getPlainTextFromRichText(course.description) || "No description available"}
                            </p>
                          </div>

                          {/* Card Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-xs text-gray-500 ml-2">{course.enrolledStudents?.length || 0} students</span>
                            </div>

                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm px-4 py-2 flex items-center gap-1"
                              onClick={(e) => handleEnroll(e, course)}
                            >
                              {isCourseEnrolled(course._id) ? "Enrolled" : "Enroll Now"}
                              {!isCourseEnrolled(course._id) && <ChevronRight className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-12 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                      <Search className="text-red-400" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">No Courses Found</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      We couldn't find any courses matching your search criteria. Try adjusting your filters or search term.
                    </p>
                    <Button
                      onClick={handleClearFilters}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-base flex items-center gap-2"
                    >
                      Clear Filters
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Pagination */}
              {filteredCourses.length > coursesPerPage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 flex justify-center"
                >
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full opacity-20 -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full opacity-20 translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12 lg:p-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to Start Learning?</h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Join thousands of students who are already learning and growing with our courses. Start your journey today!
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-base">
                      Browse All Courses
                    </Button>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl text-base">
                      Learn More
                    </Button>
                  </div>
                </motion.div>
              </div>
              <div className="md:w-1/2 bg-gradient-to-br from-green-500 to-blue-500 p-8 md:p-12 lg:p-16 text-white relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h3 className="text-2xl font-bold mb-6">Why Our Students Love Us</h3>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                        <Star className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg mb-1">High-Quality Content</h4>
                        <p className="text-green-100">Courses designed by industry experts with real-world applications.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg mb-1">Flexible Learning</h4>
                        <p className="text-green-100">Learn at your own pace, on your own schedule, from anywhere.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg mb-1">Certificates</h4>
                        <p className="text-green-100">Earn certificates to showcase your skills and achievements.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mb-16 -mr-16"></div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mt-8 -mr-8"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AllCourses;