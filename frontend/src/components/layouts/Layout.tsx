import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProgressTrackingProvider } from "@/contexts/ProgressTrackingContext";
import NavigationOptimizer from "@/components/Performance/NavigationOptimizer";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

const LayoutContent = () => {
  const isMobile = useIsMobile();
  const { sidebarWidth } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main
        className={cn(
          "min-h-screen layout-transition",
          // Dynamic padding based on sidebar state - only use on mobile
          isMobile ? "pl-0" : "",
          // Add top margin for better spacing
          "pt-2"
        )}
        style={{
          // Use CSS custom property for smooth transitions
          marginLeft: isMobile ? '0' : sidebarWidth
        } as React.CSSProperties}
      >
        <div className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const Layout = () => {
  return (
    <NavigationOptimizer>
      <ProgressTrackingProvider>
        <SidebarProvider>
          <LayoutContent />
        </SidebarProvider>
      </ProgressTrackingProvider>
    </NavigationOptimizer>
  );
};

export default Layout;
