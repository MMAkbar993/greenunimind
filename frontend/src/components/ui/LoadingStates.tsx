import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Skeleton for course cards in the course creator interface
export const CourseCardSkeleton = () => (
  <Card className="w-full">
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-32 w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-16" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Skeleton for lecture rows in the lecture table
export const LectureRowSkeleton = () => (
  <tr className="border-b">
    <td className="p-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-16" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-12" />
    </td>
    <td className="p-4">
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </td>
  </tr>
);

// Loading overlay for when lecture updates are in progress
export const LectureUpdateOverlay = ({ isVisible, message = "Updating lecture..." }: {
  isVisible: boolean;
  message?: string;
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-lg">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// Inline loading state for course creator data
export const CourseCreatorLoadingState = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Course cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Loading state for lecture management interface
export const LectureManagementLoadingState = () => (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-28" />
    </div>

    {/* Search and filters */}
    <div className="flex space-x-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Table skeleton */}
    <div className="border rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <LectureRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Success feedback component
export const UpdateSuccessFeedback = ({ isVisible, message = "Update successful!" }: {
  isVisible: boolean;
  message?: string;
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2">
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 bg-white rounded-full flex items-center justify-center">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// Pending state indicator for specific UI elements
export const PendingStateIndicator = ({ isPending, children }: {
  isPending: boolean;
  children: React.ReactNode;
}) => (
  <div className={`relative ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
    {children}
    {isPending && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      </div>
    )}
  </div>
);
