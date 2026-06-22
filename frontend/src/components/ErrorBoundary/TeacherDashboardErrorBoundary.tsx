import { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  MessageCircle,
  Bug,
  Lightbulb,
  Shield
} from 'lucide-react';
import { Environment } from '@/utils/environment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

class TeacherDashboardErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error('Teacher Dashboard Error:', error);
    console.error('Error Info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (Environment.isProduction()) {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/teacher/dashboard';
  };

  getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'medium';
    }
    
    if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      return 'low';
    }
    
    return 'high';
  };

  getErrorSuggestions = (error: Error): string[] => {
    const errorMessage = error.message.toLowerCase();
    const suggestions: string[] = [];

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Contact support if the issue persists');
    } else if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      suggestions.push('Clear your browser cache');
      suggestions.push('Try refreshing the page');
      suggestions.push('Update your browser to the latest version');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear your browser cache and cookies');
      suggestions.push('Contact our support team with the error ID');
    }

    return suggestions;
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity(this.state.error);
      const suggestions = this.getErrorSuggestions(this.state.error);
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  severity === 'high' ? 'bg-red-100' : 
                  severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`w-6 h-6 ${
                    severity === 'high' ? 'text-red-600' : 
                    severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Oops! Something went wrong
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={severity === 'high' ? 'destructive' : 'secondary'}>
                      {severity.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Error ID: {this.state.errorId}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Description */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  We encountered an unexpected error while loading your dashboard. 
                  Don't worry - your data is safe and we're working to resolve this issue.
                </AlertDescription>
              </Alert>

              {/* Error Details (only in development) */}
              {Environment.isDevelopment() && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Technical Details (Development Only)
                  </h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  What you can try:
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Support Contact */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Still having trouble? Our support team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open('/teacher/help', '_blank')}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Support
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open('/teacher/help/troubleshooting', '_blank')}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Troubleshooting Guide
                  </Button>
                </div>
              </div>

              {/* Retry Count Warning */}
              {!canRetry && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maximum retry attempts reached. Please reload the page or contact support 
                    if the issue continues.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TeacherDashboardErrorBoundary;
