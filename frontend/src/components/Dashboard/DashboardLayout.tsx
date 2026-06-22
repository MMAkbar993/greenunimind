import ProtectedRoute from "../layouts/ProtectedRoutes";
import SidebarLayout from "../layouts/SidebarLayout";

function DashboardLayout() {
  return (
    <ProtectedRoute role={undefined}>
      <SidebarLayout />
    </ProtectedRoute>
  );
}

export default DashboardLayout;
