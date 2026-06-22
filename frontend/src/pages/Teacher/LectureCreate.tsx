import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useCreateLectureMutation } from "@/redux/features/lecture/lectureApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import { useMedia } from "@/hooks/useMediaUpload";
import { useAppDispatch } from "@/redux/hooks";
import { setLectures } from "@/redux/features/lecture/lectureSlice";
import LectureForm from "@/components/Lecture/LectureForm";


// Define VideoResolution interface
interface VideoResolution {
  url: string;
  quality: string;
  format?: string;
}

const LectureCreate = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [createLecture] = useCreateLectureMutation();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadMedia } = useMedia();

  // Get course data for context
  const { data: courseData } = useGetCourseByIdQuery(courseId || "", {
    skip: !courseId,
  });

  const course = courseData?.data;

  const handleSubmit = async (data: any) => {
    const toastId = toast.loading("Creating lecture...");

    const hasVideo = !!data.videoFile;
    const hasAudio = !!data.audioFile;
    const hasArticle = !!(data.articleContent?.trim());
    if (!hasVideo && !hasAudio && !hasArticle) {
      toast.error("Add at least one: video, audio, or article content", { id: toastId });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadPromises: Promise<void>[] = [];
      let videoUrl = "";
      let videoDuration = data.videoDuration || 0;
      let videoResolutions: VideoResolution[] = [];
      let hlsUrl = "";
      let audioUrl = "";
      let pdfUrl = "";

      // Video upload (optional); third arg = Cloudinary streaming_profile (slower when true)
      if (data.videoFile) {
        const useAdaptive = data.videoAdaptiveStreaming !== false;
        uploadPromises.push(
          uploadMedia(data.videoFile, undefined, useAdaptive).then((response) => {
            if (!response?.secure_url) throw new Error("Video upload failed - no URL received");
            videoUrl = response.secure_url;
            videoDuration = response?.duration ?? videoDuration;
            if (response.videoResolutions?.length) {
              videoResolutions = response.videoResolutions;
              const hlsVariant = videoResolutions.find((r: { format?: string }) => r.format === "hls");
              if (hlsVariant) hlsUrl = hlsVariant.url;
            }
          })
        );
      }

      // Audio upload (optional) – stored as raw on Cloudinary
      if (data.audioFile) {
        uploadPromises.push(
          uploadMedia(data.audioFile).then((response) => {
            if (response?.secure_url) audioUrl = response.secure_url;
          })
        );
      }

      // PDF upload (optional)
      if (data.pdfFile) {
        uploadPromises.push(
          uploadMedia(data.pdfFile).then((response) => {
            if (response?.secure_url) pdfUrl = response.secure_url;
          })
        );
      }

      await Promise.all(uploadPromises);

      const lectureData = {
        lectureTitle: data.lectureTitle,
        instruction: data.instruction || undefined,
        isPreviewFree: data.isPreviewFree,
        videoUrl: videoUrl || undefined,
        videoResolutions: videoResolutions.length ? videoResolutions : undefined,
        hlsUrl: hlsUrl || undefined,
        audioUrl: audioUrl || undefined,
        articleContent: data.articleContent?.trim() || undefined,
        duration: videoDuration || undefined,
        pdfUrl: pdfUrl || undefined,
      };

      // Create lecture with all media URLs
      const response = await createLecture({
        data: lectureData,
        id: courseId,
      }).unwrap();

      toast.success("Lecture created successfully!", {
        id: toastId,
      });
      dispatch(setLectures(response.data));
      navigate(`/teacher/courses/${courseId}`);
    } catch (error: unknown) {
      let errorMessage = "Failed to create lecture";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check if it's a Cloudinary error
      if (typeof error === 'object' && error !== null && 'error' in error) {
        const cloudinaryError = error as { error?: { message?: string } };
        if (cloudinaryError.error?.message) {
          errorMessage = `Cloudinary error: ${cloudinaryError.error.message}`;
        }
      }

      toast.error(errorMessage, {
        id: toastId,
      });
      console.error("Upload error details:", error);
    } finally {
      setIsSubmitting(false);
    }
  };



  if (!courseId) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Course</h1>
          <p className="text-gray-600 mb-4">Course ID is missing or invalid.</p>
          <button
            onClick={() => navigate('/teacher/courses')}
            className="text-blue-600 hover:underline"
          >
            Return to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lecture Form */}
      <LectureForm
        courseId={courseId}
        courseName={course?.title}
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default LectureCreate;
