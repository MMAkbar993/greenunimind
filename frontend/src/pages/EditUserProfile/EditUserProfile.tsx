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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetMeQuery,
  useUpdateUserProfileMutation,
} from "@/redux/features/auth/authApi";
import { setUser, selectCurrentToken, selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Mail, Save, CheckCircle, Shield, Link as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AccountConnections from "@/components/auth/AccountConnections";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import VerifyEmailModal from "@/components/auth/VerifyEmailModal";

const formSchema = z.object({
  name: z.object({
    firstName: z
      .string({ required_error: "First name is required" })
      .min(2, "At least 2 characters")
      .optional(),
    middleName: z.string().optional(),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(2, "At least 2 characters")
      .optional(),
  }),
  email: z.string({ required_error: "Email is required" }).email().optional(),
});

const EditUserProfile = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectCurrentToken);
  const currentUser = useAppSelector(selectCurrentUser);
  const { data, isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !token,
  });
  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [verifyEmailModalOpen, setVerifyEmailModalOpen] = useState(false);

  // Accessing the user data with name as user.name.firstName, user.name.middleName, etc.
  const user = data?.data;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: {
        firstName: user?.name?.firstName || "",
        middleName: user?.name?.middleName || "",
        lastName: user?.name?.lastName || "",
      },
      email: user?.email || "",
    },
  });

  // Reset form values if user data changes
  useEffect(() => {
    if (user && user.name) {
      form.reset({
        name: {
          firstName: user?.name?.firstName || "",
          middleName: user?.name?.middleName || "",
          lastName: user?.name?.lastName || "",
        },
        email: user?.email || "",
      });
    }
  }, [user, form]); // This will run when `user` changes or when the form is initialized

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
    const toastId = toast.loading("Updating profile...");

    try {
      if (!user?._id) {
        throw new Error("User ID not found");
      }

      const res = await updateUserProfile({
        id: user._id,
        data: values,
      });

      const userData = res.data.data;

      if (userData) {
        dispatch(setUser({ user: userData, token }));
      }

      setUpdateSuccess(true);
      toast.success("Profile updated successfully!", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", {
        id: toastId,
      });
    }
  };

  // Loading skeleton UI
  if (isLoading || isFetching) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Separator className="my-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Account Settings</h2>
        <p className="text-gray-600 mt-1">Manage your profile, security, and connected accounts</p>
      </div>

      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      <Separator className="my-6" />

      <Card className="border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>Personal Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal details and how others see you on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdateUser)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-gray-500" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          disabled
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormDescription>
                        Your email address is used for login and notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name.firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="First name"
                          disabled={isUpdating}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name.middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Middle name (optional)"
                          disabled={isUpdating}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name.lastName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Last name"
                          disabled={isUpdating}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                {updateSuccess && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Profile updated successfully
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Connections Section */}
      <AccountConnections />

      {/* Two-Factor Authentication Section */}
      <TwoFactorSetup />

      {/* Email Verification Modal */}
      <VerifyEmailModal
        open={verifyEmailModalOpen}
        onOpenChange={setVerifyEmailModalOpen}
      />
    </div>
  );
};

export default EditUserProfile;
