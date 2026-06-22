import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot
} from 'react-beautiful-dnd';
import EnhancedLectureCard from './EnhancedLectureCard';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Video, Plus, GripVertical } from 'lucide-react';

interface Lecture {
  _id: string;
  lectureTitle: string;
  description?: string;
  videoUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  order: number;
  isPreviewFree?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ResponsiveLectureGridProps {
  lectures: Lecture[];
  variant?: 'student' | 'teacher';
  completedLectures?: string[];
  lockedLectures?: string[];
  showActions?: boolean;
  enableDragAndDrop?: boolean;
  onLecturePlay?: (lecture: Lecture) => void;
  onLectureEdit?: (lecture: Lecture) => void;
  onLectureDelete?: (lecture: Lecture) => void;
  onLecturePreview?: (lecture: Lecture) => void;
  onLectureDownload?: (lecture: Lecture) => void;
  onReorderLectures?: (reorderedLectures: Lecture[]) => void;
  onCreateLecture?: () => void;
  className?: string;
  emptyState?: React.ReactNode;
}

const ResponsiveLectureGrid: React.FC<ResponsiveLectureGridProps> = ({
  lectures,
  variant = 'teacher',
  completedLectures = [],
  lockedLectures = [],
  showActions = true,
  enableDragAndDrop = false,
  onLecturePlay,
  onLectureEdit,
  onLectureDelete,
  onLecturePreview,
  onLectureDownload,
  onReorderLectures,
  onCreateLecture,
  className,
  emptyState
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Sort lectures by order
  const sortedLectures = [...lectures].sort((a, b) => a.order - b.order);

  // Drag and drop handlers
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination || !onReorderLectures) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const items = Array.from(sortedLectures);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const reorderedLectures = items.map((lecture, index) => ({
      ...lecture,
      order: index + 1
    }));

    onReorderLectures(reorderedLectures);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (lectures.length === 0) {
    if (emptyState) {
      return <div className={className}>{emptyState}</div>;
    }

    // Default empty state
    return (
      <div className={cn("text-center py-12", className)}>
        <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No lectures yet</h3>
        <p className="text-gray-600 mb-6">
          {variant === 'teacher'
            ? 'Start building your course by adding your first lecture.'
            : 'This course has no lectures available yet.'
          }
        </p>
        {variant === 'teacher' && onCreateLecture && (
          <Button
            onClick={onCreateLecture}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Lecture
          </Button>
        )}
      </div>
    );
  }

  // Render content with or without drag-and-drop
  const renderContent = () => {
    if (enableDragAndDrop && variant === 'teacher') {
      return (
        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          enableDefaultSensors={true}
        >
          <Droppable droppableId="lectures">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  // Use CSS Grid for better layout control and drag-and-drop compatibility
                  "grid gap-6",
                  "grid-cols-1", // Mobile: 1 column
                  "md:grid-cols-2", // Tablet: 2 columns
                  "lg:grid-cols-3", // Desktop: 3 columns
                  // Ensure grid items maintain their size during drag
                  "[&>*]:min-h-0",
                  className
                )}
              >
                {sortedLectures.map((lecture, index) => {
                  const isCompleted = completedLectures.includes(lecture._id);
                  const isLocked = lockedLectures.includes(lecture._id);

                  return (
                    <Draggable key={lecture._id} draggableId={lecture._id} index={index}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={provided.draggableProps.style as React.CSSProperties}
                          className={cn(
                            "relative transition-all duration-200",
                            snapshot.isDragging && "z-50 rotate-1 scale-105 shadow-2xl opacity-95 ring-2 ring-blue-400 ring-opacity-50",
                            "group" // Add group class for hover effects
                          )}
                        >
                          {/* Drag handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-3 right-3 z-20 w-10 h-10 bg-white/95 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110 border border-gray-200"
                            title="Drag to reorder lecture"
                          >
                            <GripVertical className="w-5 h-5 text-gray-700" />
                          </div>

                          <EnhancedLectureCard
                            lecture={lecture}
                            index={index}
                            isCompleted={isCompleted}
                            isLocked={isLocked}
                            showActions={showActions}
                            variant={variant}
                            onPlay={() => onLecturePlay?.(lecture)}
                            onEdit={() => onLectureEdit?.(lecture)}
                            onDelete={() => onLectureDelete?.(lecture)}
                            onPreview={() => onLecturePreview?.(lecture)}
                            onDownload={() => onLectureDownload?.(lecture)}
                            className="h-full"
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      );
    }

    // Regular grid without drag-and-drop
    return (
      <motion.div
        className={cn(
          // Responsive grid: mobile: 1 column, tablet: 2 columns, desktop: 3 columns
          "grid gap-6",
          "grid-cols-1", // Mobile: 1 column
          "md:grid-cols-2", // Tablet: 2 columns
          "lg:grid-cols-3", // Desktop: 3 columns
          className
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {sortedLectures.map((lecture, index) => {
            const isCompleted = completedLectures.includes(lecture._id);
            const isLocked = lockedLectures.includes(lecture._id);

            return (
              <motion.div
                key={lecture._id}
                variants={itemVariants}
                layout
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2 }
                }}
              >
                <EnhancedLectureCard
                  lecture={lecture}
                  index={index}
                  isCompleted={isCompleted}
                  isLocked={isLocked}
                  showActions={showActions}
                  variant={variant}
                  onPlay={() => onLecturePlay?.(lecture)}
                  onEdit={() => onLectureEdit?.(lecture)}
                  onDelete={() => onLectureDelete?.(lecture)}
                  onPreview={() => onLecturePreview?.(lecture)}
                  onDownload={() => onLectureDownload?.(lecture)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    );
  };

  return renderContent();
};

export default ResponsiveLectureGrid;
