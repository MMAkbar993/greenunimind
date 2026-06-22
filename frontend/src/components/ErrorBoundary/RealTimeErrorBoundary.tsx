import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Environment } from '@/utils/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

class RealTimeErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      connectionStatus: 'connected'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('RealTimeErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show error toast
    toast.error('Real-time update error occurred', {
      description: 'Some features may not work correctly. Attempting to recover...'
    });

    // Start connection monitoring
    this.startConnectionMonitoring();

    // Auto-retry if enabled
    if (this.props.enableRetry !== false && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  startConnectionMonitoring = () => {
    this.connectionCheckInterval = setInterval(() => {
      // Check if we're online
      if (navigator.onLine) {
        if (this.state.connectionStatus !== 'connected') {
          this.setState({ connectionStatus: 'connected' });
          toast.success('Connection restored');
        }
      } else {
        if (this.state.connectionStatus !== 'disconnected') {
          this.setState({ connectionStatus: 'disconnected' });
          toast.warning('Connection lost');
        }
      }
    }, 5000);
  };

  scheduleRetry = () => {
    const delay = this.props.retryDelay || 2000 * Math.pow(2, this.state.retryCount); // Exponential backoff
    
    this.setState({ 
      isRetrying: true,
      connectionStatus: 'reconnecting'
    });

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
      connectionStatus: 'connected'
    }));

    toast.success('Attempting to restore real-time updates...');
  };

  handleManualRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.handleRetry();
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage = (error: Error): string => {
    if (error.message.includes('WebSocket')) {
      return 'Real-time connection failed. Some updates may be delayed.';
    }
    if (error.message.includes('Network')) {
      return 'Network error occurred. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. The server may be experiencing high load.';
    }
    return 'An unexpected error occurred with real-time updates.';
  };

  getConnectionStatusBadge = () => {
    const { connectionStatus } = this.state;
    
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Wifi className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <WifiOff className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'reconnecting':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Reconnecting
          </Badge>
        );
      default:
        return null;
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount, isRetrying } = this.state;
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.props.enableRetry !== false && retryCount < maxRetries;

      return (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Real-Time Updates Temporarily Unavailable
              {this.getConnectionStatusBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                {error ? this.getErrorMessage(error) : 'An error occurred with real-time features.'}
              </AlertDescription>
            </Alert>

            <div className="text-sm text-orange-700">
              <p>What this means:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your data is safe and will be saved</li>
                <li>Live updates may be delayed</li>
                <li>Manual refresh may be needed to see latest changes</li>
                <li>Core functionality remains available</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              {canRetry && (
                <Button
                  onClick={this.handleManualRetry}
                  disabled={isRetrying}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-orange-50"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Connection
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-orange-50"
              >
                Reload Page
              </Button>

              {retryCount >= maxRetries && (
                <div className="text-xs text-orange-600 flex items-center">
                  Maximum retry attempts reached. Please reload the page or contact support if the issue persists.
                </div>
              )}
            </div>

            {Environment.isDevelopment() && error && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-orange-800 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-orange-100 p-2 rounded overflow-auto max-h-32">
                  {error.stack}
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

export default RealTimeErrorBoundary;
