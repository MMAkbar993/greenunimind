import React, { useState, useEffect } from 'react';
import { Loader2, Server, Wifi } from 'lucide-react';

interface ServerWakeUpLoaderProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ServerWakeUpLoader: React.FC<ServerWakeUpLoaderProps> = ({
  isLoading,
  error,
  onRetry
}) => {
  const [dots, setDots] = useState('');
  const [showWakeUpMessage, setShowWakeUpMessage] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    // Show wake-up message after 3 seconds
    const wakeUpTimer = setTimeout(() => {
      setShowWakeUpMessage(true);
    }, 3000);

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => {
      clearTimeout(wakeUpTimer);
      clearInterval(dotsInterval);
      setShowWakeUpMessage(false);
      setDots('');
    };
  }, [isLoading]);

  if (!isLoading && !error) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Server className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connection Error
            </h3>
            <p className="text-gray-600 mb-4">
              {error.includes('timeout') || error.includes('network') 
                ? "The server is waking up. This may take a moment..."
                : error
              }
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              {showWakeUpMessage ? (
                <Wifi className="w-8 h-8 text-blue-600 animate-pulse" />
              ) : (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {showWakeUpMessage ? 'Waking up server' : 'Loading'}
              <span className="inline-block w-8 text-left">{dots}</span>
            </h3>
            
            {showWakeUpMessage ? (
              <div className="space-y-2">
                <p className="text-gray-600">
                  Our server is starting up. This usually takes 10-15 seconds.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                Please wait while we load your content...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServerWakeUpLoader;
