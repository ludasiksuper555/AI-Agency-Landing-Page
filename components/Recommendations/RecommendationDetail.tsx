import { useAuth } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';

import { Recommendation } from '../../types';

type RecommendationDetailProps = {
  recommendationId: string;
  canApprove?: boolean;
  onBack?: () => void;
};

/**
 * Компонент для відображення детальної інформації про рекомендацію
 */
const RecommendationDetail: React.FC<RecommendationDetailProps> = ({
  recommendationId,
  canApprove = false,
  onBack,
}) => {
  const { userId } = useAuth();

  // Simple notification function to replace useToast
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(`Success: ${message}`);
    }
  };

  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');

  // Завантаження даних рекомендації
  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recommendations/${recommendationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка при завантаженні рекомендації');
      }

      setRecommendation(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
      showNotification(err instanceof Error ? err.message : 'Невідома помилка', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Схвалення або відхилення рекомендації
  const handleApproval = async (approved: boolean) => {
    if (!userId) {
      showNotification('Необхідно авторизуватися для схвалення рекомендацій', 'error');
      return;
    }

    try {
      const response = await fetch('/api/recommendations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
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

      // Оновлюємо дані рекомендації
      fetchRecommendation();
      setComment('');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Невідома помилка', 'error');
    }
  };

  // Завантажуємо дані рекомендації при монтуванні компонента
  useEffect(() => {
    if (recommendationId) {
      fetchRecommendation();
    }
  }, [recommendationId]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
    );
  }

  if (!recommendation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">Рекомендацію не знайдено</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Деталі рекомендації</h2>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Назад до списку
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-bold">ID: {recommendation.id}</span>
          {renderStatusBadge(recommendation.status)}
        </div>

        <div>
          <p className="font-bold">Тип ресурсу:</p>
          <p>{recommendation.resourceType}</p>
        </div>

        <div>
          <p className="font-bold">ID ресурсу:</p>
          <p>{recommendation.resourceId}</p>
        </div>

        <div>
          <p className="font-bold">Рекомендація:</p>
          <p className="whitespace-pre-wrap">{recommendation.description}</p>
        </div>

        <div>
          <p className="font-bold">Створено:</p>
          <p>{new Date(recommendation.createdAt).toLocaleString()}</p>
        </div>

        <div>
          <p className="font-bold">Останнє оновлення:</p>
          <p>{new Date(recommendation.updatedAt).toLocaleString()}</p>
        </div>

        {recommendation.status !== 'pending' && (
          <>
            <hr className="border-gray-200" />

            <div>
              <p className="font-bold">
                {recommendation.status === 'completed' ? 'Схвалено:' : 'Відхилено:'}
              </p>
              <p>{'Невідомо'}</p>
            </div>
          </>
        )}

        {/* Кнопки схвалення/відхилення для рекомендацій в статусі 'pending' */}
        {canApprove && recommendation.status === 'pending' && (
          <div className="mt-4">
            <hr className="border-gray-200 mb-4" />
            <p className="font-bold mb-2">Дії:</p>

            <input
              type="text"
              placeholder="Додайте коментар (опціонально)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => handleApproval(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Схвалити
              </button>
              <button
                onClick={() => handleApproval(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Відхилити
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationDetail;
export { RecommendationDetail };
