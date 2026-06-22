import { useState, useRef, FormEvent } from "react";
import { Menu, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  logout,
  selectAuthLoading,
  selectCurrentUser,
} from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useLogoutMutation } from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import UserProfile from "./UserProfile";
import { cn } from "@/lib/utils";
import { baseApi } from "@/redux/api/baseApi";
import { USER_ROLE } from "@/constants/global";
import CartSheet from "./CartSheet";
import { setCart } from "@/redux/features/cart/cartSlice";
import { useSearchCoursesQuery } from "@/redux/features/course/courseApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Logger } from "@/utils/logger";
import AISustainabilitySearch from "./AISustainabilitySearch";

const navbarMenu = [
  { label: "Categories", path: "/categories" },
  { label: "Courses", path: "/courses" },
  { label: "Certifications", path: "/certifications" },
  { label: "Blog", path: "/blog" },
  { label: "About", path: "/about" },
  { label: "Impact", path: "/impact" },
  { label: "Create Course", path: "/teacher/courses/create" },
  {
    label: "Become a Teacher",
    path: { pathname: "/sign-up", search: "?becomeTeacher=true" },
  },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const [signOut] = useLogoutMutation(undefined);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  console.log(user);

  // Skip the query if searchTerm is empty
  const { data: searchResults } = useSearchCoursesQuery(searchTerm, {
    skip: !searchTerm,
  });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(undefined).unwrap();
      dispatch(logout());
      dispatch(setCart({ items: [], userId: null }));
      dispatch(baseApi.util.resetApiState());
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      Logger.error("Logout failed", { error });
      toast.error("Logout failed");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const userName =
    `${user?.name?.firstName || ""} ${user?.name?.middleName || ""} ${
      user?.name?.lastName || ""
    }`.trim() || "User";

  const photoUrl: string | undefined = user?.photoUrl || user?.profileImg;

  return (
    <nav className="w-full bg-white/95 backdrop-blur-sm py-4 fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-green-100">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center gap-3">
          <Link to={"/"} className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/images/logo.png"
                alt="Green Uni Mind Logo"
                className="size-12 rounded-full cursor-pointer transition-transform group-hover:scale-105"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                Green Uni Mind
              </h1>
              <p className="text-xs text-green-600 font-medium">Learn Green. Live Better.</p>
            </div>
          </Link>
        </div>

        {/* Center Navigation */}
        <div className="hidden lg:flex items-center">
          <ul className="flex items-center space-x-8">
            {navbarMenu
              .filter((item) => {
                // Filter out "Create Course" if user is not a teacher
                const isTeacher =
                  user?.role === USER_ROLE.TEACHER ||
                  user?.user?.role === USER_ROLE.TEACHER ||
                  localStorage.getItem("userRole") === USER_ROLE.TEACHER;

                if (
                  typeof item.path === "string" &&
                  item.path === "/teacher/courses/create" &&
                  !isTeacher
                ) {
                  return false;
                }

                // Show "Become a Teacher" prominently for non-logged-in users
                if (
                  typeof item.path !== "string" &&
                  item.path.pathname === "/sign-up" &&
                  user
                ) {
                  return false;
                }

                return true;
              })
              .map((item) => (
                <li
                  key={
                    typeof item.path === "string"
                      ? item.path
                      : item.path.pathname
                  }
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "relative font-medium text-sm transition-all duration-200 hover:text-green-600",
                      // Special styling for "Become a Teacher"
                      item.label === "Become a Teacher"
                        ? "text-green-600 font-semibold px-3 py-2 rounded-full bg-green-50 hover:bg-green-100"
                        : isActive(
                            typeof item.path === "string"
                              ? item.path
                              : item.path.pathname
                          )
                        ? "text-green-600 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-green-600"
                        : "text-gray-700 hover:text-green-600"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        {/* Right side - Search, Cart, Auth */}
        <div className="flex items-center gap-4">
          {/* Search Icon */}
          <div className="hidden md:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-green-50 hover:text-green-600">
                  <Search size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("p-0", aiMode ? "w-[400px]" : "w-80")}>
                {/* Toggle tabs */}
                <div className="flex border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setAiMode(false)}
                    className={cn(
                      "flex-1 text-xs font-medium py-2 px-3 flex items-center justify-center gap-1.5 transition-colors",
                      !aiMode
                        ? "text-green-700 border-b-2 border-green-600 bg-green-50/50"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Search size={13} /> Courses
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiMode(true)}
                    className={cn(
                      "flex-1 text-xs font-medium py-2 px-3 flex items-center justify-center gap-1.5 transition-colors",
                      aiMode
                        ? "text-green-700 border-b-2 border-green-600 bg-green-50/50"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Sparkles size={13} /> Ask AI
                  </button>
                </div>

                {aiMode ? (
                  <AISustainabilitySearch compact className="h-[460px]" />
                ) : (
                  <div className="p-4">
                    <form onSubmit={handleSearch} className="relative">
                      <Input
                        placeholder="Search courses, certifications..."
                        className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-green-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600"
                      >
                        <Search size={18} />
                      </button>
                    </form>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Cart and User Profile for logged in users */}
          {user && (
            <div className="flex items-center gap-2">
              <CartSheet />
              <UserProfile
                user={user || null}
                isAuthLoading={isAuthLoading}
                open={open}
                setOpen={setOpen}
                hoverTimeout={hoverTimeout}
                handleLogout={handleLogout}
              />
            </div>
          )}

          {/* Auth buttons for non-logged in users */}
          {!user && (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700 font-medium"
                >
                  Login
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle Menu" className="hover:bg-green-50">
                <Menu size={24} className="text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] mr-4 mt-2">
              {/* User info section for logged in users */}
              {user && (
                <>
                  <div className="flex items-center gap-x-3 px-3 py-3">
                    <Avatar>
                      <AvatarImage src={photoUrl} />
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {(userName?.slice(0, 2) || "US").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {userName}
                      </span>
                      <span className="text-xs text-green-600">{user?.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Search section with AI toggle */}
              <div className="px-3 py-2">
                <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-2">
                  <button
                    type="button"
                    onClick={() => setAiMode(false)}
                    className={cn(
                      "flex-1 text-xs font-medium py-1.5 flex items-center justify-center gap-1 transition-colors",
                      !aiMode ? "bg-green-50 text-green-700" : "text-gray-500"
                    )}
                  >
                    <Search size={12} /> Courses
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiMode(true)}
                    className={cn(
                      "flex-1 text-xs font-medium py-1.5 flex items-center justify-center gap-1 transition-colors",
                      aiMode ? "bg-green-50 text-green-700" : "text-gray-500"
                    )}
                  >
                    <Sparkles size={12} /> Ask AI
                  </button>
                </div>
                {aiMode ? (
                  <div className="rounded-lg border border-green-200 overflow-hidden">
                    <AISustainabilitySearch compact className="h-[350px]" />
                  </div>
                ) : (
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      placeholder="Search courses..."
                      className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:border-green-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600"
                    >
                      <Search size={16} />
                    </button>
                  </form>
                )}
              </div>

              <DropdownMenuSeparator />

              {/* Navigation menu items */}
              {navbarMenu
                .filter((item) => {
                  // Filter out "Create Course" if user is not a teacher
                  const isTeacher =
                    user?.role === USER_ROLE.TEACHER ||
                    user?.user?.role === USER_ROLE.TEACHER ||
                    localStorage.getItem("userRole") === USER_ROLE.TEACHER;

                  if (
                    typeof item.path === "string" &&
                    item.path === "/teacher/courses/create" &&
                    !isTeacher
                  ) {
                    return false;
                  }

                  // Filter out "Become a Teacher" if user is already logged in
                  if (
                    typeof item.path !== "string" &&
                    item.path.pathname === "/sign-up" &&
                    user
                  ) {
                    return false;
                  }

                  return true;
                })
                .map((item) => (
                  <DropdownMenuItem
                    key={
                      typeof item.path === "string"
                        ? item.path
                        : item.path.pathname
                    }
                    asChild
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "w-full py-2 px-3 rounded-md transition-colors",
                        // Special styling for "Become a Teacher"
                        item.label === "Become a Teacher"
                          ? "text-green-600 font-semibold bg-green-50"
                          : isActive(
                              typeof item.path === "string"
                                ? item.path
                                : item.path.pathname
                            )
                          ? "text-green-600 font-medium bg-green-50"
                          : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />

              {/* Authentication buttons for non-logged in users */}
              {!user && (
                <div className="px-3 py-2 space-y-2">
                  <Link to="/login" className="block">
                    <Button
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 font-medium"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/sign-up" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Logout button for logged in users */}
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2">
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
