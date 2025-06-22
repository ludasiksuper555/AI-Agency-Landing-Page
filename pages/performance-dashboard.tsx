import { GetServerSideProps } from 'next';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import PerformanceMonitor from '../components/PerformanceMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PerformanceAlert } from '../lib/analytics/performanceDashboard';

// Alert component
const AlertCard: React.FC<{ alert: PerformanceAlert }> = ({ alert }) => {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📊';
    }
  };

  const getAlertTextColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <Card className={`border-l-4 ${getAlertColor(alert.type)}`}>
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          <span className="text-lg">{getAlertIcon(alert.type)}</span>
          <div className="flex-1">
            <div className={`font-semibold ${getAlertTextColor(alert.type)}`}>
              {alert.type.toUpperCase()}: {alert.metric}
            </div>
            <div className={`text-sm ${getAlertTextColor(alert.type)} mt-1`}>{alert.message}</div>
            <div className="text-xs text-gray-500 mt-2">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Alerts section component
const AlertsSection: React.FC = () => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/analytics/alerts');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAlerts(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Alerts</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Performance Alerts</span>
          {alerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </CardTitle>
        <CardDescription>Recent performance issues and warnings</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-lg mb-2">✅ All Good!</div>
            <div className="text-sm text-gray-600">No performance alerts at this time.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Performance tips component
const PerformanceTips: React.FC = () => {
  const tips = [
    {
      title: 'Optimize Images',
      description: 'Use Next.js Image component and modern formats like WebP',
      icon: '🖼️',
    },
    {
      title: 'Code Splitting',
      description: 'Use dynamic imports to reduce initial bundle size',
      icon: '📦',
    },
    {
      title: 'Caching Strategy',
      description: 'Implement proper caching headers and service workers',
      icon: '💾',
    },
    {
      title: 'Minimize JavaScript',
      description: 'Remove unused code and optimize third-party scripts',
      icon: '⚡',
    },
    {
      title: 'Database Optimization',
      description: 'Optimize queries and implement proper indexing',
      icon: '🗄️',
    },
    {
      title: 'CDN Usage',
      description: 'Serve static assets from a Content Delivery Network',
      icon: '🌐',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Tips</CardTitle>
        <CardDescription>Best practices to improve your application performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <span className="text-lg">{tip.icon}</span>
              <div>
                <div className="font-semibold text-sm">{tip.title}</div>
                <div className="text-xs text-gray-600 mt-1">{tip.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Quick stats component
const QuickStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalPageViews: 0,
    avgLoadTime: 0,
    bounceRate: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    // Simulate fetching quick stats
    // In a real application, this would fetch from your analytics API
    setStats({
      totalPageViews: Math.floor(Math.random() * 10000) + 1000,
      avgLoadTime: Math.floor(Math.random() * 2000) + 500,
      bounceRate: Math.floor(Math.random() * 50) + 20,
      activeUsers: Math.floor(Math.random() * 100) + 10,
    });
  }, []);

  const statItems = [
    {
      label: 'Page Views (24h)',
      value: stats.totalPageViews.toLocaleString(),
      icon: '👁️',
      color: 'text-blue-600',
    },
    {
      label: 'Avg Load Time',
      value: `${stats.avgLoadTime}ms`,
      icon: '⏱️',
      color: stats.avgLoadTime > 1500 ? 'text-red-600' : 'text-green-600',
    },
    {
      label: 'Bounce Rate',
      value: `${stats.bounceRate}%`,
      icon: '📊',
      color: stats.bounceRate > 40 ? 'text-red-600' : 'text-green-600',
    },
    {
      label: 'Active Users',
      value: stats.activeUsers.toString(),
      icon: '👥',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">{item.label}</div>
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              </div>
              <span className="text-2xl">{item.icon}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Main dashboard page component
const PerformanceDashboardPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Performance Dashboard - Monitoring & Analytics</title>
        <meta
          name="description"
          content="Real-time performance monitoring and analytics dashboard"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
            <p className="text-gray-600">
              Monitor your application's performance metrics and Core Web Vitals in real-time.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mb-8">
            <QuickStats />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Monitor - Takes 2 columns */}
            <div className="lg:col-span-2">
              <PerformanceMonitor />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Alerts */}
              <AlertsSection />

              {/* Performance Tips */}
              <PerformanceTips />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500">
            <p>
              Performance data is collected using Core Web Vitals and custom metrics.
              <br />
              Data is refreshed every 30 seconds.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerformanceDashboardPage;

// Server-side props (optional - for initial data loading)
export const getServerSideProps: GetServerSideProps = async context => {
  // You can fetch initial performance data here if needed
  // For now, we'll let the client-side components handle data fetching

  return {
    props: {
      // initialData: performanceData
    },
  };
};
