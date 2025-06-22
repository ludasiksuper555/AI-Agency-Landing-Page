import { useAuth } from '@clerk/nextjs';
import React, { useState } from 'react';

type CreateRecommendationProps = {
  resourceType?: string;
  resourceId?: string;
  onSuccess?: () => void;
};

/**
 * Компонент для створення нової рекомендації
 */
const CreateRecommendation: React.FC<CreateRecommendationProps> = ({
  resourceType: initialResourceType,
  resourceId: initialResourceId,
  onSuccess,
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

  const [resourceType, setResourceType] = useState<string>(initialResourceType || '');
  const [resourceId, setResourceId] = useState<string>(initialResourceId || '');
  const [recommendation, setRecommendation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Обробник відправки форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      showNotification('Необхідно авторизуватися для створення рекомендацій', 'error');
      return;
    }

    if (!resourceType || !resourceId || !recommendation) {
      setError("Всі поля є обов'язковими");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resourceType,
          resourceId,
          recommendation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка при створенні рекомендації');
      }

      showNotification('Ваша рекомендація успішно додана і очікує розгляду', 'success');

      // Очищаємо форму
      setRecommendation('');

      // Викликаємо функцію зворотного виклику при успішному створенні
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
      showNotification(err instanceof Error ? err.message : 'Невідома помилка', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Список типів ресурсів (можна розширити або отримувати з API)
  const resourceTypes = [
    { value: 'document', label: 'Документ' },
    { value: 'project', label: 'Проект' },
    { value: 'process', label: 'Процес' },
    { value: 'policy', label: 'Політика' },
    { value: 'other', label: 'Інше' },
  ];

  return (
    <div className="p-4 border border-gray-200 rounded-md shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Створити рекомендацію</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип ресурсу *</label>
            {initialResourceType ? (
              <input
                type="text"
                value={resourceType}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            ) : (
              <select
                value={resourceType}
                onChange={e => setResourceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Виберіть тип ресурсу</option>
                {resourceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID ресурсу *</label>
            {initialResourceId ? (
              <input
                type="text"
                value={resourceId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            ) : (
              <input
                type="text"
                placeholder="Введіть ідентифікатор ресурсу"
                value={resourceId}
                onChange={e => setResourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Рекомендація *</label>
            <textarea
              placeholder="Опишіть вашу рекомендацію..."
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Відправлення...' : 'Створити рекомендацію'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecommendation;
export { CreateRecommendation };
