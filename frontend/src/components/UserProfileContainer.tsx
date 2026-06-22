import { Link, Outlet, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentToken } from "@/redux/features/auth/authSlice";
import { User, Camera, Lock, LogOut, Settings, ChevronRight } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

const sidebarMenu = [
  {
    label: "Profile",
    path: "/user/edit-profile",
    icon: <User className="h-4 w-4 mr-2" />,
    description: "Manage your personal information"
  },
  {
    label: "Photo",
    path: "/user/edit-photo",
    icon: <Camera className="h-4 w-4 mr-2" />,
    description: "Update your profile picture"
  },
  {
    label: "Password & Security",
    path: "/user/password-security",
    icon: <Lock className="h-4 w-4 mr-2" />,
    description: "Manage your account security"
  },
  {
    label: "Close Account",
    path: "/profile/close-account",
    icon: <LogOut className="h-4 w-4 mr-2" />,
    description: "Deactivate your account"
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

const UserProfileContainer = () => {
  const location = useLocation();
  const token = useAppSelector(selectCurrentToken);
  const { data, isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !token,
  });
  const isMobile = useMediaQuery("(max-width: 768px)");

  const user = data?.data;
  const userName = user ? `${user?.name?.firstName || ''} ${user?.name?.middleName || ''} ${user?.name?.lastName || ''}`.trim() : '';
  const photoUrl = user?.profileImg;
  const isActive = (path: string) => location.pathname === path;
  const loading = isLoading || isFetching;

  // Get current section title
  const getCurrentSection = () => {
    const currentItem = sidebarMenu.find(item => isActive(item.path));
    return currentItem?.label || "Profile Settings";
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 flex justify-center pt-[75px] px-4 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="flex flex-col md:flex-row w-full max-w-[84rem] rounded-lg bg-white shadow-md md:my-5 overflow-hidden border-0">
        {/* Sidebar */}
        <motion.aside
          className="w-full md:w-80 lg:w-96 border-r border-gray-100 p-6 bg-white"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="flex flex-col items-center space-y-4 mb-8"
            variants={itemVariants}
          >
            {loading ? (
              <>
                <Skeleton className="w-28 h-28 rounded-full" />
                <div className="space-y-2 w-full flex flex-col items-center">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="w-28 h-28 border-2 border-primary/10 object-cover transition-all duration-300 hover:scale-105 shadow-md">
                  <AvatarImage src={photoUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xl">
                    {(userName?.slice(0, 2) || "US").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h1 className="font-bold text-xl">{userName}</h1>
                  <p className="text-gray-500 text-sm mt-1">Account Settings</p>
                </div>
              </>
            )}
          </motion.div>

          <Separator className="my-6" />

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 ml-6" />
                </div>
              ))}
            </div>
          ) : (
            <nav className="mt-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider px-2">
                <Settings className="h-4 w-4 inline mr-2" />
                Settings
              </h2>
              <ul className="space-y-3">
                {sidebarMenu.map((item, index) => (
                  <motion.li
                    key={item.path}
                    variants={itemVariants}
                    custom={index}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex flex-col px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-50 border border-transparent",
                        isActive(item.path)
                          ? "bg-primary/5 text-primary border-primary/20 shadow-sm"
                          : "text-gray-700 hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isActive(item.path) ? "text-primary rotate-90" : "text-gray-400"
                        )} />
                      </div>
                      <p className={cn(
                        "text-xs ml-6 mt-1",
                        isActive(item.path) ? "text-primary/80" : "text-gray-500"
                      )}>
                        {item.description}
                      </p>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
          )}
        </motion.aside>

        {/* Main Content Section */}
        <motion.main
          className="flex-1 p-6 md:p-8 bg-white/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {!isMobile && (
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">{getCurrentSection()}</h2>
              <p className="text-gray-500 mt-1">
                {sidebarMenu.find(item => isActive(item.path))?.description || "Manage your account settings"}
              </p>
            </div>
          )}

          <div className="relative">
            {loading ? (
              <ProfileSkeleton />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            )}
          </div>
        </motion.main>
      </Card>
    </motion.div>
  );
};

// Skeleton component for profile content
const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>

          <div className="flex justify-end">
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProfileContainer;
