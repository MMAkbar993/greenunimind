import React from "react";
import { NavLink } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  DollarSign,
  Users,
  Settings,
  Video,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentToken, TUser } from "@/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";
import { USER_ROLE } from "@/constants/global";

interface NavItem {
  path: string;
  name: string;
  icon: React.ElementType;
  roles: string[];
}

const SidebarNav = () => {
  const token = useAppSelector(selectCurrentToken);
  let user: TUser | null = null;

  if (token) {
    user = verifyToken(token) as TUser;
  }

  const navItems: NavItem[] = [
    // Teacher routes
    {
      path: "/teacher/dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      roles: [USER_ROLE.TEACHER],
    },
    {
      path: "/teacher/courses",
      name: "Courses",
      icon: BookOpen,
      roles: [USER_ROLE.TEACHER],
    },
    {
      path: "/teacher/materials",
      name: "Materials",
      icon: FileText,
      roles: [USER_ROLE.TEACHER],
    },
    {
      path: "/teacher/earnings",
      name: "Earnings",
      icon: DollarSign,
      roles: [USER_ROLE.TEACHER],
    },
    {
      path: "/teacher/students",
      name: "Students",
      icon: Users,
      roles: [USER_ROLE.TEACHER],
    },
    {
      path: "/teacher/settings",
      name: "Settings",
      icon: Settings,
      roles: [USER_ROLE.TEACHER],
    },
    // Student routes
    {
      path: "/student/dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      roles: [USER_ROLE.STUDENT],
    },
    {
      path: "/student/courses",
      name: "Courses",
      icon: BookOpen,
      roles: [USER_ROLE.STUDENT],
    },
    {
      path: "/student/my-learning",
      name: "My Learning",
      icon: Video,
      roles: [USER_ROLE.STUDENT],
    },
    {
      path: "/student/settings",
      name: "Settings",
      icon: Settings,
      roles: [USER_ROLE.STUDENT],
    },
  ];

  // Check all possible locations for the role
  const userRole = user?.role || user?.user?.role || localStorage.getItem("userRole");

  // Log the role being used for debugging
  console.log("SidebarNav using role:", userRole);

  const filteredNavItems = navItems.filter((item) =>
    userRole ? item.roles.includes(userRole as string) : false
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-2 rounded-md ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-accent"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarNav;
