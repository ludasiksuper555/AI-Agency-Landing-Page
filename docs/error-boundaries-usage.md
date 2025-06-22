# Error Boundaries Usage Guide

## Overview

This project implements a comprehensive error handling system with two levels of Error Boundaries:

1. **GlobalErrorBoundary** - Application-wide error catching
2. **ComponentErrorBoundary** - Component-specific error handling

## Global Error Boundary

### Features

- Catches all unhandled errors in the application
- Provides user-friendly fallback UI
- Integrates with Sentry for error reporting
- Offers retry mechanisms and user feedback options
- Includes error reporting to administrators

### Usage

```tsx
import { GlobalErrorBoundary } from '../components/ErrorBoundary/GlobalErrorBoundary';

function App() {
  return (
    <GlobalErrorBoundary>
      <YourAppContent />
    </GlobalErrorBoundary>
  );
}
```

### Configuration Options

```tsx
<GlobalErrorBoundary
  enableUserFeedback={true} // Allow users to send feedback
  enableRetry={true} // Show retry button
  maxRetries={3} // Maximum retry attempts
  showErrorDetails={false} // Show technical details (dev only)
  onError={(error, errorInfo) => {
    // Custom error handler
    // Custom logic
  }}
>
  <App />
</GlobalErrorBoundary>
```

## Component Error Boundary

### Features

- Isolates errors to specific components
- Prevents error propagation to parent components
- Configurable retry mechanisms
- Detailed error reporting with component context
- Collapsible error details for debugging

### Basic Usage

```tsx
import { ComponentErrorBoundary } from '../components/ErrorBoundary/ComponentErrorBoundary';

function MyPage() {
  return (
    <div>
      <ComponentErrorBoundary componentName="UserProfile" isolateErrors={true} enableRetry={true}>
        <UserProfile />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary componentName="PostsList" maxRetries={2} retryDelay={2000}>
        <PostsList />
      </ComponentErrorBoundary>
    </div>
  );
}
```

### Higher-Order Component (HOC)

```tsx
import { withComponentErrorBoundary } from '../components/ErrorBoundary/ComponentErrorBoundary';

const MyComponent = () => {
  return <div>My Component Content</div>;
};

// Wrap with error boundary
const SafeMyComponent = withComponentErrorBoundary(MyComponent, {
  isolateErrors: true,
  enableRetry: true,
  maxRetries: 2,
});

export default SafeMyComponent;
```

### Custom Fallback UI

```tsx
<ComponentErrorBoundary
  componentName="CustomComponent"
  fallback={(error, retry) => (
    <div className="custom-error-ui">
      <h3>Oops! Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={retry}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</ComponentErrorBoundary>
```

## Error Handler Hook

For functional components that need to handle errors manually:

```tsx
import { useErrorHandler } from '../components/ErrorBoundary/ComponentErrorBoundary';

function MyFunctionalComponent() {
  const handleError = useErrorHandler();

  const handleAsyncOperation = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error, {
        operation: 'riskyOperation',
        userId: user.id,
        timestamp: Date.now(),
      });
    }
  };

  return <button onClick={handleAsyncOperation}>Perform Risky Operation</button>;
}
```

## Configuration Options

### ComponentErrorBoundary Props

| Prop               | Type                    | Default       | Description                   |
| ------------------ | ----------------------- | ------------- | ----------------------------- |
| `componentName`    | `string`                | `'Component'` | Name for error identification |
| `isolateErrors`    | `boolean`               | `false`       | Prevent error propagation     |
| `enableRetry`      | `boolean`               | `true`        | Show retry button             |
| `maxRetries`       | `number`                | `2`           | Maximum retry attempts        |
| `retryDelay`       | `number`                | `1000`        | Delay between retries (ms)    |
| `showErrorDetails` | `boolean`               | `dev mode`    | Show technical error details  |
| `fallback`         | `ReactNode \| Function` | `undefined`   | Custom fallback UI            |
| `onError`          | `Function`              | `undefined`   | Custom error handler          |

## Error Reporting Integration

### Sentry Configuration

The error boundaries automatically integrate with Sentry for error reporting:

```typescript
// Enhanced Sentry configuration
initEnhancedSentry({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enableUserFeedback: true,
  enablePerformanceMonitoring: true,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Error Categories

Errors are automatically categorized:

- **UI**: Component rendering errors
- **API**: Network and API errors
- **VALIDATION**: Form and data validation errors
- **AUTHENTICATION**: Auth-related errors
- **AUTHORIZATION**: Permission errors
- **BUSINESS_LOGIC**: Application logic errors
- **SYSTEM**: System-level errors
- **SECURITY**: Security-related errors
- **PERFORMANCE**: Performance issues
- **UNKNOWN**: Uncategorized errors

### Error Severity Levels

- **LOW**: Minor issues, non-blocking
- **MEDIUM**: Moderate issues, some functionality affected
- **HIGH**: Major issues, significant functionality affected
- **CRITICAL**: Critical issues, application unusable

## Best Practices

### 1. Strategic Placement

```tsx
// ✅ Good: Wrap major sections
<Layout>
  <GlobalErrorBoundary>
    <ComponentErrorBoundary componentName="Header" isolateErrors={true}>
      <Header />
    </ComponentErrorBoundary>

    <ComponentErrorBoundary componentName="MainContent">
      <MainContent />
    </ComponentErrorBoundary>

    <ComponentErrorBoundary componentName="Footer" isolateErrors={true}>
      <Footer />
    </ComponentErrorBoundary>
  </GlobalErrorBoundary>
</Layout>
```

### 2. Error Isolation

```tsx
// ✅ Good: Isolate non-critical components
<ComponentErrorBoundary componentName="Sidebar" isolateErrors={true}>
  <Sidebar />
</ComponentErrorBoundary>

// ✅ Good: Don't isolate critical components
<ComponentErrorBoundary componentName="CheckoutForm" isolateErrors={false}>
  <CheckoutForm />
</ComponentErrorBoundary>
```

### 3. Custom Error Handling

```tsx
// ✅ Good: Add context-specific error handling
<ComponentErrorBoundary
  componentName="PaymentProcessor"
  onError={(error, errorInfo) => {
    // Log to payment monitoring service
    paymentLogger.logError(error);

    // Notify user of payment failure
    showPaymentErrorNotification();
  }}
>
  <PaymentProcessor />
</ComponentErrorBoundary>
```

### 4. Development vs Production

```tsx
// ✅ Good: Different behavior for dev/prod
<ComponentErrorBoundary
  componentName="DataVisualization"
  showErrorDetails={process.env.NODE_ENV === 'development'}
  maxRetries={process.env.NODE_ENV === 'development' ? 5 : 2}
>
  <DataVisualization />
</ComponentErrorBoundary>
```

## Testing Error Boundaries

### Test Component

```tsx
// Create a component that throws errors for testing
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div>Component working normally</div>;
};

// Test in your application
<ComponentErrorBoundary componentName="TestComponent">
  <ErrorThrowingComponent shouldThrow={true} />
</ComponentErrorBoundary>;
```

### Console Commands

```javascript
// Trigger error boundary in browser console
throw new Error('Test error boundary');

// Test async error
setTimeout(() => {
  throw new Error('Test async error');
}, 1000);
```

## Monitoring and Analytics

### Error Metrics

The system automatically tracks:

- Error frequency by component
- Error severity distribution
- Retry success rates
- User feedback on errors
- Performance impact of errors

### Dashboard Integration

Errors are automatically sent to:

- Sentry for error tracking
- Internal API (`/api/errors`) for custom analytics
- Console logs for development debugging

## Troubleshooting

### Common Issues

1. **Error boundaries not catching errors**

   - Ensure errors occur during rendering, not in event handlers
   - Use `useErrorHandler` hook for event handler errors

2. **Too many retries**

   - Adjust `maxRetries` based on error type
   - Implement exponential backoff for `retryDelay`

3. **Performance impact**
   - Use `isolateErrors={true}` for non-critical components
   - Avoid deeply nested error boundaries

### Debug Mode

```tsx
// Enable detailed error information
<ComponentErrorBoundary
  componentName="DebugComponent"
  showErrorDetails={true}
  onError={(error, errorInfo) => {
    console.group('🐛 Error Boundary Debug');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }}
>
  <YourComponent />
</ComponentErrorBoundary>
```

This comprehensive error handling system ensures your application remains stable and provides excellent user experience even when errors occur.
