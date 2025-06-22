import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { CreateRecommendation } from './CreateRecommendation';
import { RecommendationDetail } from './RecommendationDetail';
import RecommendationsList from './RecommendationsList';

type Priority = 'high' | 'medium' | 'low';
type Category = 'performance' | 'monitoring' | 'testing' | 'security' | 'user-experience' | 'other';

import { Recommendation as BaseRecommendation } from '../../types';

// Расширенный интерфейс для системы рекомендаций
export interface Recommendation extends Omit<BaseRecommendation, 'priority' | 'category'> {
  priority: Priority;
  category: Category;
  implementationTime: string;
  steps?: string[];
  resources?: {
    title: string;
    url: string;
  }[];
}

interface RecommendationsSystemProps {
  userId?: string;
  initialCategory?: Category;
  showCreateForm?: boolean;
}

const RecommendationsSystem: React.FC<RecommendationsSystemProps> = ({
  userId,
  initialCategory,
  showCreateForm = false,
}) => {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(showCreateForm);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>(initialCategory || 'all');
  const [activePriority, setActivePriority] = useState<Priority | 'all'>('all');

  // Функция для загрузки рекомендаций
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Формируем URL с параметрами
      let url = '/api/recommendations';
      const params = new URLSearchParams();

      if (userId) {
        params.append('userId', userId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Не удалось загрузить рекомендации');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Ошибка при загрузке рекомендаций:', err);
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация рекомендаций при изменении фильтров
  useEffect(() => {
    let filtered = [...recommendations];

    if (activeCategory !== 'all') {
      filtered = filtered.filter(rec => rec.category === activeCategory);
    }

    if (activePriority !== 'all') {
      filtered = filtered.filter(rec => rec.priority === activePriority);
    }

    setFilteredRecommendations(filtered);
  }, [recommendations, activeCategory, activePriority]);

  // Загрузка рекомендаций при монтировании компонента
  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  // Обработчик выбора рекомендации
  const handleSelectRecommendation = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setIsCreating(false);
  };

  // Обработчик создания новой рекомендации
  const handleCreateRecommendation = async (newRecommendation: Omit<Recommendation, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecommendation),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Не удалось создать рекомендацию');
      }

      const createdRecommendation = await response.json();

      // Обновляем список рекомендаций
      setRecommendations(prev => [createdRecommendation, ...prev]);
      setIsCreating(false);
      setSelectedRecommendation(createdRecommendation);

      // Показываем уведомление об успешном создании
      alert('Рекомендация успешно создана!');
    } catch (err) {
      console.error('Ошибка при создании рекомендации:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Произошла неизвестная ошибка при создании рекомендации'
      );
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления рекомендации
  const handleDeleteRecommendation = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту рекомендацию?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Не удалось удалить рекомендацию');
      }

      // Обновляем список рекомендаций
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
      setSelectedRecommendation(null);

      // Показываем уведомление об успешном удалении
      alert('Рекомендация успешно удалена!');
    } catch (err) {
      console.error('Ошибка при удалении рекомендации:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Произошла неизвестная ошибка при удалении рекомендации'
      );
    } finally {
      setLoading(false);
    }
  };

  // Обработчик обновления рекомендации
  const handleUpdateRecommendation = async (id: string, updatedData: Partial<Recommendation>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Не удалось обновить рекомендацию');
      }

      const updatedRecommendation = await response.json();

      // Обновляем список рекомендаций
      setRecommendations(prev => prev.map(rec => (rec.id === id ? updatedRecommendation : rec)));
      setSelectedRecommendation(updatedRecommendation);

      // Показываем уведомление об успешном обновлении
      alert('Рекомендация успешно обновлена!');
    } catch (err) {
      console.error('Ошибка при обновлении рекомендации:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Произошла неизвестная ошибка при обновлении рекомендации'
      );
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения категории
  const handleCategoryChange = (category: Category | 'all') => {
    setActiveCategory(category);
  };

  // Обработчик изменения приоритета
  const handlePriorityChange = (priority: Priority | 'all') => {
    setActivePriority(priority);
  };

  // Обработчик перехода к созданию новой рекомендации
  const handleStartCreating = () => {
    setIsCreating(true);
    setSelectedRecommendation(null);
  };

  // Обработчик отмены создания/редактирования
  const handleCancel = () => {
    setIsCreating(false);
    setSelectedRecommendation(null);
  };

  // Обработчик обновления данных
  const handleRefresh = () => {
    fetchRecommendations();
  };

  return (
    <div className="recommendations-system bg-white rounded-lg shadow-md p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Система рекомендаций</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            aria-label="Обновить данные"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleRefresh()}
          >
            Обновить
          </button>
          <button
            onClick={handleStartCreating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            aria-label="Создать новую рекомендацию"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleStartCreating()}
          >
            Создать рекомендацию
          </button>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <p className="font-bold">Ошибка</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-3">Фильтры</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select
                value={activeCategory}
                onChange={e => handleCategoryChange(e.target.value as Category | 'all')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все категории</option>
                <option value="performance">Производительность</option>
                <option value="monitoring">Мониторинг</option>
                <option value="testing">Тестирование</option>
                <option value="security">Безопасность</option>
                <option value="user-experience">Пользовательский опыт</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
              <select
                value={activePriority}
                onChange={e => handlePriorityChange(e.target.value as Priority | 'all')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все приоритеты</option>
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </div>

          {!loading && filteredRecommendations.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Статистика</h3>
              <p className="text-sm text-blue-600">Всего рекомендаций: {recommendations.length}</p>
              <p className="text-sm text-blue-600">
                Отфильтровано: {filteredRecommendations.length}
              </p>
              <div className="mt-2">
                <p className="text-sm text-blue-600">По приоритету:</p>
                <ul className="text-sm ml-4">
                  <li className="text-red-600">
                    Высокий: {recommendations.filter(r => r.priority === 'high').length}
                  </li>
                  <li className="text-yellow-600">
                    Средний: {recommendations.filter(r => r.priority === 'medium').length}
                  </li>
                  <li className="text-green-600">
                    Низкий: {recommendations.filter(r => r.priority === 'low').length}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : isCreating ? (
            <CreateRecommendation onSuccess={handleCancel} />
          ) : selectedRecommendation ? (
            <RecommendationDetail
              recommendationId={selectedRecommendation.id}
              onBack={handleCancel}
            />
          ) : (
            <>
              {filteredRecommendations.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <p className="text-gray-600 mb-4">Рекомендации не найдены</p>
                  <button
                    onClick={handleStartCreating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    aria-label="Создать первую рекомендацию"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleStartCreating()}
                  >
                    Создать первую рекомендацию
                  </button>
                </div>
              ) : (
                <RecommendationsList
                  onViewDetail={id => {
                    const rec = filteredRecommendations.find(r => r.id === id);
                    if (rec) handleSelectRecommendation(rec);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsSystem;
