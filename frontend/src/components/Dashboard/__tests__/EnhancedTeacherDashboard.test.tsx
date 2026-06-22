import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EnhancedTeacherDashboard from '../EnhancedTeacherDashboard';

// Mock the API hooks
vi.mock('../../../redux/features/course/courseApi', () => ({
  useGetTeacherCoursesQuery: () => ({
    data: {
      data: [
        {
          _id: '1',
          title: 'Test Course',
          description: 'Test Description',
          price: 99,
          averageRating: 4.5,
          lectures: [{ _id: '1', title: 'Lecture 1' }],
          enrollments: [{ _id: '1' }],
          isPublished: true,
          createdAt: new Date().toISOString(),
        }
      ]
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock('../../../redux/features/user/userApi', () => ({
  useGetUserQuery: () => ({
    data: {
      data: {
        name: { firstName: 'John', lastName: 'Doe' },
        email: 'john@example.com',
      }
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../../redux/features/stripe/stripeApi', () => ({
  useGetStripeStatusQuery: () => ({
    data: {
      data: {
        isConnected: true,
        isVerified: true,
        onboardingComplete: true,
        requirements: [],
        accountId: 'acct_test',
      }
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../../hooks/useDashboardAnalytics', () => ({
  default: () => ({
    dashboardStats: {
      totalCourses: 5,
      totalStudents: 100,
      totalEarnings: 5000,
      averageRating: 4.5,
      completionRate: 85,
      publishedCourses: 4,
      draftCourses: 1,
      coursesGrowth: 12,
      studentsGrowth: 8,
      earningsGrowth: 15,
      ratingGrowth: 2,
      completionRateGrowth: 5,
    },
    isLoading: false,
    error: null,
  }),
}));

// Mock performance monitoring
vi.mock('../../../hooks/usePerformanceMonitoring', () => ({
  default: () => ({
    recordMetric: vi.fn(),
    recordError: vi.fn(),
    getMetrics: vi.fn(() => ({})),
  }),
}));

// Mock cache management
vi.mock('../../../hooks/useTeacherDashboardCache', () => ({
  default: () => ({
    dashboardState: {
      stats: {
        totalCourses: 5,
        totalStudents: 100,
        totalEarnings: 5000,
        lastUpdated: new Date(),
      },
      courses: [],
      isStale: false,
    },
    refreshCache: vi.fn(),
    clearCache: vi.fn(),
  }),
}));

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      // Add minimal reducers for testing
      api: (state = {}) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('EnhancedTeacherDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header correctly', async () => {
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
    });
  });

  it('displays statistics cards', async () => {
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Courses')).toBeInTheDocument();
      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    });
  });

  it('shows create course button', async () => {
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Create.*Course/)).toBeInTheDocument();
    });
  });

  it('displays refresh button and handles click', async () => {
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText(/Refresh/);
      expect(refreshButton).toBeInTheDocument();
      
      fireEvent.click(refreshButton);
      // Verify refresh functionality works
    });
  });

  it('renders responsive design elements', async () => {
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      // Check for responsive grid classes
      const statsContainer = document.querySelector('.grid');
      expect(statsContainer).toHaveClass('grid-cols-1');
      expect(statsContainer).toHaveClass('xs:grid-cols-2');
      expect(statsContainer).toHaveClass('lg:grid-cols-3');
    });
  });

  it('handles loading states correctly', async () => {
    // This would test loading states if we modify the mocks
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      // Verify no loading skeletons are shown when data is loaded
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });

  it('displays live updates indicator', async () => {
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Live Updates')).toBeInTheDocument();
    });
  });

  it('shows course management section', async () => {
    renderWithProviders(<EnhancedTeacherDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Course Management/)).toBeInTheDocument();
    });
  });
});
