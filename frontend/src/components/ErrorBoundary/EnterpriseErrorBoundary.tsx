import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/utils/toast';
import { Environment } from '@/utils/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showErrorDetails?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  errorId: string;
}

/**
 * Enterprise-level Error Boundary with comprehensive error handling
 * Features:
 * - Automatic retry with exponential backoff
 * - Error reporting and logging
 * - User-friendly error messages
 * - Graceful degradation
 * - Performance monitoring
 */
export class EnterpriseErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for monitoring
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show error toast
    toast.error('An unexpected error occurred', {
      description: 'Our team has been notified. Please try refreshing the page.',
      duration: 5000,
    });

    // Auto-retry if enabled
    if (this.props.enableRetry !== false && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
    };

    // Log to console for development
    console.error('Enterprise Error Boundary caught an error:', errorReport);

    // In production, send to error reporting service
    if (Environment.isProduction()) {
      // Send to error reporting service (e.g., Sentry, LogRocket, etc.)
      this.sendErrorReport(errorReport);
    }
  }

  private sendErrorReport(errorReport: any) {
    // Implement error reporting to your service
    // Example: Sentry, LogRocket, custom endpoint
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } catch {
      // Silently fail if error reporting fails
    }
  }

  private scheduleRetry = () => {
    const delay = Math.min(
      (this.props.retryDelay || 1000) * Math.pow(2, this.state.retryCount),
      10000
    );

    this.setState({ isRetrying: true });

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
      errorId: this.generateErrorId(),
    }));

    toast.info('Retrying...', {
      description: 'Attempting to recover from the error.',
      duration: 2000,
    });
  };

  private handleManualRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    this.handleRetry();
  };

  private handleGoHome = () => {
    window.location.href = '/teacher/dashboard';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Error Report: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Context: ${this.props.context || 'Unknown'}
Error: ${this.state.error?.message || 'Unknown error'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
`);
    
    window.open(`mailto:support@greenunimind.com?subject=${subject}&body=${body}`);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Something went wrong
              </CardTitle>
              <Badge variant="outline" className="mx-auto mt-2">
                Error ID: {this.state.errorId}
              </Badge>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  We're sorry for the inconvenience. Our team has been automatically notified 
                  and is working to fix this issue.
                </AlertDescription>
              </Alert>

              {this.props.showErrorDetails && this.state.error && (
                <details className="bg-gray-50 p-3 rounded-md">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleManualRetry}
                  disabled={this.state.isRetrying}
                  className="flex-1"
                >
                  {this.state.isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={this.handleReportBug}
                className="w-full text-sm"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report this issue
              </Button>

              {this.state.retryCount > 0 && (
                <div className="text-center text-sm text-gray-500">
                  Retry attempts: {this.state.retryCount} / {this.props.maxRetries || 3}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnterpriseErrorBoundary;
