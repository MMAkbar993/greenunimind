import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Bug,
  WifiOff,
  HelpCircle
} from 'lucide-react';
import { Logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  lectureId?: string;
  courseId?: string;
  onRetry?: () => void;
  onNavigateBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isOnline: boolean;
}

interface ErrorSolution {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class LectureErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
    retryCount: 0,
    isOnline: navigator.onLine,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `lecture-error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error with context
    Logger.error('Lecture page error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      lectureId: this.props.lectureId,
      courseId: this.props.courseId,
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Track error for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          lecture_id: this.props.lectureId,
          course_id: this.props.courseId
        }
      });
    }
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });
    
    // Auto-retry if error was network-related
    if (this.state.hasError && this.isNetworkError(this.state.error)) {
      this.handleAutoRetry();
    }
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private isNetworkError = (error: Error | null): boolean => {
    if (!error) return false;
    
    const networkErrorMessages = [
      'network error',
      'fetch error',
      'connection failed',
      'timeout',
      'cors',
      'net::',
      'failed to fetch'
    ];
    
    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg) ||
      error.stack?.toLowerCase().includes(msg)
    );
  };

  private getErrorType = (): 'network' | 'permission' | 'content' | 'unknown' => {
    const { error } = this.state;
    if (!error) return 'unknown';

    if (this.isNetworkError(error)) return 'network';
    if (error.message.includes('403') || error.message.includes('unauthorized')) return 'permission';
    if (error.message.includes('video') || error.message.includes('content')) return 'content';
    
    return 'unknown';
  };

  private getSolutions = (): ErrorSolution[] => {
    const errorType = this.getErrorType();
    const { isOnline } = this.state;

    switch (errorType) {
      case 'network':
        return [
          {
            title: 'Check Your Internet Connection',
            description: isOnline 
              ? 'Your connection seems unstable. Try refreshing the page.'
              : 'You appear to be offline. Please check your internet connection.',
            action: isOnline ? {
              label: 'Refresh Page',
              onClick: () => window.location.reload()
            } : undefined
          },
          {
            title: 'Try Again Later',
            description: 'The server might be temporarily unavailable. Please try again in a few minutes.'
          }
        ];

      case 'permission':
        return [
          {
            title: 'Access Denied',
            description: 'You may not have permission to view this content. Please ensure you are enrolled in this course.',
            action: {
              label: 'Go to Course Page',
              onClick: () => this.props.onNavigateBack?.()
            }
          }
        ];

      case 'content':
        return [
          {
            title: 'Content Loading Issue',
            description: 'There was a problem loading the lecture content. This might be a temporary issue.',
            action: {
              label: 'Retry Loading',
              onClick: this.handleRetry
            }
          }
        ];

      default:
        return [
          {
            title: 'Unexpected Error',
            description: 'Something went wrong. Please try refreshing the page or contact support if the problem persists.',
            action: {
              label: 'Refresh Page',
              onClick: () => window.location.reload()
            }
          }
        ];
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    this.props.onRetry?.();
  };

  private handleAutoRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, 2000);
  };

  private handleGoBack = () => {
    if (this.props.onNavigateBack) {
      this.props.onNavigateBack();
    } else {
      window.history.back();
    }
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      lectureId: this.props.lectureId,
      courseId: this.props.courseId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    
    // You could also send this to your error reporting service
    Logger.error('Error report generated:', errorReport);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const solutions = this.getSolutions();
      const errorType = this.getErrorType();
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Lecture Loading Error</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="gap-1">
                      {errorType === 'network' && <WifiOff className="h-3 w-3" />}
                      {errorType === 'permission' && <AlertTriangle className="h-3 w-3" />}
                      {errorType === 'content' && <Bug className="h-3 w-3" />}
                      {errorType === 'unknown' && <HelpCircle className="h-3 w-3" />}
                      {errorType.charAt(0).toUpperCase() + errorType.slice(1)} Error
                    </Badge>
                    
                    {!this.state.isOnline && (
                      <Badge variant="destructive" className="gap-1">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error message */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-mono">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>

              {/* Solutions */}
              <div className="space-y-4">
                <h3 className="font-semibold">Suggested Solutions:</h3>
                {solutions.map((solution, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{solution.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{solution.description}</p>
                    {solution.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={solution.action.onClick}
                      >
                        {solution.action.label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button onClick={this.handleGoBack} variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>

                {canRetry && (
                  <Button onClick={this.handleRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}

                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>

                <Button 
                  onClick={this.handleReportError}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Copy Error Report
                </Button>
              </div>

              {/* Error ID for support */}
              <div className="text-xs text-gray-500 pt-2 border-t">
                Error ID: {this.state.errorId}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LectureErrorBoundary;
