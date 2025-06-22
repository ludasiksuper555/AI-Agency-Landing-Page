import { AlertTriangle, Bug, Home, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorCategory, ErrorSeverity, errorLogger } from '../../lib/errorReporting/errorLogger';
import { addSentryBreadcrumb } from '../../lib/errorReporting/sentryConfig';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableUserFeedback?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

/**
 * Global Error Boundary for catching and handling application-wide errors
 * This should wrap the entire application at the highest level
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Add breadcrumb for error context
    addSentryBreadcrumb({
      message: 'Global Error Boundary caught error',
      category: 'error-boundary',
      level: 'error',
      data: {
        errorId,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    });

    // Log error with enhanced context
    await errorLogger.logError(error, {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UI,
      additionalContext: {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'GlobalErrorBoundary',
        retryCount: this.state.retryCount,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Global Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error ID:', errorId);
      console.groupEnd();
    }
  }

  private generateErrorId(): string {
    return `global-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
        retryCount: prevState.retryCount + 1,
      }));

      // Add breadcrumb for retry attempt
      addSentryBreadcrumb({
        message: 'User attempted error recovery',
        category: 'user-action',
        level: 'info',
        data: {
          retryCount: this.state.retryCount + 1,
          errorId: this.state.errorId,
        },
      });
    }
  };

  private handleReload = () => {
    addSentryBreadcrumb({
      message: 'User triggered page reload',
      category: 'user-action',
      level: 'info',
      data: {
        errorId: this.state.errorId,
      },
    });

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;

    if (error && errorInfo) {
      // Create detailed error report
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: new Date().toISOString(),
      };

      // Copy to clipboard for easy reporting
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
        alert(
          'Error details copied to clipboard. Please paste this information when reporting the issue.'
        );
      }

      addSentryBreadcrumb({
        message: 'User generated error report',
        category: 'user-action',
        level: 'info',
        data: { errorId },
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;
      const showDetails = this.props.showErrorDetails ?? process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
            {/* Error Icon and Title */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
              <p className="text-gray-600">
                We're sorry, but an unexpected error occurred. Our team has been notified.
              </p>
              {errorId && (
                <p className="text-sm text-gray-500 mt-2">
                  Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{errorId}</code>
                </p>
              )}
            </div>

            {/* Error Details (Development/Debug Mode) */}
            {showDetails && error && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Bug className="w-5 h-5 mr-2" />
                  Error Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <strong className="text-sm text-gray-700">Message:</strong>
                    <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded mt-1">
                      {error.message}
                    </p>
                  </div>
                  {error.stack && (
                    <div>
                      <strong className="text-sm text-gray-700">Stack Trace:</strong>
                      <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again ({this.maxRetries - retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Reload Page
              </button>

              <Link
                href="/"
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Link>
            </div>

            {/* Additional Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                {this.props.enableUserFeedback && (
                  <button
                    onClick={this.handleReportError}
                    className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Copy Error Details
                  </button>
                )}

                <Link
                  href="/contact"
                  className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </div>
            </div>

            {/* Retry Count Warning */}
            {retryCount >= this.maxRetries && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Maximum retry attempts reached.</strong> Please reload the page or contact
                  support if the problem persists.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
