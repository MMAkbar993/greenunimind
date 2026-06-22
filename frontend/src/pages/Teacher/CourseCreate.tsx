import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  X,
  Loader2,
  DollarSign,
  Settings,
  Eye,
  Sparkles,
  Target,
  Globe,
  Clock,
  Star,
  TrendingUp,
  ExternalLink,
  GraduationCap,
  Award,
  Trophy,
} from "lucide-react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { StableFileUpload } from "@/components/ui/stable-file-upload";
import { useAppDispatch } from "@/redux/hooks";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useCreateCourseMutation } from "@/redux/features/course/courseApi";
import { COURSE_LEVEL } from "@/types";
import { setCourse } from "@/redux/features/course/courseSlice";
import { CategorySelector } from "@/components/ui/category-selector";
import { AIEnhancementField } from "@/components/ui/ai-enhancement-button";
import { AIDescriptionField } from "@/components/ui/ai-description-field";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import {
  useEnhanceTitleMutation,
  useEnhanceSubtitleMutation,
} from "@/redux/features/ai/aiApi";
import { useGetAllCategoriesWithSubcategoriesQuery } from "@/redux/features/category/categoryApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { useCreateStripeAccountMutation } from "@/redux/features/payment/payment.api";
import { Skeleton } from "@/components/ui/skeleton";

import { Stepper, Step } from "@/components/ui/stepper";

const courseSchema = z
  .object({
    // Step 1: Course Basics
    title: z
      .string()
      .min(5, { message: "Title must be at least 5 characters" })
      .max(100, { message: "Title must be less than 100 characters" }),
    subtitle: z
      .string()
      .max(120, { message: "Subtitle must be less than 120 characters" })
      .optional(),
    description: z
      .string()
      .min(50, { message: "Description must be at least 50 characters" })
      .max(5000, { message: "Description must be less than 5000 characters" }),
    categoryId: z.string().min(1, { message: "Category is required" }),
    subcategoryId: z.string().min(1, { message: "Subcategory is required" }),
    courseLevel: z.enum(COURSE_LEVEL),

    // Step 2: Course Content
    courseThumbnail: z.instanceof(File).optional(),
    learningObjectives: z
      .array(z.string().min(1))
      .min(3, { message: "At least 3 learning objectives are required" })
      .max(8, { message: "Maximum 8 learning objectives allowed" })
      .optional(),
    prerequisites: z.string().optional(),
    targetAudience: z.string().optional(),

    // Step 3: Pricing & Settings
    status: z.enum(["draft", "published"]),
    coursePrice: z.string().optional(),
    isFree: z.enum(["free", "paid"]),
    estimatedDuration: z.string().optional(),
    language: z.string().default("English"),
    hasSubtitles: z.boolean().default(false),
    hasCertificate: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.isFree === "paid") {
      if (!data.coursePrice || parseFloat(data.coursePrice) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valid price is required for paid courses",
          path: ["coursePrice"],
        });
      }
    }
  });

// Helper function to get course level icon
const getCourseLevelIcon = (level: string) => {
  switch (level) {
    case "Beginner":
      return <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />;
    case "Medium":
      return <Award className="w-3 h-3 sm:w-4 sm:h-4" />;
    case "Advance":
      return <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />;
    default:
      return <Target className="w-3 h-3 sm:w-4 sm:h-4" />;
  }
};

const steps: Step[] = [
  {
    id: 1,
    title: "Course Basics",
    description: "Essential course information",
  },
  {
    id: 2,
    title: "Course Content",
    description: "Media and learning objectives",
  },
  {
    id: 3,
    title: "Pricing & Settings",
    description: "Price, language, and features",
  },
  {
    id: 4,
    title: "Review & Publish",
    description: "Final review and publication",
  },
];

const CourseCreate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data } = useGetMeQuery(undefined);
  const [createCourse, { isLoading }] = useCreateCourseMutation();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formInitialized, setFormInitialized] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [learningObjectives, setLearningObjectives] = useState<string[]>([""]);

  // API hooks
  const [createStripeAccount, { isLoading: isConnectingStripe }] =
    useCreateStripeAccountMutation();
  const [enhanceTitle, { isLoading: isEnhancingTitle }] =
    useEnhanceTitleMutation();
  const [enhanceSubtitle, { isLoading: isEnhancingSubtitle }] =
    useEnhanceSubtitleMutation();


  // Gemini AI hook for learning objectives and other fields
  const {
    generateLearningObjectives,
    generatePrerequisites,
    generateTargetAudience,
    isGeneratingObjectives,
    isGeneratingPrerequisites,
    isGeneratingTargetAudience
  } = useGeminiAI();

  const { data: categoriesData } = useGetAllCategoriesWithSubcategoriesQuery();
  const categories = useMemo(
    () => categoriesData?.data || [],
    [categoriesData?.data]
  );
  const teacherId = data?.data?._id;

  // Form setup
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      courseLevel: "Beginner",
      status: "draft",
      isFree: "free",
      coursePrice: "",
      language: "English",
      hasSubtitles: false,
      hasCertificate: true,
    },
  });

  // Store form reference for stable access
  const formRef = React.useRef(form);
  formRef.current = form;

  // Watch individual form values to prevent infinite loops
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const subcategoryId = useWatch({
    control: form.control,
    name: "subcategoryId",
  });
  const title = useWatch({ control: form.control, name: "title" });
  const subtitle = useWatch({ control: form.control, name: "subtitle" });
  const description = useWatch({ control: form.control, name: "description" });
  const status = useWatch({ control: form.control, name: "status" });
  const isFree = useWatch({ control: form.control, name: "isFree" });
  const coursePrice = useWatch({ control: form.control, name: "coursePrice" });

  // Memoized category names to prevent recalculation
  const selectedCategoryName = useMemo(() => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category?.name || "Not selected";
  }, [categories, categoryId]);

  const selectedSubcategoryName = useMemo(() => {
    const category = categories.find((cat) => cat._id === categoryId);
    const subcategory = category?.subcategories?.find(
      (sub) => sub._id === subcategoryId
    );
    return subcategory?.name || "Not selected";
  }, [categories, categoryId, subcategoryId]);

  // (Duplicate removed) Check multiple fields to determine if Stripe is connected

  // Check if the screen is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Manual save function for when user navigates between steps
  const saveFormData = useCallback(() => {
    if (!formInitialized) return;

    const values = formRef.current.getValues();
    const serializableValues = {
      ...values,
      learningObjectives: learningObjectives.filter((obj) => obj.trim() !== ""),
    };

    if (values.courseThumbnail) {
      delete serializableValues.courseThumbnail;
    }

    localStorage.setItem("courseForm", JSON.stringify(serializableValues));
  }, [formInitialized, learningObjectives]);

  // Navigation functions
  const goToNextStep = useCallback(() => {
    saveFormData(); // Save before navigating
    setCompletedSteps((prev) => {
      if (!prev.includes(currentStep)) {
        return [...prev, currentStep];
      }
      return prev;
    });
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  }, [currentStep, saveFormData]);

  const goToPrevStep = useCallback(() => {
    saveFormData(); // Save before navigating
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [saveFormData]);

  const goToStep = useCallback(
    (stepId: number) => {
      if (stepId <= currentStep || completedSteps.includes(stepId)) {
        saveFormData(); // Save before navigating
        setCurrentStep(stepId);
      }
    },
    [currentStep, completedSteps, saveFormData]
  );

  // Helper function to handle next step action based on current step
  const handleNextStepAction = useCallback(() => {
    switch (currentStep) {
      case 1:
        // Validate step 1 fields
        form
          .trigger([
            "title",
            "description",
            "categoryId",
            "subcategoryId",
            "courseLevel",
          ])
          .then((isValid) => {
            if (isValid) goToNextStep();
          });
        break;
      case 2:
        // Step 2 doesn't require validation, just go to next step
        goToNextStep();
        break;
      case 3:
        // Validate step 3 fields
        form
          .trigger(["status", "isFree", "coursePrice"])
          .then((isValid) => {
            if (isValid) goToNextStep();
          });
        break;
      default:
        break;
    }
  }, [currentStep, form, goToNextStep]);

  // Check multiple fields to determine if Stripe is connected
  const hasStripeConnected = useMemo(() => {
    return (
      data?.data?.stripeVerified ||
      data?.data?.stripeOnboardingComplete ||
      (data?.data?.stripeAccountId && data?.data?.stripeAccountId.length > 0)
    );
  }, [
    data?.data?.stripeVerified,
    data?.data?.stripeOnboardingComplete,
    data?.data?.stripeAccountId,
  ]);

  // Helper function to handle form submission
  const handleSubmitCourse = useCallback(() => {
    // Get form values and submit
    const values = formRef.current.getValues();
    const formData = new FormData();

    // Handle coursePrice
    if (values.coursePrice) {
      const price = Number(values.coursePrice);
      if (!isNaN(price) && price > 0) {
        formData.append("coursePrice", price.toString());
      }
    }

    // Handle file upload
    if (values.courseThumbnail instanceof File) {
      formData.append("file", values.courseThumbnail);
    }

    // Set publication status
    formData.append(
      "isPublished",
      JSON.stringify(values.status === "published")
    );
    formData.append("status", values.status || "draft");

    // Add all form fields
    const fieldsToAdd = [
      "title",
      "subtitle",
      "description",
      "categoryId",
      "subcategoryId",
      "courseLevel",
      "isFree",
      "prerequisites",
      "targetAudience",
      "estimatedDuration",
      "language",
    ];

    fieldsToAdd.forEach((field) => {
      const value = values[field as keyof typeof values];
      if (value) {
        formData.append(field, value.toString());
      }
    });

    // Add learning objectives
    const validObjectives = learningObjectives.filter(
      (obj) => obj.trim() !== ""
    );
    if (validObjectives.length > 0) {
      formData.append("learningObjectives", JSON.stringify(validObjectives));
    }

    // Add boolean fields
    formData.append(
      "hasSubtitles",
      JSON.stringify(values.hasSubtitles || false)
    );
    formData.append(
      "hasCertificate",
      JSON.stringify(values.hasCertificate || true)
    );

    // Submit the course
    createCourse({
      id: teacherId,
      data: formData,
    }).unwrap().then((res) => {
      dispatch(setCourse(res.data));
      localStorage.removeItem("courseForm");

      const courseId = res.data._id;
      const successMessage = values.status === "published"
        ? "Course published successfully!"
        : "Course saved as draft!";

      if (values.status === "published" && values.isFree === "paid") {
        if (!hasStripeConnected) {
          setShowStripeModal(true);
          return;
        }
      }

      // Show success message with action options
      toast.success(successMessage, {
        duration: 5000,
        action: {
          label: "Add Lectures",
          onClick: () => navigate(`/teacher/courses/${courseId}/lecture/create`)
        }
      });

      // Navigate to unified course management with lecture focus
      navigate(`/teacher/courses/${courseId}/details?tab=lectures`, {
        state: {
          showLecturePrompt: true,
          justCreated: true
        }
      });
    }).catch((error) => {
      console.error("Course creation error:", error);
      toast.error("Failed to create course. Please try again.");
    });
  }, [formRef, learningObjectives, createCourse, teacherId, dispatch, navigate, hasStripeConnected]);

  // Keyboard navigation - Handle Enter key to advance to next step
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Enter key and avoid triggering when user is typing in inputs
      if (event.key === "Enter" && !event.shiftKey) {
        const target = event.target as HTMLElement;

        // Don't trigger if user is in a textarea or rich text editor
        if (
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true" ||
          target.closest('[contenteditable="true"]') ||
          target.closest('.ql-editor') // Quill editor
        ) {
          return;
        }

        // Prevent default form submission
        event.preventDefault();

        // Handle different steps
        if (currentStep < 4) {
          handleNextStepAction();
        } else if (currentStep === 4) {
          // On final step, submit the form
          handleSubmitCourse();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, handleNextStepAction, handleSubmitCourse]);



  // Load saved form data and initialize
  useEffect(() => {
    const initializeForm = () => {
      try {
        const savedData = localStorage.getItem("courseForm");
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Remove non-serializable data
          if (parsedData.courseThumbnail) {
            delete parsedData.courseThumbnail;
          }

          // Handle learning objectives separately
          if (
            parsedData.learningObjectives &&
            Array.isArray(parsedData.learningObjectives)
          ) {
            setLearningObjectives(parsedData.learningObjectives);
            delete parsedData.learningObjectives;
          }

          // Only restore data if it contains meaningful content
          // Avoid restoring empty or default-only data
          const hasContent =
            parsedData.title?.trim() ||
            parsedData.subtitle?.trim() ||
            parsedData.description?.trim() ||
            parsedData.categoryId ||
            parsedData.subcategoryId;

          if (hasContent) {
            // Reset form with cleaned data
            formRef.current.reset(parsedData);
          } else {
            // Clear empty saved data and start fresh
            localStorage.removeItem("courseForm");
          }
        }
      } catch (e) {
        console.error("Failed to parse saved form data", e);
        // Clear corrupted data
        localStorage.removeItem("courseForm");
      } finally {
        setFormInitialized(true);
      }
    };

    // Use setTimeout to ensure form is ready
    const timeoutId = setTimeout(initializeForm, 100);

    return () => clearTimeout(timeoutId);
  }, []); // Remove form dependency to prevent re-initialization



  // Learning objectives handlers
  const addLearningObjective = useCallback(() => {
    if (learningObjectives.length < 8) {
      setLearningObjectives((prev) => [...prev, ""]);
    }
  }, [learningObjectives.length]);

  const removeLearningObjective = useCallback(
    (index: number) => {
      if (learningObjectives.length > 1) {
        setLearningObjectives((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [learningObjectives.length]
  );

  const updateLearningObjective = useCallback(
    (index: number, value: string) => {
      setLearningObjectives((prev) =>
        prev.map((obj, i) => (i === index ? value : obj))
      );
    },
    []
  );



  // AI Enhancement handler for learning objectives
  const handleGenerateLearningObjectives = useCallback(async () => {
    if (!title?.trim()) {
      toast.error("Please enter a course title first");
      return;
    }

    try {
      const objectives = await generateLearningObjectives(title, subtitle, description);
      if (objectives && objectives.length > 0) {
        setLearningObjectives(objectives);
        toast.success("Learning objectives generated successfully!");
      } else {
        toast.error("No objectives were generated");
      }
    } catch (error) {
      console.error("Learning objectives generation error:", error);
      toast.error("Failed to generate learning objectives");
    }
  }, [title, subtitle, description, generateLearningObjectives]);

  // AI Enhancement handler for prerequisites
  const handleGeneratePrerequisites = useCallback(async () => {
    if (!title?.trim()) {
      toast.error("Please enter a course title first");
      return;
    }

    try {
      const prerequisites = await generatePrerequisites(title, subtitle, form.watch("courseLevel"));
      if (prerequisites) {
        form.setValue("prerequisites", prerequisites);
        toast.success("Prerequisites generated successfully!");
      } else {
        toast.error("No prerequisites were generated");
      }
    } catch (error) {
      console.error("Prerequisites generation error:", error);
      toast.error("Failed to generate prerequisites");
    }
  }, [title, subtitle, form, generatePrerequisites]);

  // AI Enhancement handler for target audience
  const handleGenerateTargetAudience = useCallback(async () => {
    if (!title?.trim()) {
      toast.error("Please enter a course title first");
      return;
    }

    try {
      const targetAudience = await generateTargetAudience(title, subtitle, form.watch("courseLevel"));
      if (targetAudience) {
        form.setValue("targetAudience", targetAudience);
        toast.success("Target audience generated successfully!");
      } else {
        toast.error("No target audience was generated");
      }
    } catch (error) {
      console.error("Target audience generation error:", error);
      toast.error("Failed to generate target audience");
    }
  }, [title, subtitle, form, generateTargetAudience]);

  // Stripe connection handler
  const handleConnectStripe = useCallback(async () => {
    try {
      if (!teacherId) {
        toast.error(
          "Teacher ID is missing. Please try again or contact support."
        );
        return;
      }

      if (hasStripeConnected) {
        toast.success("Your Stripe account is already connected!");
        setShowStripeModal(false);
        navigate("/teacher/courses");
        return;
      }

      const result = await createStripeAccount(teacherId).unwrap();

      if (result?.data?.url || result?.url) {
        const url = result?.data?.url || result?.url;
        window.open(url, "_blank");
        toast.info(
          "Completing your Stripe setup in a new tab. Please complete all steps."
        );
        setShowStripeModal(false);
      } else if (result?.status === "complete") {
        toast.success("Your Stripe account is already set up and verified!");
        setShowStripeModal(false);
      } else {
        toast.warning("Received an unexpected response. Please try again.");
      }
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { message?: string };
        error?: string;
      };

      if (err.data?.message?.includes("Stripe")) {
        toast.error(err.data.message);
      } else if (err.status === 404) {
        toast.error("Teacher account not found. Please contact support.");
      } else if (err.status === 401) {
        toast.error("Authentication error. Please log in again.");
      } else if (err.status === 403) {
        toast.error("You don't have permission to connect a Stripe account.");
      } else if (err.status === 500) {
        toast.error("Server error. Please try again later or contact support.");
      } else {
        toast.error(err.data?.message || "Failed to connect Stripe account");
      }
    }
  }, [teacherId, hasStripeConnected, createStripeAccount, navigate]);

  // AI Enhancement handlers
  const handleEnhanceTitle = useCallback(async () => {
    if (!title?.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    try {
      const result = await enhanceTitle({ title }).unwrap();
      if (result?.data?.enhancedTitle) {
        formRef.current.setValue("title", result.data.enhancedTitle);
        toast.success("Title enhanced successfully!");
      } else {
        toast.error("No enhancement received");
      }
    } catch (error) {
      console.error("Title enhancement error:", error);
      toast.error("Failed to enhance title");
    }
  }, [title, enhanceTitle]);

  const handleEnhanceSubtitle = useCallback(async () => {
    if (!title?.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    try {
      const result = await enhanceSubtitle({
        title,
        subtitle: subtitle || "",
      }).unwrap();
      if (result?.data?.enhancedSubtitle) {
        formRef.current.setValue("subtitle", result.data.enhancedSubtitle);
        toast.success("Subtitle enhanced successfully!");
      } else {
        toast.error("No enhancement received");
      }
    } catch (error) {
      console.error("Subtitle enhancement error:", error);
      toast.error("Failed to enhance subtitle");
    }
  }, [title, subtitle, enhanceSubtitle]);



  // Course publishing handler
  const publishCourse = useCallback(async () => {
    try {
      const values = formRef.current.getValues();
      const formData = new FormData();

      // Handle coursePrice
      if (values.coursePrice) {
        const price = Number(values.coursePrice);
        if (!isNaN(price) && price > 0) {
          formData.append("coursePrice", price.toString());
        }
      }

      // Handle file upload
      if (values.courseThumbnail instanceof File) {
        formData.append("file", values.courseThumbnail);
      }

      // Set publication status
      formData.append(
        "isPublished",
        JSON.stringify(values.status === "published")
      );
      formData.append("status", values.status || "draft");

      // Add all form fields
      const fieldsToAdd = [
        "title",
        "subtitle",
        "description",
        "categoryId",
        "subcategoryId",
        "courseLevel",
        "isFree",
        "prerequisites",
        "targetAudience",
        "estimatedDuration",
        "language",
      ];

      fieldsToAdd.forEach((field) => {
        const value = values[field as keyof typeof values];
        if (value) {
          formData.append(field, value.toString());
        }
      });

      // Add learning objectives
      const validObjectives = learningObjectives.filter(
        (obj) => obj.trim() !== ""
      );
      if (validObjectives.length > 0) {
        formData.append("learningObjectives", JSON.stringify(validObjectives));
      }

      // Add boolean fields
      formData.append(
        "hasSubtitles",
        JSON.stringify(values.hasSubtitles || false)
      );
      formData.append(
        "hasCertificate",
        JSON.stringify(values.hasCertificate || true)
      );

      const res = await createCourse({
        id: teacherId,
        data: formData,
      }).unwrap();

      dispatch(setCourse(res.data));
      localStorage.removeItem("courseForm");

      const courseId = res.data._id;
      const successMessage = values.status === "published"
        ? "Course published successfully!"
        : "Course saved as draft!";

      // Handle Stripe connection for paid courses
      if (values.isFree === "paid" && !hasStripeConnected) {
        setShowStripeModal(true);
        return;
      }

      // Show success message with action options
      toast.success(successMessage, {
        duration: 5000,
        action: {
          label: "Add Lectures",
          onClick: () => navigate(`/teacher/courses/${courseId}/lecture/create`)
        }
      });

      // Navigate to unified course management with lecture focus
      navigate(`/teacher/courses/${courseId}/details?tab=lectures`, {
        state: {
          showLecturePrompt: true,
          justCreated: true
        }
      });
    } catch (error: unknown) {
      console.error("Failed to create course:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to create course");
    }
  }, [
    learningObjectives,
    createCourse,
    teacherId,
    dispatch,
    navigate,
    hasStripeConnected,
  ]);

  // Modern Stepper Component
  const ModernStepIndicator = () => (
    <div className="w-full mb-12">
      {/* Progress bar */}
      {/* <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-800">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium text-green-600">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3 bg-gray-100" />
      </div> */}

      {/* Modern Horizontal Stepper */}
      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={goToStep}
        className="mb-8"
      />
    </div>
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mb-4 mx-auto" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="w-14 h-14 rounded-full mb-3" />
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
            <Card className="shadow-2xl border-0 rounded-2xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  if (!formInitialized) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100/50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3 sm:mb-4 px-2">
              Create Your Course
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed px-4">
              Share your knowledge with the world and inspire learners globally
            </p>
          </div>

          {/* Step Indicator */}
          <ModernStepIndicator />

          {/* Main Content */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden mx-2 sm:mx-0">
            <CardHeader className="pb-4 sm:pb-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border-b border-green-100 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  {steps[currentStep - 1].title}
                </span>
              </CardTitle>
              <p className="text-gray-600 text-base sm:text-lg">
                {steps[currentStep - 1].description}
              </p>
            </CardHeader>
            <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
              <Form {...form}>{renderStepContent()}</Form>
            </CardContent>
          </Card>

          {/* Stripe Modal */}
          {renderStripeModal()}
        </div>
      </div>
    </div>
  );

  // Step content renderer
  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return renderBasicsStep();
      case 2:
        return renderContentStep();
      case 3:
        return renderSettingsStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  }

  // Step 1: Course Basics
  function renderBasicsStep() {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Course Title */}
        <AIEnhancementField
          label="Course Title*"
          value={title || ""}
          onChange={(value) => form.setValue("title", value)}
          onEnhance={handleEnhanceTitle}
          isEnhancing={isEnhancingTitle}
          placeholder="e.g., Complete JavaScript Course 2024"
          error={form.formState.errors.title?.message}
        />

        {/* Course Subtitle */}
        <AIEnhancementField
          label="Course Subtitle"
          value={subtitle || ""}
          onChange={(value) => form.setValue("subtitle", value)}
          onEnhance={handleEnhanceSubtitle}
          isEnhancing={isEnhancingSubtitle}
          placeholder="e.g., Master JavaScript with hands-on projects"
          error={form.formState.errors.subtitle?.message}
        />

        {/* Course Description */}
        <AIDescriptionField
          label="Course Description*"
          value={description || ""}
          onChange={(value) => form.setValue("description", value)}
          title={title || ""}
          subtitle={subtitle || ""}
          placeholder="Describe what students will learn in this course..."
          minHeight={isMobile ? "160px" : "200px"}
          error={form.formState.errors.description?.message}
        />

        {/* Category Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <CategorySelector
            selectedCategoryId={categoryId}
            selectedSubcategoryId={subcategoryId}
            onCategoryChange={(categoryId) =>
              form.setValue("categoryId", categoryId)
            }
            onSubcategoryChange={(subcategoryId) =>
              form.setValue("subcategoryId", subcategoryId)
            }
            error={
              form.formState.errors.categoryId?.message ||
              form.formState.errors.subcategoryId?.message
            }
          />

          {/* Course Level */}
          <FormField
            control={form.control}
            name="courseLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base font-semibold">
                  Course Level*
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                      <SelectValue placeholder="Select course level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COURSE_LEVEL.map((level) => (
                      <SelectItem key={level} value={level}>
                        <div className="flex items-center gap-2">
                          {getCourseLevelIcon(level)}
                          <span className="text-sm sm:text-base">{level}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/teacher/courses")}
            className="px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              form
                .trigger([
                  "title",
                  "description",
                  "categoryId",
                  "subcategoryId",
                  "courseLevel",
                ])
                .then((isValid) => {
                  if (isValid) goToNextStep();
                });
            }}
            className="px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 order-1 sm:order-2"
          >
            Next Step
            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Course Content
  function renderContentStep() {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Course Thumbnail */}
        <FormField
          control={form.control}
          name="courseThumbnail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">
                Course Thumbnail
              </FormLabel>
              <FormControl>
                <StableFileUpload
                  value={field.value}
                  onValueChange={field.onChange}
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                  placeholder="Upload Course Thumbnail"
                  description="Drag and drop or"
                />
              </FormControl>
              <FormDescription className="text-xs sm:text-sm">
                Upload a high-quality thumbnail that represents your course
                content.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Learning Objectives */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <Label className="text-sm sm:text-base font-semibold">
              Learning Objectives* (3-8 objectives)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateLearningObjectives}
              disabled={!title?.trim() || isGeneratingObjectives}
              className="h-8 px-3 text-xs bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 text-blue-700 self-start sm:self-auto"
            >
              {isGeneratingObjectives ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generate
                </>
              )}
            </Button>
          </div>
          <div className="space-y-3">
            {learningObjectives.map((objective, index) => (
              <div key={index} className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-xs sm:text-sm font-medium text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <Input
                    value={objective}
                    onChange={(e) =>
                      updateLearningObjective(index, e.target.value)
                    }
                    placeholder={`Learning objective ${index + 1}`}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>
                {learningObjectives.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLearningObjective(index)}
                    className="flex-shrink-0 mt-1 h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {learningObjectives.length < 8 && (
            <Button
              type="button"
              variant="outline"
              onClick={addLearningObjective}
              className="mt-3 h-9 sm:h-10 text-sm sm:text-base"
            >
              <span className="mr-2">+</span>
              Add Learning Objective
            </Button>
          )}
        </div>

        {/* Additional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="prerequisites"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                  <FormLabel className="text-sm sm:text-base font-semibold">
                    Prerequisites
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePrerequisites}
                    disabled={!title?.trim() || isGeneratingPrerequisites}
                    className="h-8 px-3 text-xs bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200 text-purple-700 self-start sm:self-auto"
                  >
                    {isGeneratingPrerequisites ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="What should students know before taking this course?"
                    className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                  <FormLabel className="text-sm sm:text-base font-semibold">
                    Target Audience
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateTargetAudience}
                    disabled={!title?.trim() || isGeneratingTargetAudience}
                    className="h-8 px-3 text-xs bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200 text-orange-700 self-start sm:self-auto"
                  >
                    {isGeneratingTargetAudience ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Who is this course designed for?"
                    className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goToPrevStep}
            className="px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
          >
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Previous
          </Button>
          <Button
            type="button"
            onClick={goToNextStep}
            className="px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 order-1 sm:order-2"
          >
            Next Step
            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Pricing & Settings
  function renderSettingsStep() {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Pricing Section */}
        <Card className="border-2 border-green-100 bg-green-50/30 transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Course Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
                    >
                      <div className="flex items-center space-x-3 p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 cursor-pointer">
                        <RadioGroupItem value="free" id="free" />
                        <div className="flex-1">
                          <Label
                            htmlFor="free"
                            className="text-sm sm:text-base font-medium cursor-pointer"
                          >
                            Free Course
                          </Label>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Make your course available to everyone
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 cursor-pointer">
                        <RadioGroupItem value="paid" id="paid" />
                        <div className="flex-1">
                          <Label
                            htmlFor="paid"
                            className="text-sm sm:text-base font-medium cursor-pointer"
                          >
                            Paid Course
                          </Label>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Set a price for your course
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFree === "paid" && (
              <FormField
                control={form.control}
                name="coursePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">
                      Course Price (USD)*
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="29.99"
                          className="pl-8 sm:pl-10 h-10 sm:h-12 text-base sm:text-lg focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                          min="1"
                          step="0.01"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Set a competitive price for your course content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Course Settings */}
        <Card className="border-2 border-green-100 bg-green-50/30 transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Course Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">
                      Estimated Duration
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <Input
                          {...field}
                          placeholder="e.g., 10 hours"
                          className="pl-8 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">
                      Course Language
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base focus:ring-green-500 focus:border-green-500">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" />
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Feature Toggles */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasSubtitles"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 hover:border-green-300 p-3 sm:p-4 transition-colors duration-200">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm sm:text-base font-medium">
                        Subtitles Available
                      </FormLabel>
                      <FormDescription className="text-xs sm:text-sm">
                        Course includes subtitles for better accessibility
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasCertificate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 hover:border-green-300 p-3 sm:p-4 transition-colors duration-200">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm sm:text-base font-medium">
                        Certificate of Completion
                      </FormLabel>
                      <FormDescription className="text-xs sm:text-sm">
                        Students receive a certificate upon course completion
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Publication Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base font-semibold">
                    Publication Status
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base focus:ring-green-500 focus:border-green-500">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-sm sm:text-base">
                            Draft - Save for later
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="published">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm sm:text-base">
                            Published - Make live immediately
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goToPrevStep}
            className="px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1 transition-all duration-200 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => {
              form
                .trigger(["status", "isFree", "coursePrice"])
                .then((isValid) => {
                  if (isValid) goToNextStep();
                });
            }}
            className="px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 order-1 sm:order-2"
          >
            Review Course
            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Review & Publish
  function renderReviewStep() {
    const validObjectives = learningObjectives.filter(
      (obj) => obj.trim() !== ""
    );

    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Course Overview */}
        <Card className="border-2 border-green-100 bg-green-50/30 transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Course Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {title}
              </h3>
              {subtitle && (
                <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 text-xs sm:text-sm"
                >
                  {selectedCategoryName}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 text-xs sm:text-sm"
                >
                  {selectedSubcategoryName}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 text-xs sm:text-sm"
                >
                  {form.watch("courseLevel")}
                </Badge>
              </div>
              <div
                className="text-sm sm:text-base text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>

            {/* Course Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="text-sm sm:text-base font-medium">
                    Price
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-green-700">
                  {isFree === "free" ? "Free" : `$${coursePrice}`}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="text-sm sm:text-base font-medium">
                    Duration
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-green-700">
                  {form.watch("estimatedDuration") || "Not specified"}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors duration-200 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="text-sm sm:text-base font-medium">
                    Language
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-green-700">
                  {form.watch("language")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Objectives */}
        {validObjectives.length > 0 && (
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                What You'll Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {validObjectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-2 h-2 sm:w-3 sm:h-3 text-green-600" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">
                      {objective}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Features */}
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Course Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors duration-200">
                <div
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-colors duration-200 ${
                    form.watch("hasSubtitles") ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                <span
                  className={`text-sm sm:text-base transition-colors duration-200 ${
                    form.watch("hasSubtitles")
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  Subtitles Available
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors duration-200">
                <div
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-colors duration-200 ${
                    form.watch("hasCertificate")
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span
                  className={`text-sm sm:text-base transition-colors duration-200 ${
                    form.watch("hasCertificate")
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  Certificate of Completion
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publication Status */}
        <Card
          className={`border-2 ${
            status === "published"
              ? "border-green-200 bg-green-50/30"
              : "border-amber-200 bg-amber-50/30"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  status === "published" ? "bg-green-500" : "bg-amber-500"
                }`}
              ></div>
              <span className="text-lg font-medium">
                {status === "published" ? "Ready to Publish" : "Save as Draft"}
              </span>
            </div>
            <p className="text-gray-600 mt-2">
              {status === "published"
                ? "Your course will be published and available to students immediately."
                : "Your course will be saved as a draft and can be published later."}
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goToPrevStep}
            className="px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1 transition-all duration-200 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Previous
          </Button>
          <Button
            onClick={publishCourse}
            disabled={isLoading}
            className={`px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 order-1 sm:order-2 ${
              status === "published"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                <span className="text-sm sm:text-base">
                  {status === "published" ? "Publishing..." : "Saving..."}
                </span>
              </div>
            ) : (
              <>
                {status === "published" ? (
                  <>
                    <TrendingUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base">Publish Course</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base">Save Draft</span>
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Stripe Modal Renderer
  function renderStripeModal() {
    const ModalComponent = isMobile ? Drawer : Dialog;
    const ContentComponent = isMobile ? DrawerContent : DialogContent;
    const HeaderComponent = isMobile ? DrawerHeader : DialogHeader;
    const TitleComponent = isMobile ? DrawerTitle : DialogTitle;
    const DescriptionComponent = isMobile
      ? DrawerDescription
      : DialogDescription;
    const FooterComponent = isMobile ? DrawerFooter : DialogFooter;

    return (
      <ModalComponent open={showStripeModal} onOpenChange={setShowStripeModal}>
        <ContentComponent className={isMobile ? "" : "sm:max-w-md"}>
          <HeaderComponent className="text-center">
            <TitleComponent className="text-xl font-bold">
              Connect Stripe to Receive Payments
            </TitleComponent>
            <DescriptionComponent className="text-gray-600">
              To receive payments for your courses, you need to connect your
              Stripe account. This is a one-time setup process.
            </DescriptionComponent>
          </HeaderComponent>

          <div className="px-4 py-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                Benefits of connecting Stripe:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Receive payments directly to your bank account
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Track earnings in real-time
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Manage payouts and transactions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Secure and trusted payment processing
                </li>
              </ul>
            </div>
          </div>

          <FooterComponent className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowStripeModal(false);
                navigate("/teacher/courses");
              }}
              className="w-full sm:w-auto"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleConnectStripe}
              disabled={isConnectingStripe}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isConnectingStripe ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </div>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect with Stripe
                </>
              )}
            </Button>
          </FooterComponent>
        </ContentComponent>
      </ModalComponent>
    );
  }
};

export default React.memo(CourseCreate);
