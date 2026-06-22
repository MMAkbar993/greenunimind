import React from 'react';
import { useValidatedTeacherId } from '@/hooks/useValidatedTeacherId';
import { useGetPerformanceMetricsQuery } from '@/redux/features/analytics/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Debug component to test teacher ID validation
 * This component demonstrates how the validation prevents API calls with invalid teacher IDs
 */
export const TeacherIdValidationTest: React.FC = () => {
  const { teacherId, isValidTeacherId, shouldSkipQuery, isUserLoading } = useValidatedTeacherId();
  
  // This query will be skipped if teacherId is invalid
  const {
    data: performanceData,
    isLoading: isPerformanceLoading,
    error: performanceError,
    isUninitialized
  } = useGetPerformanceMetricsQuery(
    { teacherId: teacherId || '', filters: { period: 'monthly' } },
    { skip: shouldSkipQuery }
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Teacher ID Validation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Teacher ID:</label>
            <p className="text-sm text-muted-foreground break-all">
              {teacherId || 'undefined'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Validation Status:</label>
            <div className="flex gap-2 mt-1">
              <Badge variant={isValidTeacherId ? "default" : "destructive"}>
                {isValidTeacherId ? "Valid" : "Invalid"}
              </Badge>
              {isUserLoading && <Badge variant="secondary">Loading</Badge>}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Should Skip Query:</label>
            <Badge variant={shouldSkipQuery ? "destructive" : "default"}>
              {shouldSkipQuery ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium">Query Status:</label>
            <div className="flex gap-2 mt-1">
              {isUninitialized && <Badge variant="secondary">Not Started</Badge>}
              {isPerformanceLoading && <Badge variant="secondary">Loading</Badge>}
              {performanceData && <Badge variant="default">Success</Badge>}
              {performanceError && <Badge variant="destructive">Error</Badge>}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Validation Details:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Teacher ID exists: {teacherId ? 'Yes' : 'No'}</li>
            <li>✓ Not 'undefined' string: {teacherId !== 'undefined' ? 'Yes' : 'No'}</li>
            <li>✓ Is string: {typeof teacherId === 'string' ? 'Yes' : 'No'}</li>
            <li>✓ Length is 24: {teacherId?.length === 24 ? 'Yes' : 'No'}</li>
            <li>✓ Valid ObjectId format: {teacherId && /^[0-9a-fA-F]{24}$/.test(teacherId) ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        {performanceError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {(performanceError as any)?.data?.message || 'Unknown error'}
            </p>
          </div>
        )}

        {performanceData && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ API call successful! Performance data loaded.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
