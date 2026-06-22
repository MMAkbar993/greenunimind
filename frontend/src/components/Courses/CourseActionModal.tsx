import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Save, 
  X, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CourseActionModalProps, CourseFormData } from "@/types/course-management";
import { COURSE_CATEGORIES } from "@/types/course.types";

const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must not exceed 100 characters"),
  subtitle: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must not exceed 1000 characters"),
  category: z.string().min(1, "Category is required"),
  courseLevel: z.enum(["Beginner", "Intermediate", "Advanced"], {
    required_error: "Course level is required",
  }),
  coursePrice: z.number().min(0, "Price must be at least 0").max(10000, "Price must not exceed 10,000"),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  language: z.string().default("English"),
  estimatedDuration: z.string().optional(),
  prerequisites: z.string().optional(),
  targetAudience: z.string().optional(),
  learningObjectives: z.array(z.string()).default([]),
  hasCertificate: z.boolean().default(false),
  hasSubtitles: z.boolean().default(false),
});

const CourseActionModal: React.FC<CourseActionModalProps> = ({
  isOpen,
  onClose,
  mode,
  course,
  onSubmit,
  isLoading = false
}) => {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      category: "",
      courseLevel: "Beginner",
      coursePrice: 0,
      isFree: false,
      isPublished: false,
      language: "English",
      estimatedDuration: "",
      prerequisites: "",
      targetAudience: "",
      learningObjectives: [],
      hasCertificate: false,
      hasSubtitles: false,
    },
  });

  const { watch, setValue, reset } = form;
  const isFree = watch("isFree");

  useEffect(() => {
    if (course && mode === 'edit') {
      reset({
        title: course.title || "",
        subtitle: course.subtitle || "",
        description: course.description || "",
        category: course.category || "",
        courseLevel: course.courseLevel || "Beginner",
        coursePrice: course.coursePrice || 0,
        isFree: course.isFree === 'free',
        isPublished: course.isPublished || false,
        language: course.language || "English",
        estimatedDuration: course.estimatedDuration || "",
        prerequisites: course.prerequisites || "",
        targetAudience: course.targetAudience || "",
        learningObjectives: course.learningObjectives || [],
        hasCertificate: course.hasCertificate || false,
        hasSubtitles: course.hasSubtitles || false,
      });
      setObjectives(course.learningObjectives || []);
      if (course.courseThumbnail) {
        setThumbnailPreview(course.courseThumbnail);
      }
    } else {
      reset();
      setObjectives([]);
      setThumbnailPreview(null);
    }
  }, [course, mode, reset]);

  const handleSubmit = (data: CourseFormData) => {
    const formData = {
      ...data,
      learningObjectives: objectives,
      isFree: data.isFree ? 'free' : 'paid',
    };
    onSubmit(formData);
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addObjective = () => {
    if (newObjective.trim() && !objectives.includes(newObjective.trim())) {
      const updatedObjectives = [...objectives, newObjective.trim()];
      setObjectives(updatedObjectives);
      setValue("learningObjectives", updatedObjectives);
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    const updatedObjectives = objectives.filter((_, i) => i !== index);
    setObjectives(updatedObjectives);
    setValue("learningObjectives", updatedObjectives);
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Course';
      case 'edit':
        return 'Edit Course';
      case 'duplicate':
        return 'Duplicate Course';
      default:
        return 'Course Action';
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case 'create':
        return 'Fill in the details to create a new course. You can always edit these later.';
      case 'edit':
        return 'Update the course information. Changes will be saved immediately.';
      case 'duplicate':
        return 'Create a copy of this course with the same content and settings.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' && <Save className="w-5 h-5 text-brand-primary" />}
            {mode === 'edit' && <Save className="w-5 h-5 text-brand-primary" />}
            {mode === 'duplicate' && <Save className="w-5 h-5 text-brand-primary" />}
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course subtitle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what students will learn in this course"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input placeholder="English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
              
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Free Course</FormLabel>
                        <FormDescription>
                          Make this course available for free
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {!isFree && (
                <FormField
                  control={form.control}
                  name="coursePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Learning Objectives */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Learning Objectives</h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a learning objective"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                />
                <Button type="button" onClick={addObjective} variant="outline">
                  Add
                </Button>
              </div>

              {objectives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {objectives.map((objective, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {objective}
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 4 hours, 2 weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasCertificate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Certificate</FormLabel>
                          <FormDescription className="text-xs">
                            Provide completion certificate
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasSubtitles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Subtitles</FormLabel>
                          <FormDescription className="text-xs">
                            Include video subtitles
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prerequisites</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What should students know before taking this course?"
                          {...field} 
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
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Who is this course for?"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Publishing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Publishing</h3>
              
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        {field.value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        Publish Course
                      </FormLabel>
                      <FormDescription>
                        {field.value 
                          ? "Course is visible to students and can be enrolled in"
                          : "Course is hidden from students and cannot be enrolled in"
                        }
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creating...' : mode === 'edit' ? 'Saving...' : 'Duplicating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Course' : mode === 'edit' ? 'Save Changes' : 'Duplicate Course'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseActionModal;
