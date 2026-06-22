import ProtectedRoute from "@/components/layouts/ProtectedRoutes";
import UserProfileContainer from "@/components/UserProfileContainer";
import LoginPage from "@/pages/Auth/LoginPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import OTPVerificationPage from "@/pages/Auth/OTPVerificationPage";
import ForgotPasswordPage from "@/pages/Auth/ForgotPasswordPage";
import OAuthCallback from "@/pages/Auth/OAuthCallback";
import OAuthSuccessPage from "@/pages/Auth/OAuthSuccessPage";
import OAuthLinkCallbackPage from "@/pages/Auth/OAuthLinkCallbackPage";
import CreatorCourses from "@/pages/Course/CreatorCourses";
import EditUserPhoto from "@/pages/EditUserProfile/EditUserPhoto";
import EditUserProfile from "@/pages/EditUserProfile/EditUserProfile";
import PasswordSecurityPage from "@/pages/EditUserProfile/PasswordSecurityPage";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
// import CreateLecture from "@/pages/Lecture/CreateLecture";
import NotFound from "@/pages/NotFound";
import { USER_ROLE } from "@/constants/global";
import CreateCourse from "@/pages/Course/CreateCourse";
import Layout from "@/components/layouts/Layout";
import Dashboard from "@/pages/Teacher/Dashboard";
import Courses from "@/pages/Teacher/Courses";
import CourseCreate from "@/pages/Teacher/CourseCreate";
import TeacherCourseDetails from "@/pages/Teacher/CourseDetails";
import ErrorBoundary from "@/components/ErrorBoundary";
import EnterpriseErrorBoundary from "@/components/ErrorBoundary/EnterpriseErrorBoundary";
import StripeRequirementGuard from "@/components/Guards/StripeRequirementGuard";
import Earnings from "@/pages/Teacher/Earnings";
import EarningsReport from "@/pages/Teacher/EarningsReport";
import TransactionAnalyticsPage from "@/pages/Teacher/TransactionAnalyticsPage";
import Settings from "@/pages/Teacher/Settings";
import Students from "@/pages/Teacher/Students";
import Messages from "@/pages/Teacher/Messages";
import Analytics from "@/pages/Teacher/Analytics";
import Reviews from "@/pages/Teacher/Reviews";

import LectureCreate from "@/pages/Teacher/LectureCreate";
import EditLecture from "@/components/Dashboard/EditLecture";
import LecturePreview from "@/pages/Teacher/LecturePreview";
import HelpSupport from "@/pages/Teacher/HelpSupport";
import TeacherInvoiceManagement from "@/pages/Teacher/InvoiceManagement";
import TeacherPayoutManagement from "@/pages/Teacher/PayoutManagement";

import FinancialAnalytics from "@/pages/Teacher/FinancialAnalytics";
import StripeConnect from "@/pages/Teacher/StripeConnect";
import StripeConnectStatus from "@/pages/Teacher/StripeConnectStatus";
import StudentDashboard from "@/pages/Student/StudentDashboard";
import StudentLayout from "@/pages/Student/StudentLayout";
import CoursePage from "@/pages/Student/CoursePage";
import LecturePage from "@/pages/Student/LecturePage";
import PublicRoute from "@/components/layouts/PublicRoutes";
import CourseDetails from "@/pages/CourseDetails";
import CheckoutPage from "@/pages/Payment/CheckoutPage";
import PaymentSuccess from "@/pages/Payment/PaymentSuccess";
import PaymentCancel from "@/pages/Payment/PaymentCancel";
import EditCourse from "@/pages/Teacher/EditCourse";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import AllCourses from "@/pages/AllCourses";
// import CloudinaryPlayerDemo from "@/pages/CloudinaryPlayerDemo";
import Certifications from "@/pages/Certifications";
import Blog from "@/pages/Blog";
import Impact from "@/pages/Impact";
import ImpactReport from "@/pages/ImpactReport";
import Categories from "@/pages/Categories";
import CategoryBrowse from "@/pages/CategoryBrowse";
import StepperDemo from "@/components/stepper-demo";
import ConfigDebug from "@/pages/Debug/ConfigDebug";
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

// Redirect component for old course URLs
const CourseRedirect = () => {
  return <Navigate to="/teacher/courses" replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "courses",
        element: <AllCourses />,
      },
      {
        path: "certifications",
        element: <Certifications />,
      },
      {
        path: "blog",
        element: <Blog />,
      },
      {
        path: "impact",
        element: <Impact />,
      },
      {
        path: "impact/report",
        element: <ImpactReport />,
      },
      {
        path: "categories",
        element: <Categories />,
      },
      {
        path: "categories/:categorySlug",
        element: <CategoryBrowse />,
      },
      {
        path: "categories/:categorySlug/:subcategorySlug",
        element: <CategoryBrowse />,
      },
      {
        path: "stepper-demo",
        element: <StepperDemo />,
      },
      {
        path: "debug/config",
        element: <ConfigDebug />,
      },
      {
        path: "user",
        element: <UserProfileContainer />,
        children: [
          {
            index: true,
            path: "edit-profile",
            element: <EditUserProfile />,
          },
          {
            path: "edit-photo",
            element: <EditUserPhoto />,
          },
          {
            path: "password-security",
            element: <PasswordSecurityPage />,
          },
        ],
      },
      {
        path: "create-course",
        element: <CreateCourse />,
      },
      {
        path: "/courses/:courseId",
        element: <CourseDetails />,
      },
      {
        path: "my-courses",
        element: <CreatorCourses />,
      },
      // {
      //   path: "/create-lecture/:courseId",
      //   element: <CreateLecture />,
      // },
      {
        path: "/payment/checkout/:courseId",
        element: (
          <ProtectedRoute role={USER_ROLE.STUDENT}>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/payment/success",
        element: (
          <ProtectedRoute role={USER_ROLE.STUDENT}>
            <PaymentSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: "/payment/cancel",
        element: (
          <ProtectedRoute role={USER_ROLE.STUDENT}>
            <PaymentCancel />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "teacher",
    element: (
      <EnterpriseErrorBoundary context="Teacher Dashboard" enableRetry={true} maxRetries={3}>
        <ProtectedRoute role={USER_ROLE.TEACHER}>
          <Layout />
        </ProtectedRoute>
      </EnterpriseErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "courses",
        element: <Courses />,
      },
      {
        path: "courses/edit-course/:courseId",
        element: <EditCourse />,
      },
      {
        path: "courses/create",
        element: (
          <ErrorBoundary>
            <StripeRequirementGuard showWarningOnly={true}>
              <CourseCreate />
            </StripeRequirementGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: "courses/:courseId/lecture/create",
        element: <LectureCreate />,
      },
      {
        path: "courses/:courseId",
        element: <CourseRedirect />,
      },
      {
        path: "courses/:courseId/details",
        element: <TeacherCourseDetails />,
      },
      {
        path: "courses/:courseId/manage",
        element: <TeacherCourseDetails />,
      },

      {
        path: "courses/:courseId/lecture/edit/:lectureId",
        element: <EditLecture />,
      },
      {
        path: "courses/:courseId/lecture/preview/:lectureId",
        element: <LecturePreview />,
      },
      {
        path: "earnings",
        element: <Earnings />,
      },
      {
        path: "earnings/report",
        element: <EarningsReport />,
      },
      {
        path: "earnings/analytics",
        element: <TransactionAnalyticsPage />,
      },
      {
        path: "students",
        element: <Students />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "messages",
        element: <Messages />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "reviews",
        element: <Reviews />,
      },

      {
        path: "help-support",
        element: <HelpSupport />,
      },
      {
        path: "invoices",
        element: <TeacherInvoiceManagement />,
      },
      {
        path: "payouts",
        element: <TeacherPayoutManagement />,
      },

      {
        path: "financial-analytics",
        element: <FinancialAnalytics />,
      },
      {
        path: "stripe-connect",
        element: <StripeConnect />,
      },
      {
        path: "stripe-connect-status",
        element: <StripeConnectStatus />,
      },
    ],
  },
  {
    path: "student",
    element: (
      <ProtectedRoute role={USER_ROLE.STUDENT}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StudentDashboard />,
      },
      {
        path: "dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "course/:courseId",
        element: <CoursePage />,
      },
      {
        path: "course/:courseId/lecture/:lectureId",
        element: <LecturePage />,
      },
    ],
  },
  {
    path: "sign-up",
    element: (
      <PublicRoute>
        <SignUpPage />
      </PublicRoute>
    ),
  },
  {
    path: "verify-otp",
    element: (
      <PublicRoute>
        <OTPVerificationPage />
      </PublicRoute>
    ),
  },
  {
    path: "login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "forgot-password",
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: "oauth/callback",
    element: <OAuthCallback />,
  },
  {
    path: "oauth/success",
    element: <OAuthSuccessPage />,
  },
  {
    path: "oauth/link/callback",
    element: <OAuthLinkCallbackPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
