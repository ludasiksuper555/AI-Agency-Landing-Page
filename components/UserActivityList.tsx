import React, { useEffect, useState } from 'react';

import { fetchUserActivityHistory } from '../lib/userActivityTracker';

type ActivityData = {
  userId: string;
  username?: string;
  actionType: string;
  actionDetails: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

type UserActivityListProps = {
  userId?: string;
  limit?: number;
  showFilters?: boolean;
  onlyTypes?: string[];
  className?: string;
  showPagination?: boolean;
  onActivityClick?: (activity: ActivityData) => void;
};

const UserActivityList: React.FC<UserActivityListProps> = ({
  userId,
  limit = 5,
  showFilters = false,
  onlyTypes,
  className = '',
  showPagination = false,
  onActivityClick,
}) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit, offset: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    actionType: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });

  const actionTypes = [
    'view',
    'edit',
    'question',
    'login',
    'logout',
    'api_call',
    'change',
    'other',
  ];
  const filteredActionTypes = onlyTypes
    ? actionTypes.filter(type => onlyTypes.includes(type))
    : actionTypes;

  const loadActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchUserActivityHistory(userId, limit, pagination.offset);

      // Convert timestamp strings to Date objects
      const activitiesWithDates = (result || []).map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
      }));

      setActivities(activitiesWithDates);
      setPagination({ total: result.length, limit, offset: 0 });
    } catch (err) {
      setError('Помилка при завантаженні даних активності');
      console.error('Помилка при завантаженні історії активності:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [userId, pagination.offset, pagination.limit]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadActivities();
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'view':
        return 'bg-blue-100 text-blue-800';
      case 'edit':
        return 'bg-yellow-100 text-yellow-800';
      case 'question':
        return 'bg-purple-100 text-purple-800';
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-red-100 text-red-800';
      case 'change':
        return 'bg-indigo-100 text-indigo-800';
      case 'api_call':
        return 'bg-orange-100 text-orange-800';
      case 'download':
        return 'bg-teal-100 text-teal-800';
      case 'upload':
        return 'bg-emerald-100 text-emerald-800';
      case 'share':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {showFilters && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-3">Фільтри</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
                Тип дії
              </label>
              <select
                id="actionType"
                name="actionType"
                value={filters.actionType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Всі типи</option>
                {filteredActionTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="resourceType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Тип ресурсу
              </label>
              <input
                type="text"
                id="resourceType"
                name="resourceType"
                value={filters.resourceType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введіть тип ресурсу"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Дата початку
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Дата кінця
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Завантаження...' : 'Застосувати фільтри'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Користувач
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Тип дії
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Деталі
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Ресурс
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Час
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${onActivityClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onActivityClick && onActivityClick(activity)}
                  tabIndex={onActivityClick ? 0 : undefined}
                  onKeyDown={e => {
                    if (onActivityClick && (e.key === 'Enter' || e.key === ' ')) {
                      onActivityClick(activity);
                    }
                  }}
                  aria-label={
                    onActivityClick
                      ? `Активність користувача: ${activity.actionDetails}`
                      : undefined
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.username || 'Невідомо'}
                    </div>
                    <div className="text-sm text-gray-500">{activity.userId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionTypeColor(activity.actionType)}`}
                    >
                      {activity.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{activity.actionDetails}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.resourceType && (
                      <div className="text-sm text-gray-900">{activity.resourceType}</div>
                    )}
                    {activity.resourceId && (
                      <div className="text-sm text-gray-500">{activity.resourceId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(activity.timestamp)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  {loading ? 'Завантаження даних...' : 'Немає даних для відображення'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && pagination.total > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Попередня
            </button>
            <button
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Наступна
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Показано <span className="font-medium">{pagination.offset + 1}</span> по{' '}
                <span className="font-medium">
                  {Math.min(pagination.offset + pagination.limit, pagination.total)}
                </span>{' '}
                з <span className="font-medium">{pagination.total}</span> результатів
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    handlePageChange(Math.max(0, pagination.offset - pagination.limit))
                  }
                  disabled={pagination.offset === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Попередня</span>
                  &larr;
                </button>

                <button
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Наступна</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityList;
