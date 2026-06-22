"use client";

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
import { loginSchema } from "@/types/authSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { setIsLoading, setUser, TUser } from "@/redux/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputPassWord } from "@/components/ui/input-password";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import { useEffect } from "react";

export type TLoginForm = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login] = useLoginMutation();
  const [searchParams] = useSearchParams();

  // Get provider and email from URL if they exist
  const provider = searchParams.get("provider");
  const email = searchParams.get("email");

  // Responsive design hooks
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { formState } = form;
  const { isLoading, isSubmitting } = formState;

  // Handle the case where a user is redirected from OAuth callback
  useEffect(() => {
    if (provider && email) {
      // Pre-fill the email field
      form.setValue("email", email);

      // Show a message to the user
      toast.info(
        `This ${provider} account is already linked to an existing account. Please log in with your password to access it.`,
        { duration: 6000 }
      );
    }
  }, [provider, email, form]);

  const onSubmit = async (formData: FieldValues) => {
    const toastId = toast.loading("Logging...");
    dispatch(setIsLoading(true));

    try {
      const userInfo = {
        email: formData.email,
        password: formData.password,
      };

      const res = await login(userInfo).unwrap();

      const data: TUser = res.user;
      const token = res.token;

      const user = {
        email: data.email,
        name: data.name,
        photoUrl: data.profileImg || null,
        role: data.role,
        isDeleted: data.isDeleted,
        isVerified: data.isVerified,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      dispatch(setUser({ user, token }));
      toast.success("Login Successfully!", { id: toastId, duration: 2000 });
      if (user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err: any) {
      console.error(err);

      // Handle unverified user error
      if (err?.data?.message?.includes('Email not verified') || err?.data?.data?.requiresVerification) {
        const email = err?.data?.data?.email || formData.email;
        const otpExpiresAt = err?.data?.data?.otpExpiresAt;

        toast.error(err?.data?.message || "Email not verified. Please check your email for verification code.", {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <Card
        className={cn(
          "w-full transition-all duration-300",
          isMobile ? "max-w-[95%]" : isTablet ? "max-w-[80%]" : "max-w-[550px]"
        )}
      >
        <CardHeader className="space-y-2 sm:space-y-4">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Login Here
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground">
            Fill out the form to login your account to GreenUniMind
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="w-full"
                            type="text"
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
                        <div className="flex items-center justify-end">
                          {/* <FormLabel className="text-sm sm:text-base">
                            Password
                          </FormLabel> */}
                          <Link
                            to="/forgot-password"
                            className="text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <InputPassWord
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full my-3 sm:my-4 cursor-pointer"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Logging...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>

                {/* Social Login Buttons */}
                <SocialLoginButtons />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <p className="text-center text-sm sm:text-base text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
