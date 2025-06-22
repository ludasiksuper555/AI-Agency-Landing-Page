import '../styles/globals.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { appWithTranslation } from 'next-i18next';
import { DefaultSeo } from 'next-seo';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { usePWA, usePWANotifications } from '../hooks/usePWA';

import GoogleAnalytics from '../components/GoogleAnalytics';
// Temporarily comment out RAGProvider to fix build issues
// import { RAGProvider } from '../components/RAG/RAGProvider';
import { NotificationProvider } from '../components/Notification/NotificationProvider';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';
// Компоненти та утиліти
// import ClerkProvider from '../components/ClerkProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import { initWebVitalsMonitoring } from '../lib/analytics/webVitals';
import { initEnhancedSentry } from '../lib/errorReporting/sentryConfig';
import { queryClient } from '../lib/reactQuery';
import { initSentry } from '../lib/sentry';

// Конфігурація SEO за замовчуванням
const defaultSEOConfig = {
  titleTemplate: "%s | М'ясний Консалтинг",
  defaultTitle: "М'ясний Консалтинг - Професійні рішення для м'ясної індустрії",
  description:
    "Провідна консалтингова компанія, що спеціалізується на просуванні м'ясних та ковбасних виробів в Україні та за кордоном, оптимізації виробництва та експортних стратегіях.",
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://meatconsulting.ua/',
    site_name: "М'ясний Консалтинг",
    images: [
      {
        url: 'https://meatconsulting.ua/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "М'ясний Консалтинг",
      },
    ],
  },
  twitter: {
    handle: '@meatconsulting',
    site: '@meatconsulting',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
  ],
};

// Initialize Enhanced Sentry for Stage 4
initEnhancedSentry();

// Fallback to basic Sentry if enhanced fails
try {
  // Enhanced Sentry is already initialized above
} catch (error) {
  console.warn('Enhanced Sentry initialization failed, falling back to basic Sentry:', error);
  initSentry();
}

// Initialize Web Vitals monitoring for Stage 5
if (typeof window !== 'undefined') {
  initWebVitalsMonitoring();
}

// Global error handlers
if (typeof window !== 'undefined') {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);

    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'unhandledrejection',
      }),
    }).catch(err => console.error('Failed to log error:', err));
  });

  // Uncaught JavaScript errors
  window.addEventListener('error', event => {
    console.error('Uncaught error:', event.error);

    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.error?.message || event.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript',
      }),
    }).catch(err => console.error('Failed to log error:', err));
  });
}

// Create a mock RAGProvider to avoid build errors
const MockRAGProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Import MockClerkProvider from the file
import MockClerkProvider from '../components/MockClerkProvider';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [isOnline, setIsOnline] = React.useState(true);

  // PWA hooks
  const { isRegistered, isUpdateAvailable, updateServiceWorker, registration } = usePWA();

  const {
    isSupported: notificationsSupported,
    permission: notificationPermission,
    requestPermission,
  } = usePWANotifications();

  // Застосування оптимізацій продуктивності
  usePerformanceOptimization();

  // Track PWA events
  const trackPWAEvent = (eventName: string, parameters?: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'PWA',
        ...parameters,
      });
    }
  };

  // Відстеження змін маршруту для аналітики
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Відправка події зміни сторінки в Google Analytics
      if (window.gtag && gaMeasurementId) {
        window.gtag('config', gaMeasurementId, {
          page_path: url,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, gaMeasurementId]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      trackPWAEvent('connection_restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      trackPWAEvent('connection_lost');
    };

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Track PWA installation and updates
  useEffect(() => {
    if (isRegistered) {
      trackPWAEvent('service_worker_registered');
    }
  }, [isRegistered]);

  useEffect(() => {
    if (isUpdateAvailable) {
      trackPWAEvent('update_available');
    }
  }, [isUpdateAvailable]);

  // Оптимізація для мобільних пристроїв
  useEffect(() => {
    // Додаємо клас для визначення типу пристрою
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      document.documentElement.classList.add('is-mobile-device');
    } else {
      document.documentElement.classList.add('is-desktop-device');
    }
  }, []);

  // Handle service worker updates
  const handleUpdateClick = () => {
    updateServiceWorker();
    trackPWAEvent('update_applied');
  };

  return (
    <ErrorBoundary>
      <MockClerkProvider>
        <QueryClientProvider client={queryClient}>
          <MockRAGProvider>
            <NotificationProvider>
              {/* Default SEO Configuration */}
              <DefaultSeo {...defaultSEOConfig} />

              {/* Google Analytics */}
              {gaMeasurementId && <GoogleAnalytics measurementId={gaMeasurementId} />}

              {/* Offline indicator */}
              {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 z-50">
                  <span className="font-medium">Ви працюєте в офлайн режимі</span>
                </div>
              )}

              {/* Update available notification */}
              {isUpdateAvailable && (
                <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-50">
                  <span className="font-medium mr-4">Доступне оновлення додатку</span>
                  <button
                    onClick={handleUpdateClick}
                    className="bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Оновити
                  </button>
                </div>
              )}

              {/* Основной компонент */}
              <Component {...pageProps} />

              {/* PWA Install Prompt */}
              <PWAInstallPrompt />

              {/* PWA Status for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-40">
                  <div>PWA Status:</div>
                  <div>SW: {isRegistered ? '✅' : '❌'}</div>
                  <div>Online: {isOnline ? '✅' : '❌'}</div>
                  <div>Notifications: {notificationsSupported ? '✅' : '❌'}</div>
                  <div>Permission: {notificationPermission}</div>
                  {isUpdateAvailable && <div className="text-yellow-300">Update Available!</div>}
                </div>
              )}

              {/* React Query Devtools - только в режиме разработки */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </NotificationProvider>
          </MockRAGProvider>
        </QueryClientProvider>
      </MockClerkProvider>
    </ErrorBoundary>
  );
}

export default appWithTranslation(MyApp);
