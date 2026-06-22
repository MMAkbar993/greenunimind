import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/utils/toast";
import { Loader2, ArrowLeft, CheckCircle2, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { useForgotPasswordMutation } from "@/redux/features/auth/authApi";
import { Link } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

// Form schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Responsive design hooks
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    const toastId = toast.loading("Sending reset link...");

    try {
      await forgotPassword(values.email).unwrap();

      toast.success("Password reset link sent to your email", { id: toastId });
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error sending reset link:", error);
      toast.error("Failed to send reset link. Please try again.", {
        id: toastId,
      });
    }
  };

  if (isSubmitted) {
    return (
      <Card
        className={cn(
          "w-full shadow-lg border-0 transition-all duration-300",
          isMobile ? "max-w-[95%]" : isTablet ? "max-w-[80%]" : "max-w-[550px]"
        )}
      >
        <CardHeader className="space-y-2 pb-2">
          <div className="flex justify-center mb-2">
            <div className="bg-green-100 p-4 rounded-full">
              <ShieldCheck className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-center text-base">
            We've sent a password reset link to:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-center font-medium text-primary break-all">{submittedEmail}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Important:</span> The link will expire in 10 minutes.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
              <li>Check your spam folder if you don't see the email</li>
              <li>Make sure you click the link from the same device</li>
              <li>Follow the instructions in the email to reset your password</li>
            </ul>
          </div>

          <Separator />

          <div className="flex flex-col space-y-3">
            <Button
              variant="outline"
              className="w-full transition-all hover:bg-gray-100"
              onClick={() => setIsSubmitted(false)}
            >
              Try another email
            </Button>

            <div className="text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline transition-colors">
                Back to login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "w-full shadow-lg border-0 transition-all duration-300",
        isMobile ? "max-w-[95%]" : isTablet ? "max-w-[80%]" : "max-w-[550px]"
      )}
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="flex justify-center mb-2">
          <div className="bg-primary/10 p-4 rounded-full">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold text-center">
          Forgot Your Password?
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          No worries! Enter your email and we'll send you a reset link
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email address"
                      disabled={isLoading}
                      className="transition-all focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormDescription className="text-xs sm:text-sm">
                    We'll send a password reset link to this email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full transition-all hover:shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link
            to="/login"
            className="flex items-center justify-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
