import { useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch } from "@/redux/hooks";
import { toast } from "sonner";
import { useCreateCourseMutation } from "@/redux/features/course/courseApi";
import { Link, useNavigate } from "react-router-dom";
import { CloudUpload, Loader2, X, ArrowLeft, ArrowRight } from "lucide-react";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
  FileUploadList,
} from "@/components/ui/file-upload";
import { setIsLoading } from "@/redux/features/auth/authSlice";
import { createCourseSchema } from "@/types/courseSchema";
import { setCourse } from "@/redux/features/course/courseSlice";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import StepIndicator from "@/components/StepIndicator";

export type TCreateCourseForm = {
  title: string;
  subTitle?: string;
  description?: string;
  categoryId: string;
  subcategoryId: string;
  courseLevel: string;
  coursePrice: number;
  courseThumbnail: File | undefined;
};

// Define steps for the course creation process
const steps = [
  {
    id: "basic-info",
    title: "Basic Info",
    description: "Enter the basic information about your course."
  },
  {
    id: "details",
    title: "Course Details",
    description: "Add detailed information about your course."
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Set the price for your course."
  },
  {
    id: "thumbnail",
    title: "Thumbnail",
    description: "Upload a thumbnail image for your course."
  },
];

const CreateCourse = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data } = useGetMeQuery(undefined);
  const [createCourse] = useCreateCourseMutation();

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const teacherId = data?.data?._id;

  const form = useForm({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      subTitle: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      courseLevel: "Beginner",
      coursePrice: 0,
      courseThumbnail: undefined,
    },
  });

  const { formState } = form;
  const { isLoading, isSubmitting } = formState;

  // Navigation functions
  const goToNextStep = useCallback(() => {
    setCompletedSteps((prev) => [...prev, currentStep]);
    setCurrentStep((prev) => prev + 1);
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const onSubmit = async (values: FieldValues) => {
    const toastId = toast.loading("Creating Course...");
    dispatch(setIsLoading(true));

    try {
      const formData = new FormData();

      // Create a data object without the file
      const dataToSend = { ...values };
      delete dataToSend.courseThumbnail;

      // Append the JSON data
      formData.append("data", JSON.stringify(dataToSend));

      // Append the file separately
      if (values.courseThumbnail) {
        formData.append("file", values.courseThumbnail);
      }

      const res = await createCourse({
        id: teacherId,
        data: formData,
      }).unwrap();

      dispatch(setCourse(res));

      toast.success("Course created successfully!", {
        id: toastId,
        duration: 2000,
      });
      navigate("/courses");
    } catch (err) {
      toast.error("Something went wrong", { id: toastId, duration: 2000 });
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  // Render different form sections based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      type="text"
                      placeholder="Course Title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      type="text"
                      placeholder="Subtitle (Optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      type="text"
                      placeholder="Course Description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case 1: // Course Details
        return (
          <>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      type="text"
                      placeholder="Category ID"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      type="text"
                      placeholder="Subcategory ID"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Course Level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">
                        Intermediate
                      </SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case 2: // Pricing
        return (
          <FormField
            control={form.control}
            name="coursePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="w-full"
                    type="number"
                    placeholder="Course Price"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    onBlur={() =>
                      field.onChange(parseFloat(String(field.value)) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 3: // Thumbnail
        return (
          <FormField
            control={form.control}
            name="courseThumbnail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Thumbnail</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value instanceof File ? [field.value] : []}
                    onValueChange={(files) => field.onChange(files?.[0])}
                    accept="image/*"
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024}
                    onFileReject={(_, message) => {
                      form.setError("courseThumbnail", { message });
                    }}
                    multiple={false}
                  >
                    <FileUploadDropzone className="flex-row border-dotted">
                      <CloudUpload className="size-4" />
                      Drag and drop or
                      <FileUploadTrigger asChild>
                        <Button variant="link" size="sm" className="p-0">
                          choose a file
                        </Button>
                      </FileUploadTrigger>
                      to upload
                    </FileUploadDropzone>
                    <FileUploadList>
                      {field.value && (
                        <FileUploadItem value={field.value as File}>
                          <FileUploadItemPreview />
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
                <FormDescription>
                  Upload a thumbnail image up to 5MB.
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

  // Handle form submission or step navigation
  const handleNextStep = () => {
    const fieldsToValidate = [];

    // Determine which fields to validate based on current step
    switch (currentStep) {
      case 0:
        fieldsToValidate.push('title', 'description');
        break;
      case 1:
        fieldsToValidate.push('categoryId', 'subcategoryId', 'courseLevel');
        break;
      case 2:
        fieldsToValidate.push('coursePrice');
        break;
      case 3:
        fieldsToValidate.push('courseThumbnail');
        break;
    }

    // Validate only the fields for the current step
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) {
        if (currentStep === steps.length - 1) {
          // If on the last step, submit the form
          form.handleSubmit(onSubmit)();
        } else {
          // Otherwise, go to the next step
          goToNextStep();
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-[75px]">
      <Card className="my-6 w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create Course</CardTitle>
          <CardDescription>
            Fill out the details below to create a new course.
          </CardDescription>

          {/* Step Indicator */}
          <div className="mt-6">
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={(index) => {
                // Only allow clicking on completed steps or the current step + 1
                if (completedSteps.includes(index) || index === currentStep || index === currentStep + 1) {
                  setCurrentStep(index);
                }
              }}
            />
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-6 py-4">
                {/* Render content based on current step */}
                {renderStepContent()}

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPrevStep}
                    disabled={currentStep === 0 || isLoading || isSubmitting}
                    className="flex items-center"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isLoading || isSubmitting}
                    className="flex items-center"
                  >
                    {isLoading || isSubmitting ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>{currentStep === steps.length - 1 ? "Creating..." : "Saving..."}</span>
                      </div>
                    ) : (
                      <>
                        {currentStep === steps.length - 1 ? "Create Course" : "Next"}
                        {currentStep < steps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <p className="text-sm text-gray-500">
            Want to go back to courses?{" "}
            <Link to="/courses" className="text-blue-500 hover:underline">
              View Courses
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateCourse;
