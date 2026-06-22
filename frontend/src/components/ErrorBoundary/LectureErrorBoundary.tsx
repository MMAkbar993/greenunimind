import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { config } from '@/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class LectureErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (config.node_env === 'development') {
      console.error('LectureErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service in production
    if (config.node_env === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // This would be replaced with actual error logging service
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(logError => {
        console.error('Failed to log error to service:', logError);
      });
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorReport = {
      errorId,
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      componentStack: errorInfo?.componentStack || 'No component stack',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
      alert('Error report copied to clipboard. Please share this with support.');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(errorReport, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.warn('Fallback copy method failed:', err);
      }
      document.body.removeChild(textArea);
      alert('Error report copied to clipboard. Please share this with support.');
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Something went wrong
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    We encountered an error while loading the lectures page
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Error ID: {this.state.errorId}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Retry {this.retryCount}/{this.maxRetries}
                  </Badge>
                </div>
                
                {config.node_env === 'development' && this.state.error && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Error Details (Development)</h4>
                    <p className="text-sm text-red-600 font-mono mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-900">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                  disabled={this.retryCount >= this.maxRetries}
                >
                  <RefreshCw className="w-4 h-4" />
                  {this.retryCount >= this.maxRetries ? 'Max Retries Reached' : 'Try Again'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/teacher/dashboard'}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.handleReportError}
                  className="flex items-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  Report Error
                </Button>
              </div>

              <div className="text-sm text-gray-500 space-y-2">
                <p>
                  If this problem persists, please try refreshing the page or contact support.
                </p>
                <p>
                  <strong>Troubleshooting tips:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check your internet connection</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Try using a different browser</li>
                  <li>Disable browser extensions temporarily</li>
                </ul>
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
