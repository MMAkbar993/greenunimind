import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, BookOpen, Users, Clock, Star } from "lucide-react";
import { useGetAllCategoriesWithSubcategoriesQuery, useGetCoursesByCategoryQuery } from "@/redux/features/category/categoryApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cart/cartSlice";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import { IEnrolledCourse } from "@/types";
import { getPlainTextFromRichText } from "@/utils/renderRichText";

const CategoryBrowse = () => {
  const getEnrolledCourseId = (enrolledCourse: unknown): string => {
    if (typeof enrolledCourse === "string") return enrolledCourse;
    if (!enrolledCourse || typeof enrolledCourse !== "object") return "";

    const raw = enrolledCourse as {
      courseId?: string | { _id?: string };
      _id?: string;
    };

    if (typeof raw.courseId === "string") return raw.courseId;
    if (raw.courseId && typeof raw.courseId === "object" && typeof raw.courseId._id === "string") {
      return raw.courseId._id;
    }
    if (typeof raw._id === "string") return raw._id;

    return "";
  };

  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: userData } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });

  const { data: categoriesData, isLoading: categoriesLoading } = useGetAllCategoriesWithSubcategoriesQuery();
  
  // Find the current category
  const currentCategory = categoriesData?.data?.find(cat => cat.slug === categorySlug);
  const currentSubcategory = subcategorySlug 
    ? currentCategory?.subcategories?.find(sub => sub.slug === subcategorySlug)
    : null;

  // Get courses based on category or subcategory
  const { data: coursesData, isLoading: coursesLoading } = useGetCoursesByCategoryQuery(
    { 
      categoryId: currentCategory?._id || "", 
      page: currentPage, 
      limit: 12 
    },
    { skip: !currentCategory?._id }
  );

  const courses = coursesData?.data || [];
  const meta = coursesData?.meta || {};

  const handleEnroll = (e: React.MouseEvent, course: any) => {
    e.stopPropagation();
    if (!userData?.data?._id) {
      toast.error("Please login to enroll in this course");
      navigate("/login");
      return;
    }

    // Check if student is already enrolled in this course
    const isAlreadyEnrolled = userData?.data?.enrolledCourses?.some(
      (enrolledCourse: IEnrolledCourse | unknown) =>
        getEnrolledCourseId(enrolledCourse) === course._id
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
      (enrolledCourse: IEnrolledCourse | unknown) => getEnrolledCourseId(enrolledCourse) === courseId
    );

  const handleCourseClick = (courseId: string) => {
    navigate(
      isCourseEnrolled(courseId)
        ? `/student/course/${courseId}`
        : `/courses/${courseId}`
    );
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-8">The category you're looking for doesn't exist.</p>
          <Link to="/categories">
            <Button>Browse All Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-green-600">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/categories" className="hover:text-green-600">Categories</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-800 font-medium">{currentCategory.name}</span>
          {currentSubcategory && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-800 font-medium">{currentSubcategory.name}</span>
            </>
          )}
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-xl p-6 sm:p-8 mb-8 shadow-sm border">
          <div className="flex items-start gap-4">
            <div className="text-4xl sm:text-5xl">{currentCategory.icon || '📚'}</div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {currentSubcategory ? currentSubcategory.name : currentCategory.name}
              </h1>
              <p className="text-gray-600 text-base sm:text-lg mb-4">
                {currentSubcategory ? currentSubcategory.description : currentCategory.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{courses.length} courses</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>All levels</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subcategories (if viewing main category) */}
        {!currentSubcategory && currentCategory.subcategories && currentCategory.subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Explore Subcategories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {currentCategory.subcategories.map((subcategory) => (
                <Link
                  key={subcategory._id}
                  to={`/categories/${categorySlug}/${subcategory.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-all duration-300 hover:scale-105 border hover:border-green-300">
                    <h3 className="font-semibold text-gray-800 text-sm group-hover:text-green-600 transition-colors">
                      {subcategory.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Courses Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {currentSubcategory ? `${currentSubcategory.name} Courses` : `${currentCategory.name} Courses`}
            </h2>
            <Badge variant="secondary" className="text-sm">
              {meta.total || courses.length} courses
            </Badge>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => (
                <Card
                  key={course._id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border hover:border-green-300"
                  onClick={() => handleCourseClick(course._id)}
                >
                  <CardContent className="p-0">
                    <div
                      className="h-48 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${course.courseThumbnail || "/images/default-course.jpg"})`,
                      }}
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {getPlainTextFromRichText(course.description) || "No description available"}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{course.lectures?.length || 0} lectures</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={(e) => handleEnroll(e, course)}
                        >
                          {isCourseEnrolled(course._id) ? "Enrolled" : "Enroll Now"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No courses found</h3>
              <p className="text-gray-500 mb-6">
                There are no courses available in this category yet.
              </p>
              <Link to="/courses">
                <Button>Browse All Courses</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.totalPage > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryBrowse;
