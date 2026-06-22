import React, { useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { resetMessageState } from '@/redux/features/message/messageSlice';
import { MessageLayout } from '@/components/Messages';
import useAccessibility from '@/hooks/useAccessibility'; // Fixed: renamed from .ts to .tsx

const TeacherMessages: React.FC = () => {
  const dispatch = useAppDispatch();
  const { announce } = useAccessibility();

  useEffect(() => {
    // Announce page load for screen readers
    announce('Messages page loaded. You can now view and manage your messages.');

    // Reset message state when component unmounts
    return () => {
      dispatch(resetMessageState());
    };
  }, [dispatch, announce]);

  // Set document title
  useEffect(() => {
    document.title = 'Messages - Teacher Dashboard | LMS Platform';
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      <MessageLayout />
    </div>
  );
};

export default TeacherMessages;
