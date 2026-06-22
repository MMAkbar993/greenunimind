import React, { useState, useEffect, useCallback } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  onResend?: () => void;
  isResending?: boolean;
  disabled?: boolean;
  resendText?: string;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds,
  onComplete,
  onResend,
  isResending = false,
  disabled = false,
  resendText = "Resend Code",
  className
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  // Reset timer when initialSeconds changes
  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsActive(initialSeconds > 0);
  }, [initialSeconds]);

  // Countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsActive(false);
            onComplete?.();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onComplete]);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const handleResend = useCallback(() => {
    if (onResend && !isResending && !disabled) {
      onResend();
    }
  }, [onResend, isResending, disabled]);

  // Simplified component - only show resend button with cooldown
  return (
    <div className={cn('flex justify-center', className)}>
      <Button
        variant="ghost"
        onClick={handleResend}
        disabled={isResending || disabled || timeLeft > 0}
        className={cn(
          'font-semibold transition-all duration-200',
          timeLeft > 0 || disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
        )}
      >
        {isResending ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : timeLeft > 0 ? (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Wait {formatTime(timeLeft)}
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            {resendText}
          </>
        )}
      </Button>
    </div>
  );
};

export default CountdownTimer;
