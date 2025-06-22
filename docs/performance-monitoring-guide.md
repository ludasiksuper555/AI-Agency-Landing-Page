# Performance Monitoring Guide

This guide covers the comprehensive performance monitoring system implemented in Stage 5, including Web Vitals tracking, real-time dashboards, and alert management.

## Overview

The performance monitoring system provides:

- **Real-time Web Vitals tracking** (LCP, FID, CLS, FCP, TTFB)
- **Performance dashboard** with visual metrics and trends
- **Alert system** for critical performance issues
- **API endpoints** for metrics collection and analysis
- **Custom React hooks** for easy integration

## Core Components

### 1. Web Vitals Monitoring (`lib/analytics/webVitals.ts`)

Automatically collects Core Web Vitals metrics:

```typescript
import { initWebVitalsMonitoring, cleanupWebVitalsMonitoring } from '../lib/analytics/webVitals';

// Initialize monitoring (already done in _app.tsx)
initWebVitalsMonitoring();

// Cleanup when needed
cleanupWebVitalsMonitoring();
```

**Tracked Metrics:**

- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability
- **FCP (First Contentful Paint)**: Perceived loading speed
- **TTFB (Time to First Byte)**: Server response time

### 2. Performance Dashboard (`lib/analytics/performanceDashboard.ts`)

Provides comprehensive performance analysis:

```typescript
import { getDashboardData, addMetricsToDashboard } from '../lib/analytics/performanceDashboard';

// Get dashboard data for the last hour
const dashboardData = getDashboardData(60 * 60 * 1000);

// Add custom metrics
addMetricsToDashboard(customMetrics);
```

### 3. Performance Configuration (`lib/config/performance.ts`)

Centralized configuration for all performance settings:

```typescript
import { PERFORMANCE_CONFIG, getThreshold, isFeatureEnabled } from '../lib/config/performance';

// Check if real-time monitoring is enabled
if (isFeatureEnabled('realTimeMonitoring')) {
  // Start monitoring
}

// Get performance threshold
const lcpThreshold = getThreshold('LCP', 'good'); // 2500ms
```

## React Components

### 1. PerformanceMonitor Component

Displays comprehensive performance metrics:

```tsx
import PerformanceMonitor from '../components/PerformanceMonitor';

function MyPage() {
  return (
    <div>
      <h1>Performance Dashboard</h1>
      <PerformanceMonitor />
    </div>
  );
}
```

**Features:**

- Real-time metric updates
- Visual rating indicators (Good/Needs Improvement/Poor)
- Performance score calculation
- Automatic refresh every 30 seconds

### 2. PerformanceAlerts Component

Displays real-time performance alerts:

```tsx
import PerformanceAlerts from '../components/PerformanceAlerts';

function Sidebar() {
  return (
    <PerformanceAlerts
      maxAlerts={5}
      compact={true}
      showSummary={true}
      onAlertClick={alert => {
        console.log('Alert clicked:', alert);
      }}
    />
  );
}
```

**Props:**

- `maxAlerts`: Maximum number of alerts to display
- `compact`: Compact display mode
- `showSummary`: Show alert summary statistics
- `autoRefresh`: Enable automatic refresh
- `refreshInterval`: Refresh interval in milliseconds
- `onAlertClick`: Callback when alert is clicked

## Custom Hooks

### 1. usePerformanceMonitoring

Main hook for performance data:

```tsx
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

function MyComponent() {
  const { dashboard, alerts, loading, error, refresh, isStale } = usePerformanceMonitoring({
    refreshInterval: 30000,
    autoRefresh: true,
    onError: error => console.error(error),
    onAlert: alert => console.log('New alert:', alert),
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Performance Score: {dashboard?.overallRating}</h2>
      <p>Total Metrics: {dashboard?.totalMetrics}</p>
      {isStale && <p>Data is stale, refreshing...</p>}
    </div>
  );
}
```

### 2. usePerformanceAlerts

Specialized hook for alerts:

```tsx
import { usePerformanceAlerts } from '../hooks/usePerformanceMonitoring';

function AlertBadge() {
  const { criticalAlerts, warningAlerts, totalAlerts, hasCriticalAlerts } = usePerformanceAlerts();

  return (
    <div className={`badge ${hasCriticalAlerts ? 'critical' : 'normal'}`}>{totalAlerts} alerts</div>
  );
}
```

### 3. usePerformanceMetrics

Hook for specific metrics:

```tsx
import { usePerformanceMetrics } from '../hooks/usePerformanceMonitoring';

function LCPWidget() {
  const { specificMetric, performanceScore } = usePerformanceMetrics('LCP');

  return (
    <div>
      <h3>LCP Performance</h3>
      <p>Average: {specificMetric?.avgValue}ms</p>
      <p>Score: {performanceScore}/100</p>
    </div>
  );
}
```

## API Endpoints

### 1. Web Vitals API (`/api/analytics/web-vitals`)

**POST** - Submit Web Vitals metrics:

```javascript
fetch('/api/analytics/web-vitals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'LCP',
    value: 2300,
    rating: 'good',
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }),
});
```

**GET** - Retrieve performance summary:

```javascript
fetch('/api/analytics/web-vitals')
  .then(response => response.json())
  .then(data => {
    console.log('Performance data:', data.data);
  });
```

### 2. Alerts API (`/api/analytics/alerts`)

**GET** - Retrieve performance alerts:

```javascript
// Get all alerts
fetch('/api/analytics/alerts');

// Get critical alerts only
fetch('/api/analytics/alerts?severity=critical');

// Get alerts for specific metric
fetch('/api/analytics/alerts?metric=LCP');

// Limit results
fetch('/api/analytics/alerts?limit=10');
```

## Performance Dashboard Page

Access the full performance dashboard at `/performance-dashboard`:

- **Quick Stats**: Page views, load time, bounce rate, active users
- **Performance Monitor**: Detailed Web Vitals metrics
- **Alert System**: Real-time performance alerts
- **Performance Tips**: Best practices and recommendations

## Configuration

### Performance Thresholds

Customize performance thresholds in `lib/config/performance.ts`:

```typescript
export const PERFORMANCE_CONFIG = {
  thresholds: {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    // ... other thresholds
  },
};
```

### Alert Configuration

```typescript
export const PERFORMANCE_CONFIG = {
  alerts: {
    enabled: true,
    criticalThreshold: 50, // % of poor metrics
    warningThreshold: 25,
    checkInterval: 5 * 60 * 1000, // 5 minutes
  },
};
```

### Rate Limiting

```typescript
export const PERFORMANCE_CONFIG = {
  rateLimit: {
    webVitals: {
      maxRequests: 1000,
      windowMs: 60 * 1000, // 1 minute
    },
  },
};
```

## Best Practices

### 1. Monitoring Setup

- **Enable monitoring in production** for real user data
- **Use sampling** for high-traffic sites to reduce overhead
- **Monitor key user journeys** and critical pages
- **Set up alerts** for performance regressions

### 2. Performance Optimization

- **Monitor Core Web Vitals** regularly
- **Set performance budgets** and stick to them
- **Use the dashboard** to identify performance bottlenecks
- **Act on alerts** promptly to maintain user experience

### 3. Data Analysis

- **Track trends** over time, not just snapshots
- **Segment data** by device, connection, and user type
- **Correlate performance** with business metrics
- **Use percentiles** (P75, P90) for better insights

## Troubleshooting

### Common Issues

1. **No metrics appearing**:

   - Check if Web Vitals monitoring is initialized
   - Verify API endpoints are working
   - Check browser console for errors

2. **Alerts not triggering**:

   - Verify alert configuration
   - Check if thresholds are set correctly
   - Ensure sufficient data for analysis

3. **Dashboard not updating**:
   - Check network connectivity
   - Verify API rate limits
   - Check for JavaScript errors

### Debug Mode

Enable debug mode in development:

```typescript
// In lib/config/performance.ts
export const PERFORMANCE_CONFIG = {
  webVitals: {
    debug: true, // Enable debug logging
  },
};
```

## Browser Notifications

The system supports browser notifications for critical alerts:

```typescript
// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
```

Notifications are automatically triggered for critical performance issues.

## Integration with Other Systems

### Sentry Integration

Performance data is automatically sent to Sentry when configured:

```typescript
// Performance data is included in Sentry transactions
// No additional setup required
```

### Analytics Integration

Integrate with Google Analytics or other analytics platforms:

```typescript
// Custom implementation in webVitals.ts
function sendToAnalytics(metric) {
  // Send to your analytics platform
  gtag('event', metric.name, {
    value: metric.value,
    metric_rating: metric.rating,
  });
}
```

## Performance Impact

The monitoring system is designed to have minimal performance impact:

- **Lightweight**: < 5KB additional bundle size
- **Efficient**: Uses browser APIs optimally
- **Non-blocking**: Metrics collection doesn't block UI
- **Configurable**: Can be disabled or sampled as needed

## Next Steps

After implementing performance monitoring:

1. **Set up alerts** for your team
2. **Create performance budgets** for your application
3. **Integrate with CI/CD** for performance regression detection
4. **Train your team** on using the dashboard
5. **Establish performance review processes**

For more advanced features, consider:

- Custom metric collection
- Performance regression detection
- Automated performance optimization
- Integration with load testing tools
