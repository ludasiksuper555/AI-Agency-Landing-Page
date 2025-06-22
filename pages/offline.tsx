import { ArrowLeft, Home, RefreshCw, WifiOff } from 'lucide-react';
import Head from 'next/head';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

/**
 * Offline Page Component
 * Displayed when the user is offline and tries to access a page not in cache
 */
export default function OfflinePage() {
  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <>
      <Head>
        <title>Offline - Trae AI Agency</title>
        <meta
          name="description"
          content="You are currently offline. Please check your internet connection."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              You're Offline
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              It looks like you've lost your internet connection. Some features may not be
              available.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What you can do:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Browse cached pages</li>
                <li>• Use offline features</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <div className="flex gap-2">
                <Button onClick={handleGoBack} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>

                <Button onClick={handleGoHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This page works offline thanks to our Progressive Web App technology.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inline styles for better offline support */}
      <style jsx>{`
        .offline-animation {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}

// Static generation for better offline support
export async function getStaticProps() {
  return {
    props: {},
    // Revalidate every hour
    revalidate: 3600,
  };
}
