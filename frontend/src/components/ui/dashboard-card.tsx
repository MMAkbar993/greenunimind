import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Enterprise-grade dashboard card types
export interface DashboardStatCard {
  id: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'purple' | 'indigo';
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

export interface DashboardActionCard {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  actions: Array<{
    label: string;
    href?: string; // Deprecated: use 'to' instead for React Router navigation
    to?: string; // React Router path for client-side navigation
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: React.ReactNode;
    disabled?: boolean;
    external?: boolean; // For external links that should use href
  }>;
  className?: string;
}

export interface DashboardContentCard {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

// Color theme mappings for Green Uni Mind brand
const colorThemes = {
  primary: {
    background: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-500',
    border: 'border-green-200',
  },
  secondary: {
    background: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
    border: 'border-emerald-200',
  },
  success: {
    background: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-500',
    border: 'border-green-200',
  },
  warning: {
    background: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-500',
    border: 'border-amber-200',
  },
  info: {
    background: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-500',
    border: 'border-blue-200',
  },
  purple: {
    background: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-500',
    border: 'border-purple-200',
  },
  indigo: {
    background: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-500',
    border: 'border-indigo-200',
  },
};

// Modern Statistics Card Component
export const DashboardStatCard: React.FC<DashboardStatCard> = ({
  title,
  value,
  icon,
  description,
  trend = 'neutral',
  trendValue,
  trendLabel,
  color = 'primary',
  onClick,
  isLoading = false,
  className,
}) => {
  const theme = colorThemes[color];
  const isClickable = !!onClick;

  if (isLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 shadow-sm bg-white',
          'transition-all duration-200 ease-in-out',
          className
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 shadow-sm bg-white',
        'transition-all duration-200 ease-in-out',
        'hover:shadow-md hover:-translate-y-0.5',
        isClickable && 'cursor-pointer hover:shadow-lg',
        '@media (prefers-reduced-motion: reduce) { transition: none; transform: none; }',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={isClickable ? `View details for ${title}` : undefined}
    >
      {/* Subtle accent border */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', theme.background)} />

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Icon */}
          <div
            className={cn('flex items-center justify-center w-10 h-10 rounded-lg', theme.iconBg)}
          >
            <div className={cn('w-5 h-5', theme.iconColor)}>{icon}</div>
          </div>

          {/* Trend Indicator */}
          {trend !== 'neutral' && trendValue && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className={cn('w-4 h-4', theme.trendUp)} />
              ) : (
                <TrendingDown className={cn('w-4 h-4', theme.trendDown)} />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend === 'up' ? theme.trendUp : theme.trendDown
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-600 leading-none">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          {(description || trendLabel) && (
            <p className="text-xs text-gray-500 leading-none">{trendLabel || description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Modern Action Card Component
export const DashboardActionCard: React.FC<DashboardActionCard> = ({
  title,
  description,
  icon,
  actions,
  className,
}) => {
  const navigate = useNavigate();
  return (
    <Card
      className={cn(
        'border-0 shadow-sm bg-white',
        'transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5',
        '@media (prefers-reduced-motion: reduce) { transition: none; transform: none; }',
        // Enhanced responsive design
        'min-h-[200px] sm:min-h-[220px] md:min-h-[240px]',
        // Better spacing for different screen sizes
        'p-1 xs:p-2 sm:p-3',
        className
      )}
      role="region"
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
    >
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle
          id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
          className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold text-gray-900"
        >
          {icon && (
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-100">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600">{icon}</div>
            </div>
          )}
          {title}
        </CardTitle>
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {actions.map((action, index) => {
            const handleClick = () => {
              if (action.onClick) {
                action.onClick();
              } else if (action.to) {
                navigate(action.to);
              } else if (action.href && action.external) {
                window.open(action.href, '_blank', 'noopener,noreferrer');
              }
            };

            return (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                className={cn(
                  'w-full justify-start text-left',
                  // Enhanced responsive sizing
                  'h-10 sm:h-11 text-sm sm:text-base',
                  'px-3 sm:px-4',
                  // Touch-friendly minimum height for all screen sizes
                  'min-h-[44px]',
                  // Enhanced hover and focus states
                  'hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm',
                  'focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                  'transition-all duration-200',
                  '@media (prefers-reduced-motion: reduce) { transition: none; }',
                  // Better disabled state
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                onClick={handleClick}
                disabled={action.disabled}
                aria-label={action.label}
              >
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  {action.icon && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0">
                      {action.icon}
                    </div>
                  )}
                  <span className="font-medium text-sm sm:text-base truncate">{action.label}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Modern Content Card Component
export const DashboardContentCard: React.FC<DashboardContentCard> = ({
  title,
  description,
  icon,
  children,
  headerAction,
  className,
}) => {
  return (
    <Card
      className={cn(
        'border-0 shadow-sm bg-white',
        'transition-all duration-200 ease-in-out hover:shadow-md',
        '@media (prefers-reduced-motion: reduce) { transition: none; }',
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100">
                <div className="w-4 h-4 text-green-600">{icon}</div>
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
              {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            </div>
          </div>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
};
