import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cart/cartSlice";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Skeleton } from "@/components/ui/skeleton";
import { IEnrolledCourse } from "@/types";
import BuyNowButton from "@/components/Course/BuyNowButton";
import { renderCourseDescription } from "@/utils/renderRichText";

const CourseDetails = () => {
  const { courseId } = useParams();
  const { data: courseData, isLoading } = useGetCourseByIdQuery(courseId);
  const { data: userData } = useGetMeQuery(undefined);
  const dispatch = useAppDispatch();

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 my-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Skeleton className="w-full h-64 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!courseData?.data) {
    return <div>Course not found</div>;
  }

  const course = courseData.data;
  const isEnrolled = userData?.data?.enrolledCourses?.some(
    (enrolledCourse: IEnrolledCourse) => enrolledCourse.courseId === courseId
  );

  const handleEnroll = () => {
    if (!userData?.data?._id) {
      toast.error("Please login to enroll in this course");
      return;
    }

    if (isEnrolled) {
      toast.error("You are already enrolled in this course");
      return;
    }

    dispatch(addToCart({ course, userId: userData.data._id }));
    toast.success("Course added to cart");
  };

  // Checkout is now handled by the BuyNowButton component

  return (
    <div className="container mx-auto py-12 mt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={course.courseThumbnail}
            alt={course.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <div
            className="text-gray-600"
            dangerouslySetInnerHTML={{
              __html: renderCourseDescription(course.description)
            }}
          />
          <div className="flex items-center gap-2">
            <span className="font-semibold">Price:</span>
            <span className="text-2xl font-bold">
              ${course.coursePrice || "Free"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Duration:</span>
            <span>{course.lectures?.length || 0} lectures</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Level:</span>
            <span>{course.courseLevel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Students:</span>
            <span>{course.enrolledStudents?.length || 0} enrolled</span>
          </div>
          <div className="pt-4 space-y-2">
            {isEnrolled ? (
              <Button className="w-full" disabled>
                Already Enrolled
              </Button>
            ) : (
              <>
                <Button className="w-full" onClick={handleEnroll}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <BuyNowButton
                  courseId={courseId || ''}
                  isEnrolled={isEnrolled}
                  className="w-full"
                  variant="outline"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
