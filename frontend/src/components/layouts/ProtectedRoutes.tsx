import {
  logout,
  TUser,
  selectCurrentToken,
} from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { verifyToken } from "@/utils/verifyToken";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type TProtectedRouteProps = {
  children: ReactNode;
  role: string | undefined;
};

const ProtectedRoute = ({ children, role }: TProtectedRouteProps) => {
  const token = useAppSelector(selectCurrentToken);
  let user;

  if (token) {
    user = verifyToken(token);
  }

  const dispatch = useAppDispatch();

  // Check all possible locations for the role
  const userRole = (user && ((user as TUser).role || (user as TUser).user?.role)) || localStorage.getItem("userRole");

  // Log the role being used for debugging
  console.log("ProtectedRoute checking role:", {
    requiredRole: role,
    userRole: userRole,
    fromToken: user && (user as TUser).role,
    fromLocalStorage: localStorage.getItem("userRole")
  });

  if (role !== undefined && role !== userRole) {
    console.log("Role mismatch, logging out user");
    dispatch(logout());
    return <Navigate to={"/login"} replace={true} />;
  }

  if (!token) {
    return <Navigate to={"/login"} replace={true} />;
  }

  return children;
};

export default ProtectedRoute;
