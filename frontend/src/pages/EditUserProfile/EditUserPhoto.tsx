import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useGetMeQuery,
  useUpdateUserProfileMutation,
} from "@/redux/features/auth/authApi";
import { setUser, selectCurrentToken } from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, Camera, X, CheckCircle, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { motion } from "framer-motion";

const formSchema = z.object({
  photoUrl: z
    .union([z.instanceof(File), z.string().url(), z.undefined()])
    .refine(
      (file) => {
        if (file instanceof File) {
          return file.size <= 5 * 1024 * 1024; // 5MB max size
        }
        return true;
      },
      {
        message: "File must be less than 5MB",
      }
    )
    .optional(),
});

const EditUserPhoto = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectCurrentToken);
  const { data, isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !token,
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();

  const user = data?.data;
  const loading = isLoading || isFetching;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      photoUrl: user?.profileImg || undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        photoUrl: user.profileImg,
      });
    }
  }, [user, form]);

  // Reset success state after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (updateSuccess) {
      timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [updateSuccess]);

  const handleUpdateUser = async (values: z.infer<typeof formSchema>) => {
    if (!(values.photoUrl instanceof File)) {
      toast.error("Please select a photo to upload");
      return;
    }

    const toastId = toast.loading("Uploading photo...");

    try {
      if (!user?._id) {
        throw new Error("User ID not found");
      }

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

      const cloudinaryForm = new FormData();
      cloudinaryForm.append("file", values.photoUrl);
      cloudinaryForm.append("upload_preset", uploadPreset);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: cloudinaryForm }
      );

      if (!cloudinaryRes.ok) {
        throw new Error("Failed to upload photo to cloud storage");
      }

      const { secure_url } = await cloudinaryRes.json();

      toast.loading("Saving profile photo...", { id: toastId });

      const res = await updateUserProfile({
        id: user._id,
        data: { profileImg: secure_url },
      });

      if ("error" in res) {
        const err = res.error as { data?: { message?: string } };
        throw new Error(err?.data?.message || "Failed to update profile photo");
      }

      const userData = res.data?.data;

      if (userData) {
        dispatch(setUser({ user: userData, token }));
      }

      setUpdateSuccess(true);
      toast.success("Profile photo updated successfully!", { id: toastId });
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile photo",
        { id: toastId }
      );
    }
  };

  // Loading skeleton UI
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex justify-center">
              <Skeleton className="w-64 h-64 rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span>Profile Photo</span>
          </CardTitle>
          <CardDescription>
            Add a nice photo of yourself for your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdateUser)}
              className="space-y-8"
            >
              {/* Current Photo Display */}
              <div className="flex flex-col items-center justify-center space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                {user?.profileImg ? (
                  <PhotoProvider>
                    <PhotoView src={user.profileImg}>
                      <div className="relative group cursor-pointer">
                        <img
                          src={user.profileImg}
                          alt={user?.name?.firstName || "Profile"}
                          className="object-cover rounded-lg shadow-md max-w-64 max-h-64 transition-all duration-300 hover:shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity duration-300">
                          <span className="text-white font-medium">Click to view</span>
                        </div>
                      </div>
                    </PhotoView>
                  </PhotoProvider>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg w-64 h-64">
                    <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-center">No profile photo uploaded yet</p>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  {user?.profileImg ? "Your current profile photo" : "Upload a photo to personalize your profile"}
                </p>
              </div>

              {/* Upload Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Upload New Photo</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value instanceof File ? [field.value] : []}
                          onValueChange={(files) => field.onChange(files?.[0])}
                          accept="image/*"
                          maxFiles={1}
                          maxSize={5 * 1024 * 1024}
                          onFileReject={(_, message) => {
                            form.setError("photoUrl", { message });
                          }}
                          multiple={false}
                        >
                          <FileUploadDropzone className="flex-row border-dotted p-8 transition-all duration-200 hover:bg-gray-50">
                            <CloudUpload className="h-5 w-5 mr-2 text-primary" />
                            <span>Drag and drop or</span>
                            <FileUploadTrigger asChild>
                              <Button variant="link" size="sm" className="px-1 font-medium">
                                choose a file
                              </Button>
                            </FileUploadTrigger>
                            <span>to upload</span>
                          </FileUploadDropzone>
                          <FileUploadList>
                            {field.value instanceof File && (
                              <FileUploadItem value={field.value}>
                                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md">
                                  <FileUploadItemPreview className="w-12 h-12 rounded-md overflow-hidden" />
                                  <FileUploadItemMetadata className="flex-1" />
                                  <FileUploadItemDelete asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                                      onClick={() => field.onChange(undefined)}
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </FileUploadItemDelete>
                                </div>
                              </FileUploadItem>
                            )}
                          </FileUploadList>
                        </FileUpload>
                      </FormControl>
                      <FormDescription>
                        Upload a profile image (JPG, PNG, GIF) up to 5MB in size.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4">
                {updateSuccess && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Photo updated successfully
                  </div>
                )}
                <div className="ml-auto">
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="transition-all duration-200 hover:shadow-md"
                  >
                    {isUpdating ? (
                      <span className="flex items-center justify-center">
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Updating...</span>
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Camera className="mr-2 h-4 w-4" />
                        Update Photo
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EditUserPhoto;
