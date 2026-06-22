import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { addToCart } from '@/redux/features/cart/cartSlice';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ICourse } from '@/types/course';
import { IEnrolledCourse } from '@/types/student';
import {
  Star,
  Users,
  BookOpen,
  Clock,
  Award,
  Heart,
  Share2,
  Play,
  CheckCircle,
} from 'lucide-react';

interface UdemyStyleCourseCardProps {
  course: ICourse;
  showPrice?: boolean;
  showEnrollButton?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
}

const UdemyStyleCourseCard = ({ 
  course, 
  showPrice = true, 
  showEnrollButton = true,
  className = "",
  variant = 'default'
}: UdemyStyleCourseCardProps) => {
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
    navigate(isEnrolled ? `/student/course/${course._id}` : `/courses/${course._id}`);
  };

  const isEnrolled = userData?.data?.enrolledCourses?.some(
    (enrolledCourse: IEnrolledCourse | string | { _id?: string; courseId?: string | { _id?: string } }) =>
      getEnrolledCourseId(enrolledCourse) === course._id
  );

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Added to wishlist");
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + `/courses/${course._id}`);
    toast.success("Course link copied to clipboard");
  };

  // Calculate total duration from lectures
  const totalDuration = course.lectures?.length ? course.lectures.length * 45 : 0;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Mock rating data (replace with actual data)
  const mockRating = 4.5;
  const mockReviewCount = Math.floor(Math.random() * 500) + 50;
  const mockStudentCount = Math.floor(Math.random() * 10000) + 1000;

  // Get instructor name
  const instructorName = typeof course.creator === 'object' && course.creator && 'name' in course.creator
    ? (typeof course.creator.name === 'string'
        ? course.creator.name
        : `${course.creator.name?.firstName || ''} ${course.creator.name?.lastName || ''}`.trim() || 'Expert Instructor')
    : 'Expert Instructor';

  return (
    <motion.div
      className={`group bg-white border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer overflow-hidden ${
        variant === 'compact' ? 'rounded-lg' : 'rounded-xl'
      } ${className}`}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={handleCardClick}
    >
      {/* Course Image */}
      <div className="relative overflow-hidden">
        <div 
          className={`w-full bg-cover bg-center bg-gray-100 ${
            variant === 'compact' ? 'h-32 sm:h-40' : 'h-40 sm:h-48'
          }`}
          style={{
            backgroundImage: `url(${
              course.courseThumbnail || "/images/default-course.jpg"
            })`,
          }}
        >
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlist}
            className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Level badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs font-medium bg-white/90 text-gray-800">
            {course.courseLevel}
          </Badge>
        </div>

        {/* Bestseller badge (conditional) */}
        {mockStudentCount > 5000 && (
          <div className="absolute bottom-2 left-2">
            <Badge className="text-xs font-medium bg-orange-500 text-white">
              Bestseller
            </Badge>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className={`${variant === 'compact' ? 'p-3' : 'p-4'}`}>
        {/* Course Title */}
        <h3 className={`font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors ${
          variant === 'compact' ? 'text-sm' : 'text-base'
        }`}>
          {course.title}
        </h3>

        {/* Instructor */}
        <p className={`text-gray-600 mb-2 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
          {instructorName}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <span className={`font-bold text-orange-500 mr-1 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
            {mockRating.toFixed(1)}
          </span>
          <div className="flex mr-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`${variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} ${
                  star <= Math.floor(mockRating) 
                    ? "text-orange-400 fill-orange-400" 
                    : star - 0.5 <= mockRating 
                      ? "text-orange-400 fill-orange-400" 
                      : "text-gray-300"
                }`} 
              />
            ))}
          </div>
          <span className={`text-gray-500 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
            ({mockReviewCount.toLocaleString()})
          </span>
        </div>

        {/* Course Stats */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center">
            <Clock className={`${variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500 mr-1`} />
            <span className={`text-gray-600 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
              {formatDuration(totalDuration)}
            </span>
          </div>
          <div className="flex items-center">
            <BookOpen className={`${variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500 mr-1`} />
            <span className={`text-gray-600 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
              {course.lectures?.length || 0} lectures
            </span>
          </div>
        </div>

        {/* Price and Enroll */}
        <div className="flex items-center justify-between">
          {showPrice && (
            <div className="flex items-center">
              {course.coursePrice && course.coursePrice > 0 ? (
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-gray-900 ${variant === 'compact' ? 'text-base' : 'text-lg'}`}>
                    ${course.coursePrice}
                  </span>
                  {/* Mock original price for discount effect */}
                  <span className={`text-gray-500 line-through ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
                    ${Math.round(course.coursePrice * 1.5)}
                  </span>
                </div>
              ) : (
                <span className={`font-bold text-green-600 ${variant === 'compact' ? 'text-base' : 'text-lg'}`}>
                  Free
                </span>
              )}
            </div>
          )}

          {showEnrollButton && variant !== 'compact' && (
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 hover:scale-105"
              onClick={handleEnroll}
            >
              {isEnrolled ? "Enrolled" : "Enroll Now"}
            </Button>
          )}
        </div>

        {/* Compact variant enroll button */}
        {showEnrollButton && variant === 'compact' && (
          <Button
            size="sm"
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs transition-all duration-200 hover:scale-105"
            onClick={handleEnroll}
          >
            {isEnrolled ? "Enrolled" : "Enroll Now"}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default UdemyStyleCourseCard;
