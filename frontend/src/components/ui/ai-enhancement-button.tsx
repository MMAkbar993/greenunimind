import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIEnhancementButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  children?: React.ReactNode;
}

export const AIEnhancementButton: React.FC<AIEnhancementButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  size = 'sm',
  variant = 'outline',
  className,
  children = 'Enhance with AI',
}) => {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center gap-2 transition-all duration-200',
        'hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 hover:text-white',
        'focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {children}
    </Button>
  );
};

interface AIEnhancementFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onEnhance: () => void;
  isEnhancing?: boolean;
  placeholder?: string;
  type?: 'input' | 'textarea';
  rows?: number;
  className?: string;
  error?: string;
}

export const AIEnhancementField: React.FC<AIEnhancementFieldProps> = ({
  label,
  value,
  onChange,
  onEnhance,
  isEnhancing = false,
  placeholder,
  type = 'input',
  rows = 3,
  className,
  error,
}) => {
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <label className="text-sm sm:text-base font-medium text-gray-700">{label}</label>
        <AIEnhancementButton
          onClick={onEnhance}
          isLoading={isEnhancing}
          disabled={!value.trim()}
          size="sm"
          className="self-start sm:self-auto"
        />
      </div>
      <div className="relative">
        <InputComponent
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={type === 'textarea' ? rows : undefined}
          className={cn(
            'w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md shadow-sm',
            'focus:ring-2 focus:ring-green-500 focus:border-green-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            'transition-colors duration-200',
            'text-sm sm:text-base',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            type === 'textarea' && 'resize-vertical min-h-[80px]',
            type === 'input' && 'h-10 sm:h-12'
          )}
          disabled={isEnhancing}
        />
        {isEnhancing && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-md">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enhancing...
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
    </div>
  );
};
