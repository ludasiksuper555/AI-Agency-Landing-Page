'use client';

import React, { useEffect, useState } from 'react';
import { usePerformanceAlerts } from '../hooks/usePerformanceMonitoring';
import { PerformanceAlert } from '../lib/analytics/performanceDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// Alert severity colors and icons
const ALERT_CONFIG = {
  critical: {
    icon: '🚨',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    badgeColor: 'bg-yellow-100 text-yellow-800',
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
};

// Individual alert component
const AlertItem: React.FC<{
  alert: PerformanceAlert;
  onDismiss?: (alertId: string) => void;
  compact?: boolean;
}> = ({ alert, onDismiss, compact = false }) => {
  const config = ALERT_CONFIG[alert.type];
  const timeAgo = getTimeAgo(alert.timestamp);

  return (
    <div
      className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all duration-200 hover:shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-lg flex-shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`font-semibold text-sm ${config.textColor}`}>
                {alert.type.toUpperCase()}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
                {alert.metric}
              </span>
            </div>
            <p className={`text-sm ${config.textColor} ${compact ? 'line-clamp-1' : ''}`}>
              {alert.message}
            </p>
            {!compact && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{timeAgo}</span>
                {alert.value && alert.threshold && (
                  <span className="text-xs text-gray-600">
                    Value: {alert.value.toFixed(1)} / Threshold: {alert.threshold}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// Alert summary component
const AlertSummary: React.FC<{
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}> = ({ criticalCount, warningCount, infoCount }) => {
  const total = criticalCount + warningCount + infoCount;

  if (total === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-green-600 text-lg mb-1">✅ All Systems Normal</div>
        <div className="text-sm text-gray-600">No performance alerts at this time</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        <div className="text-xs text-gray-600">Critical</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
        <div className="text-xs text-gray-600">Warning</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{infoCount}</div>
        <div className="text-xs text-gray-600">Info</div>
      </div>
    </div>
  );
};

// Main alerts component
interface PerformanceAlertsProps {
  maxAlerts?: number;
  compact?: boolean;
  showSummary?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAlertClick?: (alert: PerformanceAlert) => void;
  className?: string;
}

const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({
  maxAlerts = 10,
  compact = false,
  showSummary = true,
  autoRefresh = true,
  refreshInterval = 60000,
  onAlertClick,
  className = '',
}) => {
  const {
    alerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    totalAlerts,
    hasCriticalAlerts,
    loading,
    error,
    refresh,
    clearError,
  } = usePerformanceAlerts({
    refreshInterval,
    autoRefresh,
    onError: error => {
      console.error('Performance alerts error:', error);
    },
    onAlert: alert => {
      // Show browser notification for critical alerts
      if (alert.type === 'critical' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Critical Performance Alert', {
            body: alert.message,
            icon: '/favicon.ico',
            tag: alert.id,
          });
        }
      }
    },
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);

      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id)).slice(0, maxAlerts);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleAlertClick = (alert: PerformanceAlert) => {
    if (onAlertClick) {
      onAlertClick(alert);
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Performance Alerts</span>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">⚠️ Alert System Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <div className="flex space-x-2">
            <button
              onClick={refresh}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Performance Alerts</span>
              {totalAlerts > 0 && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    hasCriticalAlerts ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {totalAlerts}
                </span>
              )}
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </CardTitle>
            <CardDescription>Real-time performance monitoring alerts</CardDescription>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {showSummary && (
          <AlertSummary
            criticalCount={criticalAlerts.length}
            warningCount={warningAlerts.length}
            infoCount={infoAlerts.length}
          />
        )}

        {visibleAlerts.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-green-600 text-lg mb-1">✅ No Active Alerts</div>
            <div className="text-sm text-gray-600">
              {dismissedAlerts.size > 0
                ? `${dismissedAlerts.size} alert(s) dismissed`
                : 'All systems are performing normally'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={onAlertClick ? 'cursor-pointer' : ''}
              >
                <AlertItem alert={alert} onDismiss={handleDismissAlert} compact={compact} />
              </div>
            ))}
          </div>
        )}

        {dismissedAlerts.size > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => setDismissedAlerts(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Show {dismissedAlerts.size} dismissed alert(s)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to format time ago
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export default PerformanceAlerts;
export { AlertItem, AlertSummary };
