import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: string;
  details?: any;
  error?: string;
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  loadAverage?: number[];
  nodeVersion: string;
  processId: number;
}

interface HealthData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheckResult[];
  metrics: SystemMetrics;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
  timestamp: string;
}

interface HealthDashboardProps {
  apiEndpoint?: string;
  refreshInterval?: number;
  showDetails?: boolean;
  theme?: 'light' | 'dark';
}

const HealthDashboard: React.FC<HealthDashboardProps> = ({
  apiEndpoint = '/api/health',
  refreshInterval = 30000,
  showDetails = true,
  theme = 'light',
}) => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get<HealthData>(apiEndpoint, {
        timeout: 10000,
      });
      setHealthData(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? `Ошибка API: ${err.response?.status || 'timeout'} - ${err.message}`
        : 'Неизвестная ошибка при загрузке данных';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHealthData, refreshInterval, autoRefresh]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return theme === 'dark' ? '#10B981' : '#059669';
      case 'degraded':
        return theme === 'dark' ? '#F59E0B' : '#D97706';
      case 'unhealthy':
        return theme === 'dark' ? '#EF4444' : '#DC2626';
      default:
        return theme === 'dark' ? '#6B7280' : '#9CA3AF';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    if (bytes === 0) return '0 Б';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms}мс`;
    return `${(ms / 1000).toFixed(1)}с`;
  };

  const themeClasses = {
    container:
      theme === 'dark'
        ? 'bg-gray-900 text-white min-h-screen'
        : 'bg-gray-50 text-gray-900 min-h-screen',
    card: theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    header: theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
    button:
      theme === 'dark'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white',
  };

  if (loading && !healthData) {
    return (
      <div className={`${themeClasses.container} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={themeClasses.text}>Загрузка данных мониторинга...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.container}>
      <div className="container mx-auto px-4 py-6">
        {/* Заголовок */}
        <div className={`${themeClasses.header} rounded-lg border p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Мониторинг системы</h1>
              {lastUpdate && (
                <p className={themeClasses.text}>
                  Последнее обновление: {lastUpdate.toLocaleString('ru-RU')}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  autoRefresh
                    ? themeClasses.button
                    : theme === 'dark'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                {autoRefresh ? '⏸️ Пауза' : '▶️ Авто'}
              </button>
              <button
                onClick={fetchHealthData}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-sm font-medium ${themeClasses.button} disabled:opacity-50`}
              >
                {loading ? '🔄' : '🔄'} Обновить
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <span className="mr-2">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {healthData && (
          <>
            {/* Общий статус */}
            <div className={`${themeClasses.card} rounded-lg border p-6 mb-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Общий статус</h2>
                <div
                  className="px-4 py-2 rounded-full text-white font-medium"
                  style={{ backgroundColor: getStatusColor(healthData.status) }}
                >
                  {getStatusIcon(healthData.status)} {healthData.status.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {healthData.summary.healthy}
                  </div>
                  <div className={themeClasses.text}>Здоровых</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {healthData.summary.degraded}
                  </div>
                  <div className={themeClasses.text}>Деградированных</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {healthData.summary.unhealthy}
                  </div>
                  <div className={themeClasses.text}>Неисправных</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{healthData.summary.total}</div>
                  <div className={themeClasses.text}>Всего сервисов</div>
                </div>
              </div>
            </div>

            {/* Системные метрики */}
            <div className={`${themeClasses.card} rounded-lg border p-6 mb-6`}>
              <h2 className="text-xl font-semibold mb-4">Системные метрики</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className={`${themeClasses.text} text-sm`}>Использование памяти</div>
                  <div className="text-lg font-semibold">
                    {healthData.metrics.memory.percentage}%
                  </div>
                  <div className={`${themeClasses.text} text-xs`}>
                    {formatBytes(healthData.metrics.memory.used)} /{' '}
                    {formatBytes(healthData.metrics.memory.total)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${healthData.metrics.memory.percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className={`${themeClasses.text} text-sm`}>Время работы</div>
                  <div className="text-lg font-semibold">
                    {formatUptime(healthData.metrics.uptime)}
                  </div>
                </div>

                <div>
                  <div className={`${themeClasses.text} text-sm`}>Node.js версия</div>
                  <div className="text-lg font-semibold">{healthData.metrics.nodeVersion}</div>
                </div>

                <div>
                  <div className={`${themeClasses.text} text-sm`}>Process ID</div>
                  <div className="text-lg font-semibold">{healthData.metrics.processId}</div>
                </div>
              </div>
            </div>

            {/* Статус сервисов */}
            <div className={`${themeClasses.card} rounded-lg border p-6`}>
              <h2 className="text-xl font-semibold mb-4">Статус сервисов</h2>
              <div className="space-y-4">
                {healthData.checks.map((check, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStatusIcon(check.status)}</span>
                        <span className="font-medium">{check.service}</span>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getStatusColor(check.status) }}
                        >
                          {check.status}
                        </span>
                      </div>
                      <div className={`${themeClasses.text} text-sm`}>
                        {formatResponseTime(check.responseTime)}
                      </div>
                    </div>

                    {check.error && (
                      <div className="text-red-500 text-sm mb-2">❌ {check.error}</div>
                    )}

                    {showDetails && check.details && (
                      <details className="mt-2">
                        <summary
                          className={`${themeClasses.text} text-sm cursor-pointer hover:text-blue-500`}
                        >
                          Подробности
                        </summary>
                        <pre
                          className={`mt-2 p-3 rounded text-xs overflow-x-auto ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                          }`}
                        >
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}

                    <div className={`${themeClasses.text} text-xs mt-2`}>
                      Проверено: {new Date(check.timestamp).toLocaleString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HealthDashboard;

// Пример использования компонента
export const HealthDashboardExample: React.FC = () => {
  return (
    <HealthDashboard
      apiEndpoint="/api/health"
      refreshInterval={30000}
      showDetails={true}
      theme="light"
    />
  );
};

// Компонент для встраивания в существующее приложение
export const HealthWidget: React.FC<{
  apiEndpoint?: string;
  compact?: boolean;
}> = ({ apiEndpoint = '/api/health', compact = false }) => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<HealthData>(apiEndpoint);
        setHealthData(response.data);
      } catch (error) {
        console.error('Ошибка загрузки данных мониторинга:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Обновление каждую минуту
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-600">Загрузка...</span>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">❓</span>
        <span className="text-sm text-gray-600">Нет данных</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getStatusIcon(healthData.status)}</span>
        <span className="text-sm font-medium">
          {healthData.summary.healthy}/{healthData.summary.total}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Статус системы</h3>
        <span
          className="px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: getStatusColor(healthData.status) }}
        >
          {healthData.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="text-green-500 font-semibold">{healthData.summary.healthy}</div>
          <div className="text-gray-600 text-xs">Здоровых</div>
        </div>
        <div>
          <div className="text-yellow-500 font-semibold">{healthData.summary.degraded}</div>
          <div className="text-gray-600 text-xs">Деградир.</div>
        </div>
        <div>
          <div className="text-red-500 font-semibold">{healthData.summary.unhealthy}</div>
          <div className="text-gray-600 text-xs">Неиспр.</div>
        </div>
      </div>
    </div>
  );
};

function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'degraded':
      return '⚠️';
    case 'unhealthy':
      return '❌';
    default:
      return '❓';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return '#059669';
    case 'degraded':
      return '#D97706';
    case 'unhealthy':
      return '#DC2626';
    default:
      return '#9CA3AF';
  }
}
