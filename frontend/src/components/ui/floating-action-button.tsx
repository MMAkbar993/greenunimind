import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Video,
  X,
  FileText,
  Upload,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: BookOpen,
      label: 'Create Course',
      href: '/teacher/courses/create',
      color: 'bg-brand-primary hover:bg-brand-primary-dark',
      description: 'Start a new course from scratch'
    },
    {
      icon: Video,
      label: 'Add Lecture',
      href: '/teacher/lectures/create',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Add a lecture to existing course'
    },
    {
      icon: FileText,
      label: 'Use Template',
      href: '/teacher/courses/templates',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Start with a course template'
    },
    {
      icon: Upload,
      label: 'Import Course',
      href: '/teacher/courses/import',
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'Import existing course content'
    }
  ];

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Action Items */}
      <div className={cn(
        "flex flex-col-reverse gap-3 mb-3 transition-all duration-300 transform",
        isExpanded 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      )}>
        {actions.map((action, index) => (
          <div
            key={action.label}
            className={cn(
              "flex items-center gap-3 transition-all duration-300",
              isExpanded 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 translate-x-8"
            )}
            style={{ 
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms' 
            }}
          >
            {/* Action Label */}
            <div className="bg-white rounded-lg shadow-lg border px-3 py-2 max-w-xs">
              <div className="text-sm font-medium text-gray-900">
                {action.label}
              </div>
              <div className="text-xs text-gray-600">
                {action.description}
              </div>
            </div>
            
            {/* Action Button */}
            <Button
              asChild
              size="lg"
              className={cn(
                "w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group",
                action.color
              )}
            >
              <Link to={action.href}>
                <action.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        size="lg"
        className={cn(
          "w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group",
          isExpanded 
            ? "bg-red-600 hover:bg-red-700 rotate-45" 
            : "bg-brand-primary hover:bg-brand-primary-dark rotate-0"
        )}
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <Plus className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
        )}
      </Button>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;
