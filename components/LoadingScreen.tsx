'use client';

import { Loader2, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingScreenProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export default function LoadingScreen({ 
  message = "Loading...", 
  onRetry, 
  showRetry = false 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {!showRetry ? (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-cyan-400 mx-auto mb-6" />
            <h2 className="text-white text-xl font-bold mb-2">{message}</h2>
            <p className="text-gray-400 text-sm">
              Please wait while we prepare everything for you...
            </p>
          </>
        ) : (
          <>
            <div className="bg-yellow-500/20 p-6 rounded-lg border border-yellow-500/30 mb-6">
              <Wifi className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-white text-xl font-bold mb-2">Connection Issue</h2>
              <p className="text-gray-300 text-sm mb-4">
                We&apos;re having trouble loading the content. This might be due to network issues or server load.
              </p>
              {onRetry && (
                <Button 
                  onClick={onRetry}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
