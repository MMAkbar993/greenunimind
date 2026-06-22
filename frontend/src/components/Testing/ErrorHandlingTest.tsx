import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { RecentActivityEmptyState, AnalyticsEmptyState, MessagesEmptyState } from '@/components/EmptyStates/TeacherEmptyStates';

/**
 * Test component to verify error handling improvements
 * This component simulates different scenarios to ensure proper error handling
 */
const ErrorHandlingTest: React.FC = () => {
  const [scenario, setScenario] = useState<'loading' | 'empty' | 'error' | 'data'>('empty');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);

  // Simulate different scenarios
  const simulateScenario = (newScenario: typeof scenario) => {
    setScenario(newScenario);
    
    switch (newScenario) {
      case 'loading':
        setIsLoading(true);
        setError(null);
        setData([]);
        break;
      case 'empty':
        setIsLoading(false);
        setError(null);
        setData([]);
        break;
      case 'error':
        setIsLoading(false);
        setError({ status: 500, message: 'Internal server error' });
        setData([]);
        break;
      case 'data':
        setIsLoading(false);
        setError(null);
        setData([{ id: 1, title: 'Sample data' }]);
        break;
    }
  };

  const {
    shouldShowError,
    shouldShowEmptyState,
    shouldShowLoading,
    shouldShowContent,
    isNewUser,
    errorMessage
  } = useErrorHandling({
    isLoading,
    error,
    data,
    hasData: data.length > 0,
    isNewUser: scenario === 'empty'
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling Test Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={scenario === 'loading' ? 'default' : 'outline'}
              onClick={() => simulateScenario('loading')}
            >
              Loading State
            </Button>
            <Button 
              variant={scenario === 'empty' ? 'default' : 'outline'}
              onClick={() => simulateScenario('empty')}
            >
              New Teacher (Empty)
            </Button>
            <Button 
              variant={scenario === 'error' ? 'default' : 'outline'}
              onClick={() => simulateScenario('error')}
            >
              API Error
            </Button>
            <Button 
              variant={scenario === 'data' ? 'default' : 'outline'}
              onClick={() => simulateScenario('data')}
            >
              Has Data
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Current Scenario:</strong> {scenario}
            </div>
            <div>
              <strong>Is New User:</strong> {isNewUser ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Should Show Loading:</strong> {shouldShowLoading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Should Show Empty State:</strong> {shouldShowEmptyState ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Should Show Error:</strong> {shouldShowError ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Should Show Content:</strong> {shouldShowContent ? 'Yes' : 'No'}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <strong>Error Message:</strong> {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity Empty State</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityEmptyState />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Messages Empty State</CardTitle>
          </CardHeader>
          <CardContent>
            <MessagesEmptyState />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analytics Empty State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <AnalyticsEmptyState />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={shouldShowLoading ? 'default' : 'secondary'}>
                Loading State: {shouldShowLoading ? 'PASS' : 'INACTIVE'}
              </Badge>
              <span className="text-sm text-gray-600">
                Shows loading skeleton when data is being fetched
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={shouldShowEmptyState ? 'default' : 'secondary'}>
                Empty State: {shouldShowEmptyState ? 'PASS' : 'INACTIVE'}
              </Badge>
              <span className="text-sm text-gray-600">
                Shows welcoming empty state for new teachers instead of errors
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={shouldShowError ? 'destructive' : 'secondary'}>
                Error State: {shouldShowError ? 'PASS' : 'INACTIVE'}
              </Badge>
              <span className="text-sm text-gray-600">
                Shows error only for real API failures, not empty data
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={shouldShowContent ? 'default' : 'secondary'}>
                Content State: {shouldShowContent ? 'PASS' : 'INACTIVE'}
              </Badge>
              <span className="text-sm text-gray-600">
                Shows actual content when data is available
              </span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Expected Behavior for New Teachers:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• No "Failed to load" errors should appear</li>
              <li>• Professional empty states with welcoming messages</li>
              <li>• Clear guidance on next steps (create courses, connect Stripe)</li>
              <li>• Smooth transitions from empty to populated states</li>
              <li>• Error messages only for genuine technical issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorHandlingTest;
