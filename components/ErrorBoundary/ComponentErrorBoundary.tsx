import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorCategory, ErrorSeverity, errorLogger } from '../../lib/errorReporting/errorLogger';
import { addSentryBreadcrumb } from '../../lib/errorReporting/sentryConfig';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  isolateErrors?: boolean;
  showErrorDetails?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
  showDetails: boolean;
  isRetrying: boolean;
}

/**
 * Component-level Error Boundary for catching and handling errors in specific components
 * This provides more granular error handling and better user experience
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      showDetails: false,
      isRetrying: false,
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
    const componentName = this.props.componentName || 'UnknownComponent';

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Add breadcrumb for component error
    addSentryBreadcrumb({
      message: `Component Error in ${componentName}`,
      category: 'component-error',
      level: 'warning',
      data: {
        errorId,
        componentName,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    });

    // Determine error severity based on component isolation
    const severity = this.props.isolateErrors ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH;

    // Log error with component context
    await errorLogger.logError(error, {
      severity,
      category: ErrorCategory.UI,
      additionalContext: {
        errorId,
        componentName,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ComponentErrorBoundary',
        retryCount: this.state.retryCount,
        isolated: this.props.isolateErrors,
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔧 Component Error Boundary (${componentName})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error ID:', errorId);
      console.groupEnd();
    }
  }

  private generateErrorId(): string {
    const componentName = this.props.componentName || 'component';
    return `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries ?? 2;

    if (this.state.retryCount < maxRetries) {
      this.setState({ isRetrying: true });

      const retryDelay = this.props.retryDelay ?? 1000;

      this.retryTimeout = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          errorId: undefined,
          retryCount: prevState.retryCount + 1,
          isRetrying: false,
        }));

        // Add breadcrumb for retry attempt
        addSentryBreadcrumb({
          message: 'Component error retry attempted',
          category: 'user-action',
          level: 'info',
          data: {
            componentName: this.props.componentName,
            retryCount: this.state.retryCount + 1,
            errorId: this.state.errorId,
          },
        });
      }, retryDelay);
    }
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, errorId, retryCount, showDetails, isRetrying } = this.state;
      const {
        fallback,
        componentName = 'Component',
        enableRetry = true,
        maxRetries = 2,
        showErrorDetails = process.env.NODE_ENV === 'development',
      } = this.props;

      const canRetry = enableRetry && retryCount < maxRetries;

      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error!, this.handleRetry);
        }
        return fallback;
      }

      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 m-2">
          {/* Error Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">{componentName} Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  This component encountered an error and couldn't render properly.
                </p>
                {errorId && (
                  <p className="text-xs text-red-600 mt-1">
                    Error ID: <code className="bg-red-100 px-1 rounded">{errorId}</code>
                  </p>
                )}
              </div>
            </div>

            {/* Toggle Details Button */}
            {showErrorDetails && error && (
              <button
                onClick={this.toggleDetails}
                className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                title="Toggle error details"
              >
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Error Details (Collapsible) */}
          {showErrorDetails && error && showDetails && (
            <div className="mt-4 p-3 bg-red-100 rounded border border-red-200">
              <h4 className="text-xs font-semibold text-red-800 mb-2">Error Details:</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-red-700">Message:</span>
                  <p className="text-xs text-red-600 font-mono bg-white p-2 rounded mt-1 border">
                    {error.message}
                  </p>
                </div>
                {error.stack && (
                  <div>
                    <span className="text-xs font-medium text-red-700">Stack:</span>
                    <pre className="text-xs text-red-600 bg-white p-2 rounded mt-1 border overflow-auto max-h-24">
                      {error.stack.split('\n').slice(0, 5).join('\n')}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex items-center space-x-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : `Retry (${maxRetries - retryCount} left)`}
              </button>
            )}

            {retryCount >= maxRetries && (
              <span className="text-xs text-red-600">
                Max retries reached. Please refresh the page.
              </span>
            )}
          </div>

          {/* Retry Progress */}
          {retryCount > 0 && (
            <div className="mt-2 text-xs text-red-600">
              Retry attempts: {retryCount}/{maxRetries}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-Order Component for easy wrapping
export function withComponentErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundary = (props: P) => {
    return (
      <ComponentErrorBoundary
        componentName={WrappedComponent.displayName || WrappedComponent.name}
        {...errorBoundaryProps}
      >
        <WrappedComponent {...props} />
      </ComponentErrorBoundary>
    );
  };

  WithErrorBoundary.displayName = `withComponentErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundary;
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: any) => {
    errorLogger.logError(error, {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.UI,
      additionalContext: {
        ...context,
        errorBoundary: 'useErrorHandler',
        timestamp: Date.now(),
      },
    });
  }, []);

  return handleError;
}

export default ComponentErrorBoundary;
