import { DashboardActionCard } from '@/components/ui/dashboard-card';
import { cn } from '@/lib/utils';
import {
  Award,
  BarChart3,
  BookOpen,
  DollarSign,
  FileText,
  MessageSquare,
  Plus,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import React from 'react';

interface QuickAction {
  label: string;
  href?: string; // Deprecated: use 'to' instead
  to?: string; // React Router path for client-side navigation
  onClick?: () => void;
  icon: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
  external?: boolean; // For external links
}

interface ModernQuickActionsProps {
  // Stripe connection status for conditional actions
  isStripeConnected?: boolean;
  isConnectingStripe?: boolean;
  upcomingPayoutAmount?: number;

  // Action handlers
  onCreateCourse?: () => void;
  onRequestPayout?: () => void;
  onConnectStripe?: () => void;

  // Customization
  className?: string;
  variant?: 'full' | 'compact' | 'essential';
}

export const ModernQuickActions: React.FC<ModernQuickActionsProps> = ({
  isStripeConnected = false,
  isConnectingStripe = false,
  upcomingPayoutAmount = 0,
  onCreateCourse,
  onRequestPayout,
  onConnectStripe,
  className,
  variant = 'full',
}) => {
  // Essential actions that are always available
  const essentialActions: QuickAction[] = [
    {
      label: 'Create New Course',
      to: '/teacher/courses/create',
      onClick: onCreateCourse,
      icon: <Plus className="w-4 h-4" />,
      variant: 'default',
    },
    {
      label: 'View Analytics',
      to: '/teacher/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'Manage Students',
      to: '/teacher/students',
      icon: <Users className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'View Earnings',
      to: '/teacher/earnings',
      icon: <DollarSign className="w-4 h-4" />,
      variant: 'outline',
    },
  ];

  // Additional actions for full variant
  const additionalActions: QuickAction[] = [
    {
      label: 'Course Management',
      to: '/teacher/courses',
      icon: <BookOpen className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'Messages',
      to: '/teacher/messages',
      icon: <MessageSquare className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'Reports',
      to: '/teacher/reports',
      icon: <FileText className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'Settings',
      to: '/teacher/settings',
      icon: <Settings className="w-4 h-4" />,
      variant: 'outline',
    },
  ];

  // Financial actions based on Stripe status
  const financialActions: QuickAction[] = [
    ...(isStripeConnected
      ? [
          {
            label: 'Request Payout',
            onClick: onRequestPayout,
            icon: <Wallet className="w-4 h-4" />,
            variant: 'outline' as const,
            disabled: !upcomingPayoutAmount || upcomingPayoutAmount <= 0,
          },
        ]
      : [
          {
            label: 'Connect Stripe',
            onClick: onConnectStripe,
            icon: <Wallet className="w-4 h-4" />,
            variant: 'default' as const,
            disabled: isConnectingStripe,
          },
        ]),
  ];

  // Determine which actions to show based on variant
  const getActionsForVariant = (): QuickAction[] => {
    switch (variant) {
      case 'essential':
        return [...essentialActions.slice(0, 4), ...financialActions];
      case 'compact':
        return [...essentialActions, ...financialActions];
      case 'full':
      default:
        return [...essentialActions, ...financialActions, ...additionalActions];
    }
  };

  const actions = getActionsForVariant();

  // For TeacherQuickActions, consolidate all actions into a single card
  if (variant === 'full') {
    return (
      <DashboardActionCard
        id="teacher-quick-actions"
        title="Quick Actions"
        description="Common tasks and shortcuts for course management"
        icon={<TrendingUp className="w-4 h-4" aria-hidden="true" />}
        actions={actions}
        className={cn(
          'h-fit animate-in fade-in-50 duration-500 delay-100',
          'transition-all duration-300 ease-in-out',
          '@media (prefers-reduced-motion: reduce) { transition: none; }',
          className
        )}
      />
    );
  }

  // For other variants, keep the multi-card layout
  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-6',
        // Enhanced responsive layout with mobile-first approach
        'grid-cols-1', // Mobile: 1 column (320px-768px)
        variant === 'essential' && 'grid-cols-1',
        variant === 'compact' && 'md:grid-cols-2', // Tablet: 2 columns (768px-1024px)
        // Animation and transitions
        'transition-all duration-300 ease-in-out',
        '@media (prefers-reduced-motion: reduce) { transition: none; }',
        className
      )}
    >
      {/* Primary Actions Card */}
      <DashboardActionCard
        id="primary-actions"
        title="Quick Actions"
        description="Common tasks and shortcuts"
        icon={<TrendingUp className="w-4 h-4" aria-hidden="true" />}
        actions={actions.slice(0, Math.ceil(actions.length / 2))}
        className="h-fit animate-in fade-in-50 duration-500 delay-100"
      />

      {/* Secondary Actions Card (for compact variant) */}
      {variant === 'compact' && actions.length > 4 && (
        <DashboardActionCard
          id="secondary-actions"
          title="Management"
          description="Course and student management"
          icon={<BookOpen className="w-4 h-4" aria-hidden="true" />}
          actions={actions.slice(Math.ceil(actions.length / 2))}
          className="h-fit animate-in fade-in-50 duration-500 delay-200"
        />
      )}
    </div>
  );
};

// Specialized quick actions for different dashboard sections
interface TeacherQuickActionsProps {
  isStripeConnected?: boolean;
  isConnectingStripe?: boolean;
  upcomingPayoutAmount?: number;
  onCreateCourse?: () => void;
  onRequestPayout?: () => void;
  onConnectStripe?: () => void;
  className?: string;
}

export const TeacherQuickActions: React.FC<TeacherQuickActionsProps> = props => {
  return (
    <div role="region" aria-label="Teacher Quick Actions" className="focus-within:outline-none">
      <ModernQuickActions {...props} variant="full" />
    </div>
  );
};

export const CompactQuickActions: React.FC<TeacherQuickActionsProps> = props => {
  return <ModernQuickActions {...props} variant="compact" />;
};

export const EssentialQuickActions: React.FC<TeacherQuickActionsProps> = props => {
  return <ModernQuickActions {...props} variant="essential" />;
};

// Course-specific quick actions
interface CourseQuickActionsProps {
  courseId?: string;
  className?: string;
}

export const CourseQuickActions: React.FC<CourseQuickActionsProps> = ({ courseId, className }) => {
  const courseActions: QuickAction[] = [
    {
      label: 'Add Lecture',
      to: courseId ? `/teacher/courses/${courseId}/lecture/create` : '/teacher/courses',
      icon: <Plus className="w-4 h-4" />,
      variant: 'default',
      disabled: !courseId,
    },
    {
      label: 'Edit Course',
      to: courseId ? `/teacher/courses/edit-course/${courseId}` : '/teacher/courses',
      icon: <BookOpen className="w-4 h-4" />,
      variant: 'outline',
      disabled: !courseId,
    },
    {
      label: 'View Students',
      to: '/teacher/students',
      icon: <Users className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'Course Analytics',
      to: '/teacher/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      variant: 'outline',
    },
  ];

  return (
    <DashboardActionCard
      id="course-actions"
      title="Course Actions"
      description="Manage your course content"
      icon={<BookOpen className="w-4 h-4" />}
      actions={courseActions}
      className={cn('h-fit', className)}
    />
  );
};

// Student management quick actions
export const StudentQuickActions: React.FC<{ className?: string }> = ({ className }) => {
  const studentActions: QuickAction[] = [
    {
      label: 'View All Students',
      to: '/teacher/students', // Changed from href to to for React Router navigation
      icon: <Users className="w-4 h-4" />,
      variant: 'default',
    },
    {
      label: 'Send Message',
      to: '/teacher/messages', // Changed from href to to for React Router navigation
      icon: <MessageSquare className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'Student Analytics',
      to: '/teacher/analytics', // Changed from href to to for React Router navigation
      icon: <BarChart3 className="w-4 h-4" />,
      variant: 'outline',
    },
    {
      label: 'Certificates',
      to: '/teacher/certificates', // Changed from href to to for React Router navigation
      icon: <Award className="w-4 h-4" />,
      variant: 'outline',
    },
  ];

  return (
    <DashboardActionCard
      id="student-actions"
      title="Student Management"
      description="Engage with your students"
      icon={<Users className="w-4 h-4" />}
      actions={studentActions}
      className={cn('h-fit', className)}
    />
  );
};
