'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// Performance metric interface
interface PerformanceMetric {
  name: string;
  count: number;
  avgValue: number;
  ratings: {
    good: number;
    'needs-improvement': number;
    poor: number;
  };
}

interface PerformanceSummary {
  totalMetrics: number;
  byName: Record<string, PerformanceMetric>;
  overallRating: {
    good: number;
    'needs-improvement': number;
    poor: number;
  };
  timestamp: number;
}

// Metric display component
const MetricCard: React.FC<{ name: string; metric: PerformanceMetric }> = ({ name, metric }) => {
  const total = metric.ratings.good + metric.ratings['needs-improvement'] + metric.ratings.poor;
  const goodPercentage = total > 0 ? (metric.ratings.good / total) * 100 : 0;
  const needsImprovementPercentage =
    total > 0 ? (metric.ratings['needs-improvement'] / total) * 100 : 0;
  const poorPercentage = total > 0 ? (metric.ratings.poor / total) * 100 : 0;

  const getMetricUnit = (metricName: string): string => {
    if (metricName.includes('CLS')) return '';
    return 'ms';
  };

  const getMetricDescription = (metricName: string): string => {
    switch (metricName) {
      case 'LCP':
        return 'Largest Contentful Paint';
      case 'FID':
        return 'First Input Delay';
      case 'CLS':
        return 'Cumulative Layout Shift';
      case 'FCP':
        return 'First Contentful Paint';
      case 'TTFB':
        return 'Time to First Byte';
      case 'DOM_CONTENT_LOADED':
        return 'DOM Content Loaded';
      case 'LOAD_COMPLETE':
        return 'Load Complete';
      case 'SLOW_RESOURCE':
        return 'Slow Resource Loading';
      default:
        return metricName.replace(/_/g, ' ');
    }
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBgColor = (rating: string): string => {
    switch (rating) {
      case 'good':
        return 'bg-green-100';
      case 'needs-improvement':
        return 'bg-yellow-100';
      case 'poor':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {getMetricDescription(name)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Average Value */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Average:</span>
            <span className="text-lg font-bold">
              {metric.avgValue.toFixed(name.includes('CLS') ? 3 : 0)}
              {getMetricUnit(name)}
            </span>
          </div>

          {/* Sample Count */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Samples:</span>
            <span className="text-sm">{metric.count}</span>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Rating Distribution:</div>

            {/* Good */}
            <div className="flex items-center justify-between">
              <span className={`text-xs ${getRatingColor('good')}`}>Good</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${goodPercentage}%` }}
                  />
                </div>
                <span className="text-xs w-8 text-right">{goodPercentage.toFixed(0)}%</span>
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="flex items-center justify-between">
              <span className={`text-xs ${getRatingColor('needs-improvement')}`}>
                Needs Improvement
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-300"
                    style={{ width: `${needsImprovementPercentage}%` }}
                  />
                </div>
                <span className="text-xs w-8 text-right">
                  {needsImprovementPercentage.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Poor */}
            <div className="flex items-center justify-between">
              <span className={`text-xs ${getRatingColor('poor')}`}>Poor</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${poorPercentage}%` }}
                  />
                </div>
                <span className="text-xs w-8 text-right">{poorPercentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Overall performance score component
const OverallScore: React.FC<{ summary: PerformanceSummary }> = ({ summary }) => {
  const total =
    summary.overallRating.good +
    summary.overallRating['needs-improvement'] +
    summary.overallRating.poor;
  const score = total > 0 ? (summary.overallRating.good / total) * 100 : 0;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Overall Performance Score</CardTitle>
        <CardDescription>
          Based on {summary.totalMetrics} metrics collected in the last hour
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div
            className={`rounded-full w-24 h-24 flex items-center justify-center ${getScoreBgColor(score)}`}
          >
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score.toFixed(0)}</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            Last updated: {new Date(summary.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main PerformanceMonitor component
const PerformanceMonitor: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/web-vitals');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch performance data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Failed to fetch performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">⚠️ Error Loading Performance Data</div>
              <div className="text-sm text-gray-600 mb-4">{error}</div>
              <button
                onClick={fetchPerformanceData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary || summary.totalMetrics === 0) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-gray-600 mb-2">📊 No Performance Data Available</div>
              <div className="text-sm text-gray-500">
                Performance metrics will appear here once users start interacting with the
                application.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Monitor</h2>
        <button
          onClick={fetchPerformanceData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Overall Score */}
      <OverallScore summary={summary} />

      {/* Individual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(summary.byName).map(([name, metric]) => (
          <MetricCard key={name} name={name} metric={metric} />
        ))}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
