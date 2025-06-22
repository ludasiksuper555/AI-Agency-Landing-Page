import { useCallback, useEffect, useRef, useState } from 'react';
import { PerformanceAlert, PerformanceDashboardData } from '../lib/analytics/performanceDashboard';
import { PERFORMANCE_CONFIG } from '../lib/config/performance';

// Hook state interface
interface PerformanceMonitoringState {
  dashboard: PerformanceDashboardData | null;
  alerts: PerformanceAlert[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Hook options interface
interface UsePerformanceMonitoringOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  timeRange?: number;
  onError?: (error: Error) => void;
  onAlert?: (alert: PerformanceAlert) => void;
}

// Hook return interface
interface UsePerformanceMonitoringReturn extends PerformanceMonitoringState {
  refresh: () => Promise<void>;
  clearError: () => void;
  isStale: boolean;
}

/**
 * Custom hook for real-time performance monitoring
 * Provides dashboard data, alerts, and automatic refresh functionality
 */
export const usePerformanceMonitoring = ({
  refreshInterval = 30000, // 30 seconds
  autoRefresh = true,
  timeRange = 60 * 60 * 1000, // 1 hour
  onError,
  onAlert,
}: UsePerformanceMonitoringOptions = {}): UsePerformanceMonitoringReturn => {
  const [state, setState] = useState<PerformanceMonitoringState>({
    dashboard: null,
    alerts: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousAlertsRef = useRef<PerformanceAlert[]>([]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (): Promise<PerformanceDashboardData | null> => {
    const response = await fetch('/api/analytics/web-vitals', {
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      throw new Error(`Dashboard fetch failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch dashboard data');
    }

    return result.data;
  }, []);

  // Fetch alerts data
  const fetchAlerts = useCallback(async (): Promise<PerformanceAlert[]> => {
    const response = await fetch('/api/analytics/alerts', {
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      throw new Error(`Alerts fetch failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch alerts data');
    }

    return result.data || [];
  }, []);

  // Main refresh function
  const refresh = useCallback(async (): Promise<void> => {
    if (!PERFORMANCE_CONFIG.features.realTimeMonitoring) {
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Fetch data in parallel
      const [dashboardData, alertsData] = await Promise.all([fetchDashboard(), fetchAlerts()]);

      // Check for new alerts
      if (onAlert && alertsData.length > 0) {
        const previousAlertIds = new Set(previousAlertsRef.current.map(a => a.id));
        const newAlerts = alertsData.filter(alert => !previousAlertIds.has(alert.id));

        newAlerts.forEach(alert => {
          onAlert(alert);
        });
      }

      previousAlertsRef.current = alertsData;

      setState({
        dashboard: dashboardData,
        alerts: alertsData,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      // Don't update state if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      if (onError && error instanceof Error) {
        onError(error);
      }

      console.error('Performance monitoring error:', error);
    }
  }, [fetchDashboard, fetchAlerts, onError, onAlert]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check if data is stale
  const isStale = state.lastUpdated ? Date.now() - state.lastUpdated > refreshInterval * 2 : false;

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh || !PERFORMANCE_CONFIG.features.realTimeMonitoring) {
      return;
    }

    // Initial fetch
    refresh();

    // Setup interval
    intervalRef.current = setInterval(refresh, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refresh, refreshInterval, autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    refresh,
    clearError,
    isStale,
  };
};

// Specialized hook for alerts only
export const usePerformanceAlerts = (
  options: Omit<UsePerformanceMonitoringOptions, 'timeRange'> = {}
) => {
  const { alerts, loading, error, refresh, clearError } = usePerformanceMonitoring({
    ...options,
    refreshInterval: options.refreshInterval || 60000, // 1 minute for alerts
  });

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');
  const infoAlerts = alerts.filter(alert => alert.type === 'info');

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    totalAlerts: alerts.length,
    hasCriticalAlerts: criticalAlerts.length > 0,
    hasWarningAlerts: warningAlerts.length > 0,
    loading,
    error,
    refresh,
    clearError,
  };
};

// Hook for performance metrics summary
export const usePerformanceMetrics = (metricName?: string) => {
  const { dashboard, loading, error, refresh } = usePerformanceMonitoring();

  const metrics = dashboard?.byName || {};
  const specificMetric = metricName ? metrics[metricName] : null;
  const overallRating = dashboard?.overallRating;

  // Calculate overall performance score
  const performanceScore = overallRating
    ? Math.round(
        (overallRating.good /
          (overallRating.good + overallRating['needs-improvement'] + overallRating.poor)) *
          100
      ) || 0
    : 0;

  return {
    metrics,
    specificMetric,
    overallRating,
    performanceScore,
    totalMetrics: dashboard?.totalMetrics || 0,
    timeRange: dashboard?.timeRange,
    loading,
    error,
    refresh,
  };
};

export default usePerformanceMonitoring;
