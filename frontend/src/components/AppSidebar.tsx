import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentToken, TUser } from "@/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";
import { USER_ROLE } from "@/constants/global";
import {
  studentMenu,
  TDashboardNavMenu,
  TDashboardNavMenuItem,
  teacherMenu,
} from "@/utils/SidebarItemsGenerator";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// Enhanced Sidebar Header Component with Performance Optimization
const SidebarBrandHeader = React.memo(() => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-6 border-b border-sidebar-border",
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "justify-center px-2" : "justify-start"
    )}>
      {/* Logo */}
      <div className="relative flex-shrink-0">
        <img
          src="/images/logo.png"
          alt="Green Uni Mind Logo"
          className={cn(
            "rounded-full object-cover ring-2 ring-green-400/30 transition-all duration-300",
            isCollapsed ? "w-8 h-8" : "w-10 h-10"
          )}
        />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-green-900 rounded-full" />
        </div>
      </div>

      {/* Brand Text */}
      {!isCollapsed && (
        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="text-lg font-bold text-sidebar-foreground leading-tight truncate">
            Green Uni Mind
          </h2>
          <p className="text-xs text-green-600 font-medium truncate">
            Learn Green. Live Better.
          </p>
        </div>
      )}
    </div>
  );
});

SidebarBrandHeader.displayName = "SidebarBrandHeader";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const token = useAppSelector(selectCurrentToken);
  let user: TUser | null = null;

  if (token) {
    user = verifyToken(token) as TUser;
  }

  let sidebarItems: TDashboardNavMenu = { navMain: [] };

  // Check all possible locations for the role
  const userRole = user?.role || user?.user?.role || localStorage.getItem("userRole");

  switch (userRole) {
    case USER_ROLE.TEACHER:
      sidebarItems = teacherMenu;
      break;
    case USER_ROLE.STUDENT:
      sidebarItems = studentMenu;
      break;
  }

  // Log the role being used for debugging
  console.log("AppSidebar using role:", userRole);

  const renderItems = (
    items: TDashboardNavMenuItem[],
    parentKey: string = ""
  ): React.ReactNode => {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return items.map((item, index) => {
      const key = `${parentKey}-${item.title}-${index}`;
      const isActive = location.pathname === item.url;

      // If nested items exist, render an accordion
      if (item.items && item.items.length > 0) {
        return (
          <Accordion type="single" collapsible key={key} className="w-full">
            <AccordionItem value={key} className="border-none">
              <AccordionTrigger className={cn(
                "px-3 py-2 text-left hover:no-underline rounded-md",
                "transition-all duration-200 ease-in-out",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                "[&[data-state=open]>svg]:rotate-90"
              )}>
                <span className="truncate">{item.title}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <SidebarMenu className="pl-4 border-l border-sidebar-border/50 ml-2 space-y-1">
                  {renderItems(item.items, key)}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      // Leaf node with a direct link
      return (
        <SidebarMenuItem key={key}>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className={cn(
              "transition-all duration-200 ease-in-out",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              isCollapsed && "justify-center px-2"
            )}
            tooltip={isCollapsed ? item.title : undefined}
          >
            <Link
              to={item.url!}
              className={cn(
                "flex items-center gap-3 w-full",
                isCollapsed && "justify-center"
              )}
            >
              <span className={cn("truncate", isCollapsed && "sr-only")}>
                {item.title}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar
      {...props}
      className={cn(
        "border-r border-sidebar-border bg-sidebar",
        "transition-all duration-300 ease-in-out",
        props.className
      )}
    >
      <SidebarHeader className="p-0">
        <SidebarBrandHeader />
      </SidebarHeader>
      <SidebarContent className="px-2">
        {sidebarItems.navMain.map((group, idx) => (
          <React.Fragment key={group.title + idx}>
            <div className="px-4 py-3 font-semibold text-sidebar-foreground/70 uppercase text-xs tracking-wider">
              {group.title}
            </div>
            <SidebarMenu className="mb-4 space-y-1">
              {renderItems(group.items || [], group.title)}
            </SidebarMenu>
          </React.Fragment>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
