import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Sparkles, Loader2, RotateCcw, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGeminiAI } from '@/hooks/useGeminiAI';

interface AIDescriptionFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  minHeight?: string;
}

export const AIDescriptionField: React.FC<AIDescriptionFieldProps> = ({
  label,
  value,
  onChange,
  title = '',
  subtitle = '',
  placeholder = "Describe what students will learn in this course...",
  className,
  error,
  minHeight = "200px"
}) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const [lastAIContent, setLastAIContent] = useState('');

  const { enhanceDescription, generateDescription, improveDescription, isLoading } = useGeminiAI();



  const handleGenerate = async () => {
    setLastAIContent(value);
    const result = await generateDescription(title, subtitle);
    if (result) {
      onChange(result);
      setIsManualMode(false);
    }
  };

  const handleImprove = async () => {
    if (!value.trim()) return;
    setLastAIContent(value);
    const result = await improveDescription(value, title, subtitle);
    if (result) {
      onChange(result);
      setIsManualMode(false);
    }
  };

  const handleRevert = () => {
    if (lastAIContent) {
      onChange(lastAIContent);
    }
  };

  const toggleMode = () => {
    setIsManualMode(!isManualMode);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
        <label className="text-sm sm:text-base font-medium text-gray-700">
          {label}
        </label>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleMode}
            className="h-8 px-3 text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            {isManualMode ? 'Rich Editor' : 'Simple Text'}
          </Button>

          {/* Revert Button */}
          {lastAIContent && value !== lastAIContent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevert}
              className="h-8 px-3 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Revert
            </Button>
          )}

          {/* AI Generate Button (when no content) */}
          {!value.trim() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={!title.trim() || isLoading}
              className="h-8 px-3 text-xs bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 text-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generate
                </>
              )}
            </Button>
          )}

          {/* AI Improve Button (when content exists) */}
          {value.trim() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImprove}
              disabled={!title.trim() || isLoading}
              className="h-8 px-3 text-xs bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200 text-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Improve
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        {isManualMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              'w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm',
              'focus:ring-2 focus:ring-green-500 focus:border-green-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'transition-colors duration-200',
              'text-sm sm:text-base resize-vertical',
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
            )}
            style={{ minHeight: minHeight }}
          />
        ) : (
          <RichTextEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={isLoading}
            error={error}
            minHeight={minHeight}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md z-10">
            <div className="flex items-center gap-3 text-green-600 bg-white px-4 py-2 rounded-lg shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">AI is working on your description...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs sm:text-sm text-red-600">{error}</p>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Tip:</strong> Use the AI Enhance feature to automatically improve your description based on your course title and subtitle.</p>
        <p>✨ Switch between Rich Editor for formatting or Simple Text for plain text editing.</p>
      </div>
    </div>
  );
};
