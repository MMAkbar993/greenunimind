import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, BookOpen, MessageSquare, BarChart3, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Environment } from '@/utils/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: 'dashboard' | 'analytics' | 'messages' | 'reviews' | 'courses';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  getSectionIcon = () => {
    switch (this.props.section) {
      case 'analytics':
        return <BarChart3 className="w-8 h-8 text-blue-500" />;
      case 'messages':
        return <MessageSquare className="w-8 h-8 text-green-500" />;
      case 'reviews':
        return <Star className="w-8 h-8 text-yellow-500" />;
      case 'courses':
        return <BookOpen className="w-8 h-8 text-purple-500" />;
      default:
        return <Home className="w-8 h-8 text-gray-500" />;
    }
  };

  getSectionTitle = () => {
    switch (this.props.section) {
      case 'analytics':
        return 'Analytics Dashboard';
      case 'messages':
        return 'Messages';
      case 'reviews':
        return 'Reviews';
      case 'courses':
        return 'Courses';
      default:
        return 'Dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {this.getSectionIcon()}
            </div>
            <CardTitle className="text-red-700">
              {this.getSectionTitle()} Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Something went wrong while loading this section. This might be a temporary issue.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don't worry - your data is safe. Try refreshing this section or the entire page.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>
            </div>

            {/* Development error details */}
            {Environment.isDevelopment() && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-red-600 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
