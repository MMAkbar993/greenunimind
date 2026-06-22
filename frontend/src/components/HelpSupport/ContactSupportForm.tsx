import React, { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Send,
  Paperclip,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  Image,
  Video,
  Clock,
  User,
  Mail,
  MessageSquare,
  Tag,
  AlertTriangle,
  Info,
  Zap,
  Flag
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import types
import type { 
  ContactFormProps, 
  ContactFormData, 
  TicketCategory, 
  TicketPriority 
} from '@/types/help-support';

// Import hooks
import { useGetMeQuery } from '@/redux/features/auth/authApi';

// Validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must be less than 100 characters'),
  category: z.enum(['technical', 'billing', 'course-content', 'account', 'feature-request', 'bug-report', 'other'] as const),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000, 'Message must be less than 2000 characters'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// Category and priority configurations
const categoryConfig: Record<TicketCategory, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  'technical': {
    label: 'Technical Issues',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Problems with the platform, bugs, or technical difficulties',
    color: 'text-red-600 bg-red-50'
  },
  'billing': {
    label: 'Billing & Payments',
    icon: <Tag className="w-4 h-4" />,
    description: 'Payment issues, billing questions, or subscription problems',
    color: 'text-green-600 bg-green-50'
  },
  'course-content': {
    label: 'Course Content',
    icon: <FileText className="w-4 h-4" />,
    description: 'Questions about course creation, content, or management',
    color: 'text-blue-600 bg-blue-50'
  },
  'account': {
    label: 'Account Management',
    icon: <User className="w-4 h-4" />,
    description: 'Profile settings, account access, or security concerns',
    color: 'text-purple-600 bg-purple-50'
  },
  'feature-request': {
    label: 'Feature Request',
    icon: <Zap className="w-4 h-4" />,
    description: 'Suggestions for new features or improvements',
    color: 'text-orange-600 bg-orange-50'
  },
  'bug-report': {
    label: 'Bug Report',
    icon: <AlertCircle className="w-4 h-4" />,
    description: 'Report a bug or unexpected behavior',
    color: 'text-red-600 bg-red-50'
  },
  'other': {
    label: 'Other',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'General questions or other inquiries',
    color: 'text-gray-600 bg-gray-50'
  }
};

const priorityConfig: Record<TicketPriority, { label: string; icon: React.ReactNode; description: string; color: string; estimatedTime: string }> = {
  'low': {
    label: 'Low',
    icon: <Info className="w-4 h-4" />,
    description: 'General questions, non-urgent issues',
    color: 'text-gray-600 bg-gray-50',
    estimatedTime: '24-48 hours'
  },
  'medium': {
    label: 'Medium',
    icon: <Clock className="w-4 h-4" />,
    description: 'Important issues affecting your work',
    color: 'text-blue-600 bg-blue-50',
    estimatedTime: '12-24 hours'
  },
  'high': {
    label: 'High',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Urgent issues blocking your progress',
    color: 'text-orange-600 bg-orange-50',
    estimatedTime: '4-12 hours'
  },
  'urgent': {
    label: 'Urgent',
    icon: <Flag className="w-4 h-4" />,
    description: 'Critical issues requiring immediate attention',
    color: 'text-red-600 bg-red-50',
    estimatedTime: '1-4 hours'
  }
};

const ContactSupportForm: React.FC<ContactFormProps> = ({ 
  onSubmit,
  isSubmitting = false,
  initialData = {}
}) => {
  const { data: userData } = useGetMeQuery(undefined);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple announce function for accessibility
  const announce = useCallback((message: string) => {
    console.log('Accessibility announcement:', message);
  }, []);

  // Form setup
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: initialData.name || userData?.data?.name?.firstName + ' ' + userData?.data?.name?.lastName || '',
      email: initialData.email || userData?.data?.email || '',
      subject: initialData.subject || '',
      category: initialData.category || 'other',
      priority: initialData.priority || 'medium',
      message: initialData.message || '',
    },
  });

  // Watch form values for dynamic updates
  const watchedCategory = form.watch('category');
  const watchedPriority = form.watch('priority');
  const watchedMessage = form.watch('message');

  // File upload handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/quicktime', 'video/x-msvideo'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not supported.`);
        return false;
      }
      
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed.');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
    announce(`${validFiles.length} file(s) added to attachments`);

    // Simulate upload progress
    validFiles.forEach(file => {
      const fileId = file.name + file.size;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      }, 200);
    });
  }, [attachments.length, announce]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    const removedFile = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[removedFile.name + removedFile.size];
      return newProgress;
    });
    announce(`Removed ${removedFile.name} from attachments`);
  }, [attachments, announce]);

  // Form submission
  const handleSubmit = useCallback(async (data: ContactFormValues) => {
    try {
      setSubmitStatus('idle');
      
      const formData: ContactFormData = {
        name: data.name,
        email: data.email,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        message: data.message,
        attachments,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        userId: userData?.data?._id,
      };

      await onSubmit(formData);
      
      setSubmitStatus('success');
      setAttachments([]);
      setUploadProgress({});
      form.reset();
      announce('Support ticket submitted successfully');
      toast.success('Your support ticket has been submitted successfully!');
      
    } catch (error) {
      setSubmitStatus('error');
      announce('Failed to submit support ticket');
      toast.error('Failed to submit support ticket. Please try again.');
    }
  }, [attachments, userData, onSubmit, form, announce]);

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Contact Support
        </h2>
        <p className="text-gray-600">
          Get help from our support team. We typically respond within a few hours.
        </p>
      </div>

      {/* Success/Error Messages */}
      {submitStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your support ticket has been submitted successfully! You'll receive a confirmation email shortly.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            There was an error submitting your ticket. Please try again or contact us directly.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
            Submit a Support Ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          aria-label="Full name for support ticket"
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                          aria-label="Email address for support responses"
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Subject */}
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of your issue"
                        {...field}
                        aria-label="Subject line for your support ticket"
                        required
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a clear, concise subject line that describes your issue
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category and Priority */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {watchedCategory && (
                        <FormDescription className="flex items-start gap-2">
                          {categoryConfig[watchedCategory].icon}
                          <span>{categoryConfig[watchedCategory].description}</span>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {watchedPriority && (
                        <FormDescription className="flex items-start gap-2">
                          {priorityConfig[watchedPriority].icon}
                          <div>
                            <div>{priorityConfig[watchedPriority].description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Expected response time: {priorityConfig[watchedPriority].estimatedTime}
                            </div>
                          </div>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your issue in detail. Include any error messages, steps to reproduce the problem, and what you expected to happen."
                        className="min-h-[120px] resize-y"
                        {...field}
                        aria-label="Detailed description of your issue"
                        required
                      />
                    </FormControl>
                    <FormDescription className="flex items-center justify-between">
                      <span>Provide as much detail as possible to help us resolve your issue quickly</span>
                      <span className="text-xs text-gray-500">
                        {watchedMessage?.length || 0}/2000 characters
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Attachments */}
              <div className="space-y-4">
                <div>
                  <Label>Attachments (Optional)</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload screenshots, documents, or videos to help explain your issue. Max 5 files, 10MB each.
                  </p>
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachments.length >= 5}
                    className="flex items-center gap-2"
                  >
                    <Paperclip className="w-4 h-4" />
                    Add Files
                  </Button>
                  <span className="text-sm text-gray-500">
                    {attachments.length}/5 files
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,text/plain,.doc,.docx,video/mp4,video/quicktime,video/x-msvideo"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => {
                      const fileId = file.name + file.size;
                      const progress = uploadProgress[fileId] || 0;
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="flex-shrink-0 h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </span>
                              {progress < 100 && (
                                <>
                                  <Progress value={progress} className="flex-1 h-1" />
                                  <span className="text-xs text-gray-500">
                                    {Math.round(progress)}%
                                  </span>
                                </>
                              )}
                              {progress === 100 && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>By submitting this form, you agree to our support terms.</p>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Ticket
                    </>
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

export default ContactSupportForm;
