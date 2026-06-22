import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { addToCart } from '@/redux/features/cart/cartSlice';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ICourse } from '@/types/course';
import { IEnrolledCourse } from '@/types/student';
import {
  Star,
  Users,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Clock,
  Award,
} from 'lucide-react';
import { getPlainTextFromRichText } from '@/utils/renderRichText';

interface CourseCardProps {
  course: ICourse;
  showPrice?: boolean;
  showEnrollButton?: boolean;
  className?: string;
}

const CourseCard = ({ 
  course, 
  showPrice = true, 
  showEnrollButton = true,
  className = ""
}: CourseCardProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: userData } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });

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

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userData?.data?._id) {
      toast.error("Please login to enroll in this course");
      navigate("/login");
      return;
    }

    // Check if student is already enrolled in this course
    const isAlreadyEnrolled = userData?.data?.enrolledCourses?.some(
      (enrolledCourse: IEnrolledCourse | string | { _id?: string; courseId?: string | { _id?: string } }) =>
        getEnrolledCourseId(enrolledCourse) === course._id
    );

    if (isAlreadyEnrolled) {
      navigate(`/student/course/${course._id}`);
      return;
    }

    dispatch(addToCart({ course, userId: userData.data._id }));
    toast.success("Course added to cart");
  };

  const handleCardClick = () => {
    const isAlreadyEnrolled = userData?.data?.enrolledCourses?.some(
      (enrolledCourse: IEnrolledCourse | string | { _id?: string; courseId?: string | { _id?: string } }) =>
        getEnrolledCourseId(enrolledCourse) === course._id
    );

    navigate(isAlreadyEnrolled ? `/student/course/${course._id}` : `/courses/${course._id}`);
  };

  // Calculate total duration from lectures (mock data for now)
  const totalDuration = course.lectures?.length ? course.lectures.length * 45 : 0; // Assuming 45 min per lecture
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Mock rating data (you can replace this with actual rating data from reviews)
  const mockRating = 4.5;
  const mockReviewCount = Math.floor(Math.random() * 500) + 50;

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full ${className}`}
      whileHover={{ y: -5 }}
      onClick={handleCardClick}
    >
      {/* Course Thumbnail */}
      <div className="relative flex-shrink-0">
        <div className="p-2">
          <div
            className="w-full h-[200px] rounded-xl bg-cover bg-center bg-gray-100"
            style={{
              backgroundImage: `url(${
                course.courseThumbnail || "/images/default-course.jpg"
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

        {/* Duration Badge */}
        {totalDuration > 0 && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm rounded-lg text-xs font-medium text-white shadow-sm flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {formatDuration(totalDuration)}
            </div>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <span className="font-bold text-sm text-gray-900 mr-2">{mockRating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.floor(mockRating)
                      ? "text-yellow-400 fill-yellow-400"
                      : star - 0.5 <= mockRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500 ml-2">({mockReviewCount.toLocaleString()} reviews)</span>
        </div>

        {/* Course Title */}
        <h3 className="font-bold text-gray-900 text-xl mb-2 line-clamp-2 hover:text-green-600 transition-colors">
          {course.title}
        </h3>

        {/* Course Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">
          {getPlainTextFromRichText(course.description) || "No description available"}
        </p>

        {/* Instructor Info */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <Award className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {typeof course.creator === 'object' && course.creator && 'name' in course.creator
                ? (typeof course.creator.name === 'string'
                    ? course.creator.name
                    : `${(course.creator.name as any)?.firstName || ''} ${(course.creator.name as any)?.lastName || ''}`.trim() || 'Expert Instructor')
                : 'Expert Instructor'}
            </p>
            <p className="text-xs text-gray-500">Course Instructor</p>
          </div>
        </div>

        {/* Course Footer */}
        <div className="mt-auto">
          {/* Stats and Price Row */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500 ml-1">
                {course.totalEnrollment || course.enrolledStudents?.length || 0} students
              </span>
            </div>

            {showPrice && (
              <div className="text-right">
                {course.coursePrice && course.coursePrice > 0 ? (
                  <span className="text-lg font-bold text-gray-900">
                    ${course.coursePrice}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-green-600">Free</span>
                )}
              </div>
            )}
          </div>

          {/* Enroll Button Row */}
          {showEnrollButton && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm px-4 py-2 flex items-center justify-center gap-1"
              onClick={handleEnroll}
            >
              {userData?.data?.enrolledCourses?.some(
                (enrolledCourse: IEnrolledCourse | string | { _id?: string; courseId?: string | { _id?: string } }) =>
                  getEnrolledCourseId(enrolledCourse) === course._id
              ) ? "Enrolled" : "Enroll Now"}
              {!userData?.data?.enrolledCourses?.some(
                (enrolledCourse: IEnrolledCourse | string | { _id?: string; courseId?: string | { _id?: string } }) =>
                  getEnrolledCourseId(enrolledCourse) === course._id
              ) && <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
