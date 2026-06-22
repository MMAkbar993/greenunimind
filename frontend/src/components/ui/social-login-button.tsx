import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { config } from "@/config";
import { ComponentType } from "react";

interface SocialLoginButtonProps {
  provider: "google" | "facebook" | "apple";
  role?: "student" | "teacher";
  icon: LucideIcon | ComponentType<any>;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
  text?: string;
}

export function SocialLoginButton({
  provider,
  role = "student",
  icon: Icon,
  className,
  variant = "outline",
  size = "default",
  fullWidth = false,
  text,
}: SocialLoginButtonProps) {
  const handleLogin = () => {
    // Use the OAuth redirect URL from config
    const url = `${config.oauth[provider].redirectUrl}?role=${role}`;
    console.log("Redirecting to OAuth URL:", url);
    window.location.href = url;
  };

  const getProviderText = () => {
    if (text) return text;

    switch (provider) {
      case "google":
        return "Continue with Google";
      case "facebook":
        return "Continue with Facebook";
      case "apple":
        return "Continue with Apple";
      default:
        return "Continue with OAuth";
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "flex items-center gap-2",
        fullWidth && "w-full",
        className
      )}
      onClick={handleLogin}
    >
      <Icon className="h-4 w-4" />
      <span>{getProviderText()}</span>
    </Button>
  );
}
