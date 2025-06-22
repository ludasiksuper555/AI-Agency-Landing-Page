import { useAuth } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';

import { Recommendation } from '../../types';

type RecommendationsListProps = {
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  status?: string;
  canApprove?: boolean;
  onViewDetail?: (recommendationId: string) => void;
};

/**
 * Компонент для відображення списку рекомендацій з можливістю фільтрації та схвалення/відхилення
 */
const RecommendationsList: React.FC<RecommendationsListProps> = ({
  resourceType,
  resourceId,
  userId,
  status: initialStatus,
  canApprove = false,
  onViewDetail,
}) => {
  const { userId: currentUserId } = useAuth();

  // Simple notification function to replace useToast
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(`Success: ${message}`);
    }
  };

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [comment, setComment] = useState<string>('');

  // Завантаження списку рекомендацій
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // Формуємо URL з параметрами фільтрації
      let url = '/api/recommendations/list?';

      if (resourceType) {
        url += `resourceType=${encodeURIComponent(resourceType)}&`;
      }

      if (resourceId) {
        url += `resourceId=${encodeURIComponent(resourceId)}&`;
      }

      if (statusFilter !== 'all') {
        url += `status=${encodeURIComponent(statusFilter)}&`;
      }

      if (userId) {
        url += `userId=${encodeURIComponent(userId)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка при завантаженні рекомендацій');
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
      showNotification(err instanceof Error ? err.message : 'Невідома помилка', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Схвалення або відхилення рекомендації
  const handleApproval = async (recommendationId: string, approved: boolean) => {
    if (!currentUserId) {
      alert('Помилка: Необхідно авторизуватися для схвалення рекомендацій');
      return;
    }

    try {
      const response = await fetch('/api/recommendations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          recommendationId,
          approved,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка при схваленні рекомендації');
      }

      showNotification(`Рекомендація була ${approved ? 'схвалена' : 'відхилена'}`, 'success');

      // Оновлюємо список рекомендацій
      fetchRecommendations();
      setComment('');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Невідома помилка', 'error');
    }
  };

  // Обробник перегляду деталей рекомендації
  const handleViewDetail = (recommendationId: string) => {
    if (onViewDetail) {
      onViewDetail(recommendationId);
    }
  };

  // Завантажуємо рекомендації при монтуванні компонента та при зміні фільтрів
  useEffect(() => {
    fetchRecommendations();
  }, [resourceType, resourceId, userId, statusFilter]);

  // Функція для відображення статусу рекомендації
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Схвалено
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Відхилено
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Очікує розгляду
          </span>
        );
    }
  };

  return (
    <div className="p-4">
      {!resourceType && !resourceId && <h2 className="text-lg font-semibold mb-4">Рекомендації</h2>}

      {/* Фільтр за статусом */}
      <div className="flex mb-4 space-x-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Всі статуси</option>
          <option value="pending">Очікують розгляду</option>
          <option value="approved">Схвалені</option>
          <option value="rejected">Відхилені</option>
        </select>

        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Оновити
        </button>
      </div>

      {/* Відображення помилки */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Індикатор завантаження */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : recommendations.length === 0 ? (
        <p className="text-gray-500">Рекомендацій не знайдено</p>
      ) : (
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div
              key={rec.id}
              className={`p-4 border border-gray-200 rounded-md shadow-sm ${
                onViewDetail ? 'cursor-pointer hover:border-blue-500' : 'cursor-default'
              }`}
              onClick={onViewDetail ? () => handleViewDetail(rec.id) : undefined}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">
                  {rec.resourceType}: {rec.resourceId}
                </span>
                {renderStatusBadge(rec.status)}
              </div>

              <p className="mb-2">{rec.description}</p>

              <p className="text-sm text-gray-500">
                Створено: {new Date(rec.createdAt).toLocaleString()}
              </p>

              {/* Кнопки схвалення/відхилення для рекомендацій в статусі 'pending' */}
              {canApprove && rec.status === 'pending' && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    placeholder="Додайте коментар (опціонально)"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproval(rec.id, true)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Схвалити
                    </button>
                    <button
                      onClick={() => handleApproval(rec.id, false)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Відхилити
                    </button>
                  </div>
                </div>
              )}

              {onViewDetail && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleViewDetail(rec.id);
                    }}
                    className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Деталі
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsList;
