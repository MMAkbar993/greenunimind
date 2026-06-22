import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  duration?: number;
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  id?: string;
}

/**
 * Enhanced toast utility with immediate feedback and consistent styling
 * Optimized for real-time dashboard notifications
 */
export const toast = {
  success: (message: string, options: ToastOptions = {}) => {
    return sonnerToast.success(message, {
      duration: 3000,
      position: 'top-right',
      ...options,
    });
  },

  error: (message: string, options: ToastOptions = {}) => {
    return sonnerToast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options,
    });
  },

  warning: (message: string, options: ToastOptions = {}) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  },

  info: (message: string, options: ToastOptions = {}) => {
    return sonnerToast.info(message, {
      duration: 3000,
      position: 'top-right',
      ...options,
    });
  },

  loading: (message: string, options: ToastOptions = {}) => {
    return sonnerToast.loading(message, {
      duration: Infinity,
      position: 'top-right',
      ...options,
    });
  },

  // Real-time specific toasts
  realTime: {
    enrollment: (studentName?: string) => {
      return sonnerToast.success('New student enrollment!', {
        description: studentName
          ? `${studentName} just enrolled in your course`
          : 'A new student has enrolled in your course',
        duration: 6000,
        position: 'top-right',
        action: {
          label: 'View Students',
          onClick: () => (window.location.href = '/teacher/students'),
        },
      });
    },

    payment: (amount: number, courseName?: string) => {
      return sonnerToast.success('Payment received!', {
        description: courseName
          ? `You earned $${amount} from "${courseName}"`
          : `You earned $${amount} from a course purchase`,
        duration: 6000,
        position: 'top-right',
        action: {
          label: 'View Earnings',
          onClick: () => (window.location.href = '/teacher/earnings'),
        },
      });
    },

    courseUpdate: (courseName: string, action: string) => {
      return sonnerToast.info(`Course ${action}`, {
        description: `"${courseName}" has been ${action.toLowerCase()}`,
        duration: 4000,
        position: 'top-right',
        action: {
          label: 'View Course',
          onClick: () => (window.location.href = '/teacher/courses'),
        },
      });
    },

    stripeUpdate: (status: string) => {
      const isSuccess = status === 'connected' || status === 'verified';
      const toastFn = isSuccess ? sonnerToast.success : sonnerToast.info;

      return toastFn(`Stripe account ${status}`, {
        description: isSuccess
          ? 'You can now receive payments from your courses'
          : 'Please complete your Stripe account setup',
        duration: 5000,
        position: 'top-right',
        action: isSuccess
          ? {
              label: 'View Earnings',
              onClick: () => (window.location.href = '/teacher/earnings'),
            }
          : {
              label: 'Complete Setup',
              onClick: () => (window.location.href = '/teacher/stripe-connect'),
            },
      });
    },

    connectionStatus: (isConnected: boolean) => {
      if (isConnected) {
        return sonnerToast.success('Real-time updates connected', {
          description: "You'll receive live notifications for new enrollments and payments",
          duration: 3000,
          position: 'top-right',
        });
      } else {
        return sonnerToast.warning('Real-time updates disconnected', {
          description: 'Attempting to reconnect...',
          duration: 4000,
          position: 'top-right',
        });
      }
    },
  },

  // Dashboard specific toasts - removed to reduce visual clutter
  // Modern dashboards should provide visual feedback through UI state changes
  // rather than intrusive toast notifications for routine operations

  // Utility functions
  dismiss: (id?: string) => {
    return sonnerToast.dismiss(id);
  },

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
      ...options
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    } & ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
      position: 'top-right',
      ...options,
    });
  },
};

export default toast;
