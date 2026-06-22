import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, File, FileType, Headphones, Loader, Upload, Video, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import ReactPlayer from "react-player/lazy";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  useUpdateLectureMutation,
  useGetLectureByIdQuery,
} from "@/redux/features/lecture/lectureApi";
import { useMedia } from "@/hooks/useMediaUpload";
import { formatBytes } from "@/utils/uploadMedia";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
} from "@/components/ui/file-upload";

// Lecture upload schema
const lectureSchema = z.object({
  lectureTitle: z
    .string({
      required_error: "Lecture title is required",
    })
    .min(5, { message: "Title must be at least 5 characters" }),
  instruction: z.string().optional(),
  isPreviewFree: z.boolean().default(false),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  articleContent: z.string().optional(),
  pdfUrl: z.string().optional().or(z.literal("")),
  duration: z.number().optional(),
});

type LectureFormValues = z.infer<typeof lectureSchema>;

const EditLecture = () => {
  const { courseId, lectureId } = useParams<{
    courseId: string;
    lectureId: string;
  }>();
  const navigate = useNavigate();

  // Validate required parameters
  useEffect(() => {
    if (!courseId || !lectureId) {
      toast.error("Missing course or lecture ID");
      navigate("/teacher/courses");
      return;
    }
  }, [courseId, lectureId, navigate]);

  const [updateLecture, { isLoading }] = useUpdateLectureMutation();
  const { data: lectureData, isLoading: isLectureLoading } =
    useGetLectureByIdQuery(
      { id: lectureId! },
      { skip: !lectureId }
    );



  // Media upload hooks
  const {
    uploadMedia: uploadVideo,
    progress: videoProgress,
    isUploading: isVideoUploading,
  } = useMedia();

  const {
    uploadMedia: uploadAudio,
    isUploading: isAudioUploading,
  } = useMedia();

  const {
    uploadMedia: uploadPdf,
    progress: pdfProgress,
    isUploading: isPdfUploading,
  } = useMedia();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoAdaptiveStreaming, setVideoAdaptiveStreaming] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  const [existingAudioUrl, setExistingAudioUrl] = useState("");
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: {
      lectureTitle: "",
      instruction: "",
      isPreviewFree: false,
      videoUrl: "",
      audioUrl: "",
      articleContent: "",
      pdfUrl: "",
    },
  });

  useEffect(() => {
    if (lectureData?.data) {
      const lecture = lectureData.data;
      setExistingVideoUrl(lecture.videoUrl || "");
      setExistingAudioUrl(lecture.audioUrl || "");
      setExistingPdfUrl(lecture.pdfUrl || "");

      form.reset({
        lectureTitle: lecture.lectureTitle,
        instruction: lecture.instruction || "",
        isPreviewFree: lecture.isPreviewFree || false,
        videoUrl: lecture.videoUrl || "",
        audioUrl: lecture.audioUrl || "",
        articleContent: lecture.articleContent || "",
        pdfUrl: lecture.pdfUrl || "",
        duration: lecture.duration,
      });
      setHasUnsavedChanges(false);
    }
  }, [lectureData, form]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && lectureData?.data) {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, lectureData]);

  // Disabled auto-save to prevent conflicts with manual saves and cache invalidation
  // Auto-save functionality has been removed to ensure better cache management
  // and prevent conflicts with manual save operations

  const handleVideoChange = useCallback(async (file: File | undefined) => {
    if (!file) {
      setVideoFile(null);
      form.setValue("videoUrl", existingVideoUrl, { shouldValidate: true });
      return;
    }

    if (!file.type.includes("video/")) {
      toast.error("Please upload a valid video file");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be less than 500MB");
      return;
    }

    setVideoFile(file);
    form.setValue("videoUrl", file.name, { shouldValidate: true });
  }, [form, existingVideoUrl]);

  const handlePdfChange = useCallback(async (file: File | undefined) => {
    if (!file) {
      setPdfFile(null);
      form.setValue("pdfUrl", existingPdfUrl, { shouldValidate: true });
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF must be less than 50MB");
      return;
    }

    setPdfFile(file);
    form.setValue("pdfUrl", file.name, { shouldValidate: true });
  }, [form, existingPdfUrl]);

  const removeVideo = useCallback(() => {
    setVideoFile(null);
    form.setValue("videoUrl", existingVideoUrl, { shouldValidate: true });
  }, [form, existingVideoUrl]);

  const removePdf = useCallback(() => {
    setPdfFile(null);
    form.setValue("pdfUrl", existingPdfUrl, { shouldValidate: true });
  }, [form, existingPdfUrl]);

  const removeExistingVideo = useCallback(() => {
    setExistingVideoUrl("");
    form.setValue("videoUrl", "", { shouldValidate: true });
  }, [form]);

  const removeExistingPdf = useCallback(() => {
    setExistingPdfUrl("");
    form.setValue("pdfUrl", "", { shouldValidate: true });
  }, [form]);

  const handleAudioChange = useCallback((file: File | undefined) => {
    if (!file) {
      setAudioFile(null);
      form.setValue("audioUrl", existingAudioUrl, { shouldValidate: true });
      return;
    }
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload a valid audio file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Audio must be less than 100MB");
      return;
    }
    setAudioFile(file);
    form.setValue("audioUrl", file.name, { shouldValidate: true });
  }, [form, existingAudioUrl]);

  const removeAudio = useCallback(() => {
    setAudioFile(null);
    form.setValue("audioUrl", existingAudioUrl, { shouldValidate: true });
  }, [form, existingAudioUrl]);

  const removeExistingAudio = useCallback(() => {
    setExistingAudioUrl("");
    form.setValue("audioUrl", "", { shouldValidate: true });
  }, [form]);

  const onSubmit = async (data: LectureFormValues) => {
    const toastId = toast.loading("Updating lecture...");
    setIsSubmitting(true);

    // Disable auto-save during manual save to prevent conflicts
    setHasUnsavedChanges(false);

    try {
      let videoUrl = existingVideoUrl;
      let videoDuration = data.duration || 0;
      let audioUrl = existingAudioUrl;
      let pdfUrl = existingPdfUrl;

      if (videoFile || audioFile || pdfFile) {
        toast.loading("Uploading files...", { id: toastId });
      }

      const uploadPromises = [];

      if (videoFile) {
        uploadPromises.push(
          uploadVideo(videoFile, undefined, videoAdaptiveStreaming).then(response => {
            if (!response?.secure_url) throw new Error("Video upload failed");
            videoUrl = response.secure_url;
            videoDuration = response?.duration || videoDuration;
            return { type: 'video', response };
          })
        );
      }

      if (audioFile) {
        uploadPromises.push(
          uploadAudio(audioFile).then(response => {
            if (response?.secure_url) audioUrl = response.secure_url;
            return { type: 'audio', response };
          })
        );
      }

      if (pdfFile) {
        uploadPromises.push(
          uploadPdf(pdfFile).then(response => {
            if (response?.secure_url) pdfUrl = response.secure_url;
            return { type: 'pdf', response };
          })
        );
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        toast.loading("Saving lecture...", { id: toastId });
      }

      const updatedLecture = {
        lectureTitle: data.lectureTitle,
        instruction: data.instruction || undefined,
        isPreviewFree: data.isPreviewFree,
        videoUrl: videoUrl || undefined,
        audioUrl: audioUrl || undefined,
        articleContent: data.articleContent?.trim() || undefined,
        duration: videoDuration,
        pdfUrl: pdfUrl || "",
      };

      // Validate required parameters before API call
      if (!courseId || !lectureId) {
        throw new Error("Missing course or lecture ID");
      }

      // Update lecture
      console.log("🚀 Manual save triggered:", {
        courseId,
        lectureId,
        data: updatedLecture,
      });

      const res = await updateLecture({
        courseId,
        lectureId,
        data: updatedLecture,
      }).unwrap();

      console.log("✅ Manual save successful:", res);

      // Show success message
      toast.success("Lecture updated successfully!", { id: toastId });

      // The cache invalidation is now handled by the RTK Query mutation
      // No need for manual refetch or delays

      // Navigate back to course management interface for seamless lecture editing experience
      navigate(`/teacher/courses?courseId=${courseId}&tab=lectures`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update lecture", { id: toastId });
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUploading = isVideoUploading || isAudioUploading || isPdfUploading || isSubmitting;

  if (isLectureLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/teacher/courses/${courseId}/details`)}
          className="mr-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lectures
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Edit Lecture</h1>
          <div className="text-sm text-muted-foreground">
            {hasUnsavedChanges ? (
              <span className="text-amber-600">Unsaved changes</span>
            ) : lastSaved ? (
              <span className="text-green-600">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lecture Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="lectureTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lecture Title*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a title for this lecture"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instruction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add instructions or summary for students..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lecture Video (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                          <div className="space-y-0.5">
                            <Label htmlFor="edit-video-adaptive" className="text-sm font-medium">
                              HD adaptive streaming (HLS)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Off for faster upload; on for Cloudinary HD streaming prep.
                            </p>
                          </div>
                          <Switch
                            id="edit-video-adaptive"
                            checked={videoAdaptiveStreaming}
                            onCheckedChange={setVideoAdaptiveStreaming}
                            disabled={isUploading}
                          />
                        </div>
                        {/* Existing video preview */}
                        {existingVideoUrl && !videoFile && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                Current Video
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeExistingVideo}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="aspect-video bg-black rounded-md overflow-hidden">
                              <ReactPlayer
                                url={existingVideoUrl}
                                width="100%"
                                height="100%"
                                pip
                                controls
                              />
                            </div>
                          </div>
                        )}

                        {/* Video upload section */}
                        <FileUpload
                          value={videoFile ? [videoFile] : []}
                          onValueChange={(files) =>
                            handleVideoChange(files?.[0])
                          }
                          accept="video/*"
                          maxFiles={1}
                          maxSize={500 * 1024 * 1024}
                          onFileReject={(_, message) => {
                            form.setError("videoUrl", { message });
                          }}
                          multiple={false}
                        >
                          <FileUploadDropzone className="flex-row border-dotted">
                            <Upload className="size-4" />
                            Drag and drop or
                            <FileUploadTrigger asChild>
                              <Button variant="link" size="sm" className="p-0">
                                choose a file
                              </Button>
                            </FileUploadTrigger>
                            to upload
                          </FileUploadDropzone>
                          <FileUploadList>
                            {videoFile && (
                              <FileUploadItem value={videoFile}>
                                <FileUploadItemPreview>
                                  <Video className="size-10 text-muted-foreground" />
                                </FileUploadItemPreview>
                                <FileUploadItemMetadata>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {videoFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatBytes(videoFile.size)}
                                    </p>
                                  </div>
                                  {isVideoUploading && (
                                    <div className="w-full">
                                      <Progress
                                        value={videoProgress}
                                        className="h-2 w-full bg-blue-200 rounded-full overflow-hidden"
                                      />
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-600">
                                          {Math.round(videoProgress)}%
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {formatBytes(
                                            (videoProgress / 100) *
                                              videoFile.size
                                          )}{" "}
                                          / {formatBytes(videoFile.size)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </FileUploadItemMetadata>
                                <FileUploadItemDelete asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={removeVideo}
                                    disabled={isUploading}
                                  >
                                    <X />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </FileUploadItemDelete>
                              </FileUploadItem>
                            )}
                          </FileUploadList>
                        </FileUpload>
                      </div>
                    </FormControl>
                    <FormDescription>
                      MP4, WebM, OGG (Max 500MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {existingAudioUrl && !audioFile && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Current Audio</h4>
                              <Button type="button" variant="ghost" size="sm" onClick={removeExistingAudio} disabled={isUploading}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <audio controls src={existingAudioUrl} className="w-full max-w-md" />
                          </div>
                        )}
                        <FileUpload
                          value={audioFile ? [audioFile] : []}
                          onValueChange={(files) => handleAudioChange(files?.[0])}
                          accept="audio/*"
                          maxFiles={1}
                          maxSize={100 * 1024 * 1024}
                          multiple={false}
                        >
                          <FileUploadDropzone className="flex-row border-dotted">
                            <Headphones className="size-4" />
                            Drag and drop or
                            <FileUploadTrigger asChild>
                              <Button variant="link" size="sm" className="p-0">choose audio</Button>
                            </FileUploadTrigger>
                          </FileUploadDropzone>
                          <FileUploadList>
                            {audioFile && (
                              <FileUploadItem value={audioFile}>
                                <FileUploadItemPreview><Headphones className="size-10 text-muted-foreground" /></FileUploadItemPreview>
                                <FileUploadItemMetadata>
                                  <p className="text-sm font-medium truncate">{audioFile.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatBytes(audioFile.size)}</p>
                                </FileUploadItemMetadata>
                                <FileUploadItemDelete asChild>
                                  <Button variant="ghost" size="icon" className="size-7" onClick={removeAudio} disabled={isUploading}>
                                    <X /><span className="sr-only">Delete</span>
                                  </Button>
                                </FileUploadItemDelete>
                              </FileUploadItem>
                            )}
                          </FileUploadList>
                        </FileUpload>
                      </div>
                    </FormControl>
                    <FormDescription>MP3, WAV, OGG (Max 100MB)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="articleContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article / Text Content (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Article or reading content for this lesson..."
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Plain text or article. Shown when no video/audio.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pdfUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDF Materials (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Existing PDF preview */}
                        {existingPdfUrl && !pdfFile && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                Current PDF
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeExistingPdf}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center p-3 border rounded-md bg-gray-50">
                              <File className="h-10 w-10 text-muted-foreground mr-3" />
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">
                                  {existingPdfUrl.substring(
                                    existingPdfUrl.lastIndexOf("/") + 1
                                  )}
                                </p>
                                <a
                                  href={existingPdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View PDF
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PDF upload section */}
                        <FileUpload
                          value={pdfFile ? [pdfFile] : []}
                          onValueChange={(files) => handlePdfChange(files?.[0])}
                          accept="application/pdf"
                          maxFiles={1}
                          maxSize={50 * 1024 * 1024}
                          onFileReject={(_, message) => {
                            form.setError("pdfUrl", { message });
                          }}
                          multiple={false}
                        >
                          <FileUploadDropzone className="flex-row border-dotted">
                            <Upload className="size-4" />
                            Drag and drop or
                            <FileUploadTrigger asChild>
                              <Button variant="link" size="sm" className="p-0">
                                choose a file
                              </Button>
                            </FileUploadTrigger>
                            to upload
                          </FileUploadDropzone>
                          <FileUploadList>
                            {pdfFile && (
                              <FileUploadItem value={pdfFile}>
                                <FileUploadItemPreview>
                                  <File className="size-10 text-muted-foreground" />
                                </FileUploadItemPreview>
                                <FileUploadItemMetadata>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {pdfFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatBytes(pdfFile.size)}
                                    </p>
                                  </div>
                                  {isPdfUploading && (
                                    <div className="w-full">
                                      <Progress
                                        value={pdfProgress}
                                        className="h-2 w-full bg-blue-200 rounded-full overflow-hidden"
                                      />
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-600">
                                          {Math.round(pdfProgress)}%
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {formatBytes(
                                            (pdfProgress / 100) * pdfFile.size
                                          )}{" "}
                                          / {formatBytes(pdfFile.size)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </FileUploadItemMetadata>
                                <FileUploadItemDelete asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={removePdf}
                                    disabled={isUploading}
                                  >
                                    <X />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </FileUploadItemDelete>
                              </FileUploadItem>
                            )}
                          </FileUploadList>
                        </FileUpload>
                      </div>
                    </FormControl>
                    <FormDescription>
                      PDF documents only (Max 50MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPreviewFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Make this lecture available as a free preview
                      </FormLabel>
                      <p className="text-sm text-gray-500">
                        Students can watch this lecture without enrolling in the
                        course
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/teacher/courses/${courseId}`)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <div className="flex items-center">
                      <Loader className="mr-2 animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditLecture;
