import React, { useEffect } from 'react';
import { AnalyticsLayout } from '@/components/Analytics';
import useAccessibility from '@/hooks/useAccessibility'; // Fixed: renamed from .ts to .tsx

const TeacherAnalytics: React.FC = () => {
  const { announce } = useAccessibility();

  useEffect(() => {
    // Set document title
    document.title = 'Analytics Dashboard - Teacher Dashboard | LMS Platform';
    // Announce page load for screen readers
    announce('Analytics dashboard loaded. You can now view your teaching performance metrics and insights.');
  }, [announce]);

  return (
    <div className="h-screen overflow-hidden">
      <AnalyticsLayout />
    </div>
  );
};

export default TeacherAnalytics;
