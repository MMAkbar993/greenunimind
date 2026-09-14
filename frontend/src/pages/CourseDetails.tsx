import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cart/cartSlice";
import { toast } from "sonner";
import { ShoppingBag, CheckCircle2, Lock, PlayCircle, Award, Users, BookOpen, GraduationCap } from "lucide-react";
import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Skeleton } from "@/components/ui/skeleton";
import { IEnrolledCourse } from "@/types";
import { ILecture } from "@/types/course";
import BuyNowButton from "@/components/Course/BuyNowButton";
import { renderCourseDescription } from "@/utils/renderRichText";

const formatDuration = (minutes = 0) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const CourseDetails = () => {
  const { courseId } = useParams();
  const { data: courseData, isLoading } = useGetCourseByIdQuery(courseId);
  const { data: userData } = useGetMeQuery(undefined);
  const dispatch = useAppDispatch();

  const course = courseData?.data;
  const lectures = useMemo(
    () => [...(course?.lectures || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [course?.lectures]
  );
  // A lecture's videoUrl only reaches us here if the backend decided this
  // viewer is allowed to watch it (enrolled, creator, or isPreviewFree) —
  // its presence is what we use to decide what's playable vs locked.
  const previewLectures = useMemo(() => lectures.filter((l) => l.videoUrl), [lectures]);
  const [activePreview, setActivePreview] = useState<ILecture | null>(null);
  const currentPreview = activePreview || previewLectures[0] || null;

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 my-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="w-full h-64 rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="container mx-auto py-24 mt-20 text-center text-gray-600">Course not found</div>;
  }

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

  return (
    <div className="container mx-auto px-4 py-12 mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Preview video / thumbnail */}
          <div className="rounded-lg overflow-hidden bg-black">
            {currentPreview?.videoUrl ? (
              <video
                key={currentPreview._id}
                src={currentPreview.videoUrl}
                controls
                poster={course.courseThumbnail}
                className="w-full aspect-video bg-black"
              />
            ) : (
              <img
                src={course.courseThumbnail || "/images/default-course.svg"}
                alt={course.title}
                className="w-full aspect-video object-cover"
              />
            )}
          </div>
          {currentPreview && (
            <p className="-mt-6 text-sm text-gray-500 flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-green-600" />
              Free preview: {currentPreview.lectureTitle}
            </p>
          )}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.subtitle && <p className="text-gray-600 mt-2">{course.subtitle}</p>}
            <div
              className="text-gray-600 mt-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderCourseDescription(course.description) }}
            />
          </div>

          {/* What you'll learn */}
          {course.learningObjectives && course.learningObjectives.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What you'll learn</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {course.learningObjectives.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum */}
          {lectures.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Curriculum</h2>
              <Accordion type="single" collapsible className="border border-gray-200 rounded-lg divide-y">
                {lectures.map((lecture, i) => {
                  const unlocked = Boolean(lecture.videoUrl);
                  return (
                    <AccordionItem key={lecture._id} value={lecture._id} className="border-none px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left flex-1">
                          {unlocked ? (
                            <PlayCircle className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-800">
                            {i + 1}. {lecture.lectureTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 mr-2">
                          {lecture.isPreviewFree && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">Preview</Badge>
                          )}
                          {lecture.duration ? (
                            <span className="text-xs text-gray-500">{formatDuration(lecture.duration)}</span>
                          ) : null}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {unlocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActivePreview(lecture)}
                            className="text-green-700 border-green-300"
                          >
                            <PlayCircle className="w-4 h-4 mr-1.5" /> Watch preview
                          </Button>
                        ) : (
                          <p className="text-sm text-gray-500">Enroll to unlock this lecture.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {/* Requirements */}
          {course.prerequisites && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-1.5 text-gray-700 text-sm">
                {course.prerequisites
                  .split(/\r?\n/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
              </ul>
            </div>
          )}

          {/* Who this course is for */}
          {course.targetAudience && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Who this course is for</h2>
              <p className="text-gray-700 text-sm whitespace-pre-line">{course.targetAudience}</p>
            </div>
          )}

          {/* Certificate */}
          <div className="border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-green-50 to-white">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-green-500 flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Earn a certificate</h3>
              <p className="text-sm text-gray-600 mt-1">
                Complete every lecture in this course to receive a GreenUniMind Certificate of Completion, downloadable as a PDF from your dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="text-3xl font-bold text-gray-900">
              {course.coursePrice ? `$${course.coursePrice}` : "Free"}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> {lectures.length} lectures
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> {course.courseLevel}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" /> {course.enrolledStudents?.length || 0} enrolled
              </div>
            </div>

            <div className="pt-2 space-y-2">
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
                    courseId={courseId || ""}
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
    </div>
  );
};

export default CourseDetails;
