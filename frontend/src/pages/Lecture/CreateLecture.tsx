// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormField,
//   FormItem,
//   FormControl,
//   FormLabel,
//   FormMessage,
//   FormDescription,
// } from "@/components/ui/form";
// import { useMedia } from "@/hooks/useMediaUpload";
// import { useAppDispatch } from "@/redux/hooks";
// import { toast } from "sonner";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Loader2 } from "lucide-react";
// import {
//   FileUpload,
//   FileUploadDropzone,
//   FileUploadItem,
//   FileUploadItemDelete,
//   FileUploadItemMetadata,
//   FileUploadItemPreview,
//   FileUploadList,
//   FileUploadTrigger,
// } from "@/components/ui/file-upload";
// import { X } from "lucide-react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Progress } from "@/components/ui/progress"; // Import the Progress component
// import { formatBytes } from "@/utils/uploadMedia";

// // Validation schema
// const createLectureSchema = z.object({
//   lectureTitle: z.string().min(1, "Lecture Title is required"),
//   shortInstruction: z.string().optional(),
//   isPreviewFree: z.boolean().optional(), // Ensure this is a boolean
//   videoUrl: z.string().optional(),
// });

// type CreateLectureFormData = z.infer<typeof createLectureSchema>;

// const CreateLecture = () => {
//   const { courseId } = useParams<{ courseId: string }>();
//   const dispatch = useAppDispatch();
//   const form = useForm<CreateLectureFormData>({
//     resolver: zodResolver(createLectureSchema),
//     defaultValues: {
//       lectureTitle: "",
//       shortInstruction: "",
//       isPreviewFree: undefined,
//       videoUrl: "",
//     },
//   });

//   const {
//     uploadMedia,
//     progress,
//     isUploading,
//     error: uploadError,
//   } = useMedia();

//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploadResult, setUploadResult] = useState<{
//     secure_url: string;
//     public_id: string;
//   } | null>(null);

//   const [createLecture, { isLoading }] = useCreateLectureMutation();
//   const { formState } = form;
//   const { isSubmitting } = formState;

//   const handleVideoSelect = (file: File | undefined) => {
//     setSelectedFile(file);
//     setUploadResult(null);
//     form.setValue("videoUrl", file ? URL.createObjectURL(file) : "");
//   };

//   const onSubmit = async (data: CreateLectureFormData) => {
//     const toastId = toast.loading("Uploading video...");
//     dispatch(setLoading(true));

//     try {
//       if (!selectedFile) {
//         throw new Error("Please select a video to upload!");
//       }

//       const uploaded = await uploadMedia(selectedFile);

//       if (!uploaded?.secure_url || !uploaded?.public_id) {
//         throw new Error("Video upload failed!");
//       }

//       setUploadResult(uploaded);

//       toast.loading("Creating lecture...", { id: toastId });

//       const lectureData: TLecture = {
//         lectureTitle: data.lectureTitle,
//         shortInstruction: data.shortInstruction || "",
//         isPreviewFree: Boolean(data.isPreviewFree),
//         videoUrl: uploaded.secure_url,
//         publicId: uploaded.public_id,
//       };

//       const res = await createLecture({
//         courseId,
//         data: lectureData,
//       }).unwrap();

//       dispatch(setLecture(res));

//       // Success
//       toast.success("Lecture created successfully!", {
//         id: toastId,
//         duration: 2000,
//       });

//       // Reset everything
//       form.reset();
//       setSelectedFile(null);
//       setUploadResult(null);
//     } catch (err: any) {
//       console.error("Error creating lecture:", err);
//       toast.error(err?.message || "Something went wrong", {
//         id: toastId,
//         duration: 2000,
//       });
//     } finally {
//       dispatch(setLoading(false));
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <Card>
//         <CardHeader>
//           <CardTitle>Create Lecture</CardTitle>
//           <CardDescription>Add a new lecture to your course.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="lectureTitle"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Lecture Title</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Enter lecture title" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="shortInstruction"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Short Instruction</FormLabel>
//                     <FormControl>
//                       <textarea
//                         {...field}
//                         className="w-full p-2 border border-gray-300 rounded"
//                         placeholder="Enter short instructions (optional)"
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="videoUrl"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Upload Video</FormLabel>
//                     <FormControl>
//                       <FileUpload
//                         value={field.value ? [selectedFile] : []}
//                         onValueChange={(files) => handleVideoSelect(files?.[0])}
//                         accept="video/*"
//                         maxFiles={1}
//                         maxSize={1 * 1024 * 1024 * 1024}
//                         onFileReject={(_, message) => {
//                           form.setError("videoUrl", { message });
//                         }}
//                         multiple={false}
//                       >
//                         <FileUploadDropzone className="flex-row border-dotted">
//                           <svg
//                             className="size-4"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth="2"
//                               d="M12 4v16m8-8H4"
//                             />
//                           </svg>
//                           Drag and drop or
//                           <FileUploadTrigger asChild>
//                             <Button variant="link" size="sm" className="p-0">
//                               choose a file
//                             </Button>
//                           </FileUploadTrigger>
//                           to upload
//                         </FileUploadDropzone>
//                         <FileUploadList>
//                           {selectedFile && (
//                             <FileUploadItem value={selectedFile}>
//                               <FileUploadItemPreview />
//                               <FileUploadItemMetadata />
//                               <FileUploadItemDelete asChild>
//                                 <Button
//                                   variant="ghost"
//                                   size="icon"
//                                   className="size-7"
//                                   onClick={() => handleVideoSelect(undefined)}
//                                 >
//                                   <X />
//                                   <span className="sr-only">Delete</span>
//                                 </Button>
//                               </FileUploadItemDelete>
//                             </FileUploadItem>
//                           )}
//                         </FileUploadList>
//                       </FileUpload>
//                     </FormControl>
//                     <FormDescription>
//                       Upload a video file between 500MB and 1GB.
//                     </FormDescription>

//                     {/* Progress Bar */}
//                     {isUploading && (
//                       <div className="mt-4 w-full">
//                         <Progress
//                           value={progress}
//                           className="h-2 w-full bg-blue-200 rounded-full overflow-hidden"
//                         />
//                         <div className="flex justify-between items-center mt-2">
//                           <span className="text-sm text-gray-600">
//                             {Math.round(progress)}%
//                           </span>
//                           <span className="text-sm text-gray-600">
//                             {selectedFile ? formatBytes(progress * selectedFile.size) : "0"} / {selectedFile ? formatBytes(selectedFile.size) : "0"}
//                           </span>
//                         </div>
//                       </div>
//                     )}

//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="isPreviewFree"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Is Preview Free?</FormLabel>
//                     <FormControl>
//                       <Select
//                         onValueChange={(value) =>
//                           field.onChange(value === "true")
//                         }
//                         defaultValue={field.value ? "true" : "false"}
//                       >
//                         <SelectTrigger className="w-full">
//                           <SelectValue placeholder="Select..." />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="true">Yes</SelectItem>
//                           <SelectItem value="false">No</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <Button
//                 type="submit"
//                 className="w-full my-3 cursor-pointer"
//                 disabled={isLoading || isSubmitting}
//               >
//                 {isLoading || isSubmitting ? (
//                   <div className="flex items-center">
//                     <Loader2 className="mr-2 animate-spin" />
//                     <span>Creating Lecture...</span>
//                   </div>
//                 ) : (
//                   "Create Lecture"
//                 )}
//               </Button>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default CreateLecture;
