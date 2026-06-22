import { useState } from "react";
import { 
  Trash2, 
  Archive, 
  Eye, 
  EyeOff, 
  Copy, 
  Download,
  Edit,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CourseBulkActionsProps, CourseBulkAction } from "@/types/course-management";

const CourseBulkActions: React.FC<CourseBulkActionsProps> = ({
  selectedCourses,
  onBulkAction,
  isLoading = false,
  className
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<CourseBulkAction | null>(null);
  const [progress, setProgress] = useState(0);

  const bulkActions: Array<{
    action: CourseBulkAction;
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'secondary';
    requiresConfirmation: boolean;
    description: string;
  }> = [
    {
      action: 'publish',
      label: 'Publish',
      icon: <Eye className="w-4 h-4" />,
      variant: 'default',
      requiresConfirmation: true,
      description: 'Make selected courses visible to students'
    },
    {
      action: 'unpublish',
      label: 'Unpublish',
      icon: <EyeOff className="w-4 h-4" />,
      variant: 'secondary',
      requiresConfirmation: true,
      description: 'Hide selected courses from students'
    },
    {
      action: 'archive',
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      variant: 'secondary',
      requiresConfirmation: true,
      description: 'Move selected courses to archive'
    },
    {
      action: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="w-4 h-4" />,
      variant: 'secondary',
      requiresConfirmation: false,
      description: 'Create copies of selected courses'
    },
    {
      action: 'export',
      label: 'Export',
      icon: <Download className="w-4 h-4" />,
      variant: 'secondary',
      requiresConfirmation: false,
      description: 'Export selected courses data'
    },
    {
      action: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'destructive',
      requiresConfirmation: true,
      description: 'Permanently delete selected courses'
    }
  ];

  const handleActionClick = (action: CourseBulkAction) => {
    const actionConfig = bulkActions.find(a => a.action === action);
    
    if (actionConfig?.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action: CourseBulkAction) => {
    onBulkAction(action);
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const getActionConfig = (action: CourseBulkAction) => {
    return bulkActions.find(a => a.action === action);
  };

  const getConfirmationMessage = () => {
    const actionConfig = getActionConfig(pendingAction!);
    const count = selectedCourses.length;
    
    switch (pendingAction) {
      case 'delete':
        return `Are you sure you want to permanently delete ${count} course${count !== 1 ? 's' : ''}? This action cannot be undone.`;
      case 'publish':
        return `Are you sure you want to publish ${count} course${count !== 1 ? 's' : ''}? They will become visible to students.`;
      case 'unpublish':
        return `Are you sure you want to unpublish ${count} course${count !== 1 ? 's' : ''}? They will be hidden from students.`;
      case 'archive':
        return `Are you sure you want to archive ${count} course${count !== 1 ? 's' : ''}? They will be moved to the archive.`;
      default:
        return `Are you sure you want to ${actionConfig?.label.toLowerCase()} ${count} course${count !== 1 ? 's' : ''}?`;
    }
  };

  if (selectedCourses.length === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn("dashboard-card border-brand-primary bg-brand-accent", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-brand-primary text-white">
                {selectedCourses.length} selected
              </Badge>
              <span className="text-sm text-gray-600">
                Bulk actions available
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleActionClick('publish')}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                <Eye className="w-4 h-4 mr-2" />
                Publish
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleActionClick('archive')}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        More Actions
                        <span className="ml-2 text-xs">({selectedCourses.length})</span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {bulkActions.map((action, index) => (
                    <div key={action.action}>
                      <DropdownMenuItem
                        onClick={() => handleActionClick(action.action)}
                        className={cn(
                          "cursor-pointer",
                          action.variant === 'destructive' && "text-red-600 focus:text-red-600"
                        )}
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </DropdownMenuItem>
                      {index < bulkActions.length - 1 && action.action === 'export' && (
                        <DropdownMenuSeparator />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress Bar for Bulk Operations */}
          {isLoading && progress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Processing...</span>
                <span className="text-gray-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingAction === 'delete' ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-brand-primary" />
              )}
              Confirm {getActionConfig(pendingAction!)?.label}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{getConfirmationMessage()}</p>
              {pendingAction && (
                <p className="text-sm text-gray-500">
                  {getActionConfig(pendingAction)?.description}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction(pendingAction!)}
              className={cn(
                pendingAction === 'delete' && "bg-red-600 hover:bg-red-700"
              )}
            >
              {getActionConfig(pendingAction!)?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CourseBulkActions;
