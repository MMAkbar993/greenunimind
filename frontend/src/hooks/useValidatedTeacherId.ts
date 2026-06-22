import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';

/**
 * Custom hook to safely get and validate teacher ID
 * Prevents API calls with undefined or invalid teacher IDs
 */
export const useValidatedTeacherId = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);

  // Get teacherId from Redux state first, fallback to API data
  const teacherId = user?._id || userData?.data?._id;

  // Validate that teacherId is a proper MongoDB ObjectId (24 characters)
  const isValidTeacherId = Boolean(
    teacherId &&
      teacherId !== 'undefined' &&
      typeof teacherId === 'string' &&
      teacherId.length === 24 &&
      /^[0-9a-fA-F]{24}$/.test(teacherId)
  );

  return {
    teacherId,
    isValidTeacherId,
    isUserLoading,
    userData,
    // Helper function to safely skip queries
    shouldSkipQuery: !isValidTeacherId || isUserLoading,
  };
};
