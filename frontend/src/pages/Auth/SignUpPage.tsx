import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CloudUpload, GraduationCap, Loader2, User, X } from "lucide-react";
import { registerSchema } from "@/types/authSchema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { setIsLoading } from "@/redux/features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import {
  useRegisterMutation,
  useRegisterTeacherMutation,
} from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { InputPassWord } from "@/components/ui/input-password";
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
import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useCallback, useEffect } from "react";
import StepIndicator from "@/components/StepIndicator";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

export type TRegisterForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  gender: string;
  password: string;
  photoUrl: File | undefined;
};

// Define steps for the registration process
const steps = [
  {
    id: "personal",
    title: "Personal Info",
    description: "Enter your personal information",
  },
  {
    id: "account",
    title: "Account",
    description: "Create your account credentials",
  },
  {
    id: "profile",
    title: "Profile",
    description: "Upload a profile photo",
  },
];

const SignUpPage = () => {
  const dispatch = useAppDispatch();
  const [register] = useRegisterMutation();
  const [registerTeacher] = useRegisterTeacherMutation();
  const [becomeTeacher, setBecomeTeacher] = useQueryState("becomeTeacher", {
    parse: (value) => value === "true",
    serialize: (value) => String(value),
  });

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Separate password state to avoid form state issues
  const [passwordValue, setPasswordValue] = useState("");

  // Responsive design
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");

  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: {
        firstName: "",
        middleName: "",
        lastName: "",
      },
      email: "",
      password: "",
      gender: "male",
      photoUrl: undefined,
    },
  });

  const { formState } = form;
  const { isLoading, isSubmitting } = formState;

  // Synchronize password state with form
  useEffect(() => {
    // When form password changes, update our separate state
    const subscription = form.watch((value, { name }) => {
      if (name === "password") {
        setPasswordValue(value.password || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Navigation functions
  const goToNextStep = useCallback(() => {
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);

    // If moving to step 2 (Account Details), ensure password is properly handled
    if (currentStep === 0) {
      // When moving to password step, ensure we're using our separate state
      // This prevents the last name from affecting the password
      form.setValue("password", "", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      });
    }

    setCurrentStep((prev) => prev + 1);
  }, [currentStep, form]);

  const goToPrevStep = useCallback(() => {
    // If moving back from step 2 (Account Details), reset the password field
    if (currentStep === 1) {
      // Reset only the password field without affecting other fields
      setPasswordValue("");
      form.setValue("password", "", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      });
    }
    setCurrentStep((prev) => prev - 1);
  }, [currentStep, form, setPasswordValue]);

  const onSubmit = async (data: FieldValues) => {
    const toastId = toast.loading("Registering...");
    dispatch(setIsLoading(true));

    try {
      const userInfo = {
        password: data.password,
        [becomeTeacher ? "teacher" : "student"]: {
          name: {
            firstName: data.name.firstName,
            middleName: data.name.middleName,
            lastName: data.name.lastName,
          },
          email: data.email,
          gender: data.gender,
        },
      };

      // Send JSON when no file (avoids multipart parsing issues); FormData when uploading photo
      const hasFile = data.photoUrl && data.photoUrl instanceof File;
      const payload = hasFile
        ? (() => {
            const formData = new FormData();
            formData.append("data", JSON.stringify(userInfo));
            formData.append("file", data.photoUrl);
            return formData;
          })()
        : userInfo;

      const res = await (becomeTeacher
        ? registerTeacher(payload).unwrap()
        : register(payload).unwrap());

      const responseData = res?.data ?? res;

      // If backend returns tokens (no email verification required), log in and redirect by role
      if (responseData?.accessToken && responseData?.user) {
        localStorage.setItem("accessToken", responseData.accessToken);
        if (responseData.refreshToken) {
          localStorage.setItem("refreshToken", responseData.refreshToken);
        }
        const user = {
          ...responseData.user,
          photoUrl: responseData.user.profileImg ?? null,
          role: responseData.user.role,
        };
        dispatch(setUser({ user, token: responseData.accessToken }));
        toast.success("Account created successfully!", { id: toastId, duration: 2000 });
        if (responseData.user.role === "teacher") {
          navigate("/teacher/dashboard");
        } else {
          navigate("/student/dashboard");
        }
        return;
      }

      // Otherwise: email verification flow
      toast.success("Registration successful! Please check your email for verification code.", {
        id: toastId,
        duration: 4000,
      });
      const otpExpiresAt = responseData?.otpExpiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}&otpExpiresAt=${encodeURIComponent(otpExpiresAt)}`);
    } catch (err: any) {
      console.error(err);

      // Handle existing unverified user error
      if (err?.data?.message?.includes('already exists but is not verified') || err?.data?.data?.requiresVerification) {
        const email = err?.data?.data?.email || data.email;
        const otpExpiresAt = err?.data?.data?.otpExpiresAt;

        toast.error(err?.data?.message || "Account exists but not verified. Please check your email for verification code.", {
          id: toastId,
          duration: 4000
        });

        // Redirect to OTP verification page
        navigate(`/verify-otp?email=${encodeURIComponent(email)}${otpExpiresAt ? `&otpExpiresAt=${encodeURIComponent(otpExpiresAt)}` : ''}`);
        return;
      }

      toast.error(err?.data?.message || "Something went wrong", { id: toastId, duration: 2000 });
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  // Handle form validation and navigation
  const handleNextStep = () => {
    const fieldsToValidate = [];

    // Determine which fields to validate based on current step
    switch (currentStep) {
      case 0: // Personal Info
        fieldsToValidate.push("name.firstName", "name.lastName", "gender");
        break;
      case 1: // Account Details
        fieldsToValidate.push("email", "password");
        break;
      case 2: // Profile Photo
        fieldsToValidate.push("photoUrl");
        break;
    }

    // Validate only the fields for the current step
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) {
        if (currentStep === steps.length - 1) {
          // If on the last step, submit the form
          form.handleSubmit(onSubmit)();
        } else {
          // If moving from step 0 to step 1, ensure password is properly reset
          if (currentStep === 0) {
            // Reset password state before moving to step 2
            setPasswordValue("");
            // This will be filled by the user in step 2
            form.setValue("password", "", {
              shouldValidate: false,
              shouldDirty: false,
              shouldTouch: false
            });
          }

          // Go to the next step
          goToNextStep();
        }
      }
    });
  };

  // Render different form sections based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name.firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full"
                        type="text"
                        placeholder="First Name"
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
                    <FormLabel className="text-sm sm:text-base">
                      Middle Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full"
                        type="text"
                        placeholder="Middle Name (Optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name.lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      type="text"
                      placeholder="Last Name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 1: // Account Details
        return (
          <>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      type="email"
                      placeholder="Your Email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputPassWord
                      value={passwordValue}
                      onChange={(e) => {
                        // Update both our separate state and the form state
                        setPasswordValue(e.target.value);
                        field.onChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 2: // Profile Photo
        return (
          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">
                  Profile Photo
                </FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value ? [field.value] : []}
                    onValueChange={(files) => field.onChange(files?.[0])}
                    accept="image/*"
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024}
                    onFileReject={(_, message) => {
                      form.setError("photoUrl", { message });
                    }}
                    multiple={false}
                  >
                    <FileUploadDropzone className="flex-row border-dotted p-6 sm:p-8">
                      <CloudUpload className="size-4 sm:size-6" />
                      <p className="text-sm sm:text-base mt-2">
                        Drag and drop or
                        <FileUploadTrigger asChild>
                          <Button variant="link" size="sm" className="p-0 mx-1">
                            choose a file
                          </Button>
                        </FileUploadTrigger>
                        to upload
                      </p>
                    </FileUploadDropzone>
                    <FileUploadList>
                      {field.value && (
                        <FileUploadItem value={field.value}>
                          <FileUploadItemPreview className="size-16 sm:size-20" />
                          <FileUploadItemMetadata />
                          <FileUploadItemDelete asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => field.onChange(undefined)}
                            >
                              <X />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      )}
                    </FileUploadList>
                  </FileUpload>
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  Upload a profile image up to 5MB.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <Card
        className={cn(
          "w-full transition-all duration-300",
          isMobile ? "max-w-[95%]" : isTablet ? "max-w-[80%]" : "max-w-[550px]"
        )}
      >
        <CardHeader className="space-y-2 sm:space-y-4">
          <CardTitle className="text-xl sm:text-2xl text-center">
            {becomeTeacher ? "Sign Up as Teacher" : "Sign Up as Student"}
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Create an account to start your learning journey with us.
          </CardDescription>

          {/* Role selector: Student | Teacher */}
          <div className="flex rounded-lg border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setBecomeTeacher(false)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors",
                !becomeTeacher
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setBecomeTeacher(true)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors",
                becomeTeacher
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
              Teacher
            </button>
          </div>

          {/* Step Indicator */}
          <div className="mt-4 sm:mt-6">
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={(index) => {
                // Only allow clicking on completed steps or the current step
                if (completedSteps.includes(index) || index === currentStep) {
                  // If moving away from step 2 (Account Details), reset the password field
                  if (currentStep === 1 && index !== 1) {
                    setPasswordValue("");
                    form.setValue("password", "", {
                      shouldValidate: false,
                      shouldDirty: false,
                      shouldTouch: false
                    });
                  }
                  setCurrentStep(index);
                }
              }}
              className="w-full"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-4 sm:pt-6">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4 sm:space-y-6">
                {/* Render content based on current step */}
                {renderStepContent()}

                {/* Navigation buttons */}
                <div className="flex justify-between mt-6 sm:mt-8 pt-2">
                  <Button
                    type="button"
                    variant={currentStep > 0 ? "default" : "outline"}
                    onClick={goToPrevStep}
                    disabled={currentStep === 0 || isLoading || isSubmitting}
                    className={cn(
                      "flex items-center",
                      currentStep > 0 &&
                        "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isLoading || isSubmitting}
                    className={cn(
                      "flex items-center",
                      currentStep === steps.length - 1 &&
                        !isLoading &&
                        !isSubmitting &&
                        "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {currentStep === steps.length - 1 ? (
                      isLoading || isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        "Register"
                      )
                    ) : (
                      <>
                        <span>Next</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center pb-6 space-y-4">
          {/* Only show social login buttons on the first step */}
          {currentStep === 0 && (
            <SocialLoginButtons isSignUp={true} role={becomeTeacher ? "teacher" : "student"} />
          )}

          <p className="text-sm sm:text-base text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;
