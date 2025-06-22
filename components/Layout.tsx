import React from 'react';

import { ComponentErrorBoundary } from './ErrorBoundary/ComponentErrorBoundary';
import { GlobalErrorBoundary } from './ErrorBoundary/GlobalErrorBoundary';
import Footer from './Footer';
import Header from './Header';
import { useTheme } from './MockClerkProvider';
import SEO, { SEOProps } from './SEO';

interface LayoutProps {
  children: React.ReactNode;
  seo?: SEOProps;
}

const Layout: React.FC<LayoutProps> = ({ children, seo }) => {
  // Використовуємо useTheme з MockClerkProvider
  const { theme } = useTheme();

  return (
    <GlobalErrorBoundary>
      <div
        className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
      >
        {seo && <SEO {...seo} />}
        <ComponentErrorBoundary componentName="Header" isolateErrors={true} enableRetry={true}>
          <Header />
        </ComponentErrorBoundary>

        <ComponentErrorBoundary
          componentName="MainContent"
          isolateErrors={false}
          enableRetry={true}
          maxRetries={3}
        >
          <main className="flex-grow">{children}</main>
        </ComponentErrorBoundary>

        <ComponentErrorBoundary componentName="Footer" isolateErrors={true} enableRetry={true}>
          <Footer />
        </ComponentErrorBoundary>
      </div>
    </GlobalErrorBoundary>
  );
};

export default Layout;
