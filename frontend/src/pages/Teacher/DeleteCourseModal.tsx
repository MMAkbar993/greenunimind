import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useDeleteCourseMutation } from '@/redux/features/course/courseApi';

interface DeleteCourseModalProps {
  courseId: string;
  courseName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const DeleteCourseModal = ({
  courseId,
  courseName,
  trigger,
  onSuccess,
}: DeleteCourseModalProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const navigate = useNavigate();

  const [deleteCourse, { isLoading }] = useDeleteCourseMutation();

  const handleDelete = async () => {
    try {
      await deleteCourse(courseId).unwrap();
      toast.success('Course deleted successfully');
      setOpen(false);

      // Add a small delay before navigation to ensure the modal is fully closed
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/teacher/courses');
        }
      }, 100);
    } catch (error: unknown) {
      console.error('Failed to delete course:', error);
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || 'Failed to delete course');
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="destructive" size="sm" className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              Delete Course
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Course
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{courseName}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-500">
              This action cannot be undone. This will permanently delete the course and all associated content:
            </p>
            <ul className="mt-2 text-sm text-gray-500 list-disc pl-5 space-y-1">
              <li>All lectures and their content</li>
              <li>All student enrollments</li>
              <li>All bookmarks, notes, and questions</li>
              <li>All course materials and thumbnails</li>
            </ul>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm" className="flex items-center gap-1">
            <Trash2 className="h-4 w-4" />
            Delete Course
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Course
          </DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete <span className="font-semibold">{courseName}</span>?
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2">
          <p className="text-sm text-gray-500">
            This action cannot be undone. This will permanently delete the course and all associated content:
          </p>
          <ul className="mt-2 text-sm text-gray-500 list-disc pl-5 space-y-1">
            <li>All lectures and their content</li>
            <li>All student enrollments</li>
            <li>All bookmarks, notes, and questions</li>
            <li>All course materials and thumbnails</li>
          </ul>
        </div>

        <DrawerFooter className="flex flex-row justify-end gap-2 pt-2">
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DrawerClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Course
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DeleteCourseModal;