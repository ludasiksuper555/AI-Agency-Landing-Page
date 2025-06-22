import React, { useEffect, useState } from 'react';

import { SecurityEventSeverity, SecurityEventType } from '../lib/securityEventLogger';

interface SecurityEvent {
  id: string;
  userId: string;
  eventType: SecurityEventType;
  details: string;
  severity: SecurityEventSeverity;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

interface SecurityDashboardProps {
  title?: string;
  maxEvents?: number;
  showFilters?: boolean;
}

/**
 * Компонент панели мониторинга безопасности в соответствии с ISO 27001
 * Отображает события безопасности с возможностью фильтрации и экспорта
 */
const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  title = 'Мониторинг безопасности ISO 27001',
  maxEvents = 100,
  showFilters = true,
}) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
  });

  // Загрузка событий безопасности
  useEffect(() => {
    const fetchSecurityEvents = async () => {
      try {
        setLoading(true);
        // В реальном приложении здесь будет запрос к API
        // const response = await fetch('/api/security/events');
        // const data = await response.json();

        // Для примера используем моковые данные
        const mockEvents: SecurityEvent[] = [
          {
            id: '1',
            userId: 'user123',
            eventType: SecurityEventType.LOGIN_SUCCESS,
            details: 'Успешный вход в систему',
            severity: SecurityEventSeverity.INFO,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date(),
            resourceType: 'auth',
            resourceId: 'session-1',
            metadata: { browser: 'Chrome', os: 'Windows' },
          },
          {
            id: '2',
            userId: 'user456',
            eventType: SecurityEventType.ACCESS_DENIED,
            details: 'Попытка доступа к защищенному ресурсу',
            severity: SecurityEventSeverity.WARNING,
            ipAddress: '192.168.1.2',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date(Date.now() - 3600000),
            resourceType: 'api',
            resourceId: '/api/admin',
            metadata: { method: 'GET' },
          },
          {
            id: '3',
            userId: 'user789',
            eventType: SecurityEventType.AUTHENTICATION_FAILURE,
            details: 'Неудачная попытка входа',
            severity: SecurityEventSeverity.ERROR,
            ipAddress: '192.168.1.3',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date(Date.now() - 7200000),
            resourceType: 'auth',
            resourceId: 'login',
            metadata: { attempts: 3 },
          },
        ];

        setEvents(mockEvents);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке событий безопасности');
        console.error('Error fetching security events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityEvents();
  }, []);

  // Фильтрация событий
  const filteredEvents = events
    .filter(event => {
      if (filters.eventType && event.eventType !== filters.eventType) return false;
      if (filters.severity && event.severity !== filters.severity) return false;
      if (filters.userId && !event.userId.includes(filters.userId)) return false;

      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        if (new Date(event.timestamp) < dateFrom) return false;
      }

      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        if (new Date(event.timestamp) > dateTo) return false;
      }

      return true;
    })
    .slice(0, maxEvents);

  // Обработчик изменения фильтров
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Экспорт событий в CSV
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Пользователь',
      'Тип события',
      'Детали',
      'Критичность',
      'IP-адрес',
      'Время',
    ];
    const rows = filteredEvents.map(event => [
      event.id,
      event.userId,
      event.eventType,
      event.details,
      event.severity,
      event.ipAddress || 'N/A',
      new Date(event.timestamp).toLocaleString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `security-events-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Получение класса цвета в зависимости от критичности
  const getSeverityClass = (severity: SecurityEventSeverity) => {
    switch (severity) {
      case SecurityEventSeverity.INFO:
        return 'bg-blue-100 text-blue-800';
      case SecurityEventSeverity.WARNING:
        return 'bg-yellow-100 text-yellow-800';
      case SecurityEventSeverity.ERROR:
        return 'bg-red-100 text-red-800';
      case SecurityEventSeverity.CRITICAL:
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          aria-label="Экспортировать события в CSV"
        >
          Экспорт CSV
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
              Тип события
            </label>
            <select
              id="eventType"
              name="eventType"
              value={filters.eventType}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все типы</option>
              {Object.values(SecurityEventType).map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
              Критичность
            </label>
            <select
              id="severity"
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все уровни</option>
              {Object.values(SecurityEventSeverity).map(severity => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Дата с
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Дата по
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              ID пользователя
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="Введите ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Нет событий безопасности, соответствующих фильтрам
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Время
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Пользователь
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Тип события
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Детали
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Критичность
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  IP-адрес
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.eventType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{event.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityClass(event.severity)}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.ipAddress || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
