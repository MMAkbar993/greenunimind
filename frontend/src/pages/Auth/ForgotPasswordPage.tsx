import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const ForgotPasswordPage = () => {
  // Responsive design hooks for consistent width constraints
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={cn(
        "w-full mx-auto mb-6",
        isMobile ? "max-w-[95%]" : isTablet ? "max-w-[80%]" : "max-w-[550px]"
      )}>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Password Recovery
          </h1>
          <p className="text-gray-600 mt-2">
            We'll help you get back into your account
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full flex justify-center"
      >
        <ForgotPasswordForm />
      </motion.div>
    </motion.div>
  );
};

export default ForgotPasswordPage;
