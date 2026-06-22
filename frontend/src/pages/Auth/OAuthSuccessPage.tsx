import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/features/auth/authSlice";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetEnrolledCoursesQuery } from "@/redux/features/student/studentApi";
import { AlertCircle, Loader2 } from "lucide-react";
import { USER_ROLE } from "@/constants/global";
import AuthSuccessPage from "@/components/auth/AuthSuccessPage";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

const OAuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");
  const error = searchParams.get("error");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for error parameter in URL
  useEffect(() => {
    if (error) {
      setErrorMessage(
        error === "authentication_failed"
          ? "Authentication failed. Please try again."
          : `Login error: ${error}`
      );
    }
  }, [error]);

  const { data, isLoading, isSuccess, error: apiError } = useGetMeQuery(undefined, {
    skip: !token,
  });


  const studentId = data?.data?._id;
  const userRole = data?.data?.role;

  const {
    data: enrolledCoursesData,
    isLoading: isCoursesLoading
  } = useGetEnrolledCoursesQuery(
    { studentId: studentId || "" },
    { skip: !studentId || userRole !== USER_ROLE.STUDENT }
  );

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Store the access token in localStorage
    localStorage.setItem("accessToken", token);
    console.log("Access token stored in localStorage from OAuth success page");

    // Store the refresh token from URL if available
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
      console.log("Refresh token from URL stored in localStorage");
    } else {
      // Try to extract refresh token from cookies as fallback
      const cookies = document.cookie.split(';');
      const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken='));

      if (refreshTokenCookie) {
        const cookieRefreshToken = refreshTokenCookie.split('=')[1];
        localStorage.setItem("refreshToken", cookieRefreshToken);
        console.log("Refresh token extracted from cookies and stored in localStorage");
      } else {
        console.warn("No refresh token found in URL or cookies");
      }
    }

    if (isSuccess && data) {
      const userData = data.data;

      // Extract role from various sources with proper fallbacks
      // Start with role from userData
      let userRole = userData.role;

      // Check if role is nested in user object (common structure from backend)
      if (!userRole && userData.user && userData.user.role) {
        userRole = userData.user.role;
      }

      // Try to get role from token as a fallback
      if (!userRole || userRole === 'user') {
        try {
          const decodedToken = jwtDecode<{role?: string}>(token);

          if (decodedToken && decodedToken.role) {
            userRole = decodedToken.role;
            // Also update userData.role for consistency
            userData.role = decodedToken.role;
          }
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

      // Store the user role in localStorage
      if (userRole) {
        localStorage.setItem("userRole", userRole);
        console.log("User role stored in localStorage:", userRole);
      }



      // Extract the correct user ID and student ID
      let userId = null;
      let studentId = null;

      // Check if we have a nested user object (common in student/teacher responses)
      if (userData.user && userData.user._id) {
        userId = userData.user._id;

        // If role is student, the top-level _id is likely the student ID
        if (userRole === 'student') {
          studentId = userData._id;
        }
      } else {
        // Direct user object
        userId = userData._id;
      }

      // Extract user IDs and role

      // Create a user object with all required fields
      const userObject = {
        _id: userId, // Use the actual user ID for the _id field
        userId: userId, // Store user ID explicitly
        studentId: studentId, // Store student ID if available
        email: userData.email,
        name: userData.name,
        photoUrl: userData.profileImg || null,
        role: userRole,
        isDeleted: userData.isDeleted,
        isVerified: userData.isVerified || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        // Include OAuth fields from the correct location
        googleId: userData.user?.googleId || userData.googleId || null,
        facebookId: userData.user?.facebookId || userData.facebookId || null,
        appleId: userData.user?.appleId || userData.appleId || null,
        // Store reference to nested user object if available
        user: userData.user,
        // Add connected accounts information
        connectedAccounts: userData.connectedAccounts || userData.user?.connectedAccounts || {
          google: !!userData.googleId || !!(userData.user?.googleId),
          facebook: !!userData.facebookId || !!(userData.user?.facebookId),
          apple: !!userData.appleId || !!(userData.user?.appleId)
        }
      };

      // Store user data in localStorage for persistence
      localStorage.setItem("userData", JSON.stringify(userObject));
      console.log("User data stored in localStorage");

      // Set user data in Redux store
      dispatch(
        setUser({
          user: userObject,
          token,
        })
      );

      console.log("User data set in Redux store:", {
        _id: userId,
        userId: userId,
        studentId: studentId,
        email: userData.email,
        role: userRole,
        googleId: userData.user?.googleId || userData.googleId || null
      });




      const normalizedRole = userRole?.toUpperCase();


      if (normalizedRole === USER_ROLE.TEACHER.toUpperCase()) {
        setTimeout(() => {
          navigate("/teacher/dashboard");
        }, 100);
      }
      // For students, check enrollment status
      else if (normalizedRole === USER_ROLE.STUDENT.toUpperCase()) {
       if (!isCoursesLoading && enrolledCoursesData) {
          const hasEnrolledCourses = enrolledCoursesData.data && enrolledCoursesData.data.length > 0;
          console.log('Has enrolled courses:', hasEnrolledCourses);

          if (hasEnrolledCourses) {

            setTimeout(() => {
              navigate("/student/dashboard");
            }, 100);
          } else {
            setTimeout(() => {
              navigate("/");
            }, 100);
          }
        } else {

          setTimeout(() => {
            navigate("/");
          }, 100);
        }
      } else {
        setTimeout(() => {
          navigate("/");
        }, 100);
      }
    }
  }, [token, isSuccess, data, enrolledCoursesData, isCoursesLoading, dispatch, navigate]);

  // Handle API errors
  useEffect(() => {
    if (apiError) {
      console.error("API error:", apiError);
      setErrorMessage("Failed to fetch user data. Please try again.");
      toast.error("Failed to fetch user data. Please try again.");
    }
  }, [apiError]);

  // Show error message if there's an error
  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-bold mt-4">Authentication Error</h1>
        <p className="text-muted-foreground mt-2">{errorMessage}</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading || isCoursesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold mt-4">Completing login...</h1>
        <p className="text-muted-foreground mt-2">Please wait while we set up your account</p>
      </div>
    );
  }

  // Show success page if we have data
  if (isSuccess && data?.data) {
    const userRole = data.data.role;
    let redirectPath = "/";

    if (userRole === USER_ROLE.TEACHER) {
      redirectPath = "/teacher/dashboard";
    } else if (userRole === USER_ROLE.STUDENT) {
      const hasEnrolledCourses =
        enrolledCoursesData?.data && enrolledCoursesData.data.length > 0;
      redirectPath = hasEnrolledCourses ? "/student/dashboard" : "/";
    }

    return (
      <AuthSuccessPage
        title="Account Connected Successfully"
        message="Your account has been successfully authenticated."
        redirectPath={redirectPath}
        redirectTime={2}
      />
    );
  }

  return null;
};

export default OAuthSuccessPage;
