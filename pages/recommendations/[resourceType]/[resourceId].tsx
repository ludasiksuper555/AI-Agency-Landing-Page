import { useAuth } from '@clerk/nextjs';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
  CreateRecommendation,
  RecommendationDetail,
  RecommendationsList,
} from '../../../components/Recommendations';

/**
 * Сторінка для перегляду та створення рекомендацій для конкретного ресурсу
 */
const ResourceRecommendationsPage: NextPage = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { resourceType, resourceId } = router.query;

  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [resourceExists, setResourceExists] = useState<boolean>(true);

  // Перевірка існування ресурсу (в реальному додатку це може бути API-запит)
  useEffect(() => {
    if (resourceType && resourceId) {
      // Тут може бути запит до API для перевірки існування ресурсу
      // Наприклад: fetchResourceDetails(resourceType, resourceId)

      // Для прикладу, просто встановлюємо, що ресурс існує
      setResourceExists(true);
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  // Обробник успішного створення рекомендації
  const handleCreateSuccess = () => {
    setIsModalOpen(false); // Закриваємо модальне вікно
  };

  // Обробники для модального вікна
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Обробник вибору рекомендації для перегляду деталей
  const handleViewDetail = (recommendationId: string) => {
    setSelectedRecommendationId(recommendationId);
    setShowDetail(true);
  };

  // Повернення до списку рекомендацій
  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedRecommendationId(null);
  };

  // Повернення на попередню сторінку
  const handleGoBack = () => {
    router.back();
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-10 px-6">
          <h2 className="text-3xl font-bold mt-6 mb-2">Необхідно авторизуватися</h2>
          <p className="text-gray-500">Для доступу до рекомендацій необхідно увійти в систему.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!resourceExists) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <button
          onClick={handleGoBack}
          className="mb-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Назад
        </button>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-800">Ресурс не знайдено. Перевірте правильність URL.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <button
        onClick={handleGoBack}
        className="mb-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Назад
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Рекомендації для ресурсу</h1>
          <p className="mt-2 text-lg">
            Тип: <strong>{resourceType}</strong>, ID: <strong>{resourceId}</strong>
          </p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={handleOpenModal}
        >
          Додати рекомендацію
        </button>
      </div>

      <hr className="mb-6 border-gray-200" />

      {showDetail && selectedRecommendationId ? (
        <RecommendationDetail
          recommendationId={selectedRecommendationId}
          onBack={handleBackToList}
        />
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Список рекомендацій</h2>
          <RecommendationsList
            resourceType={resourceType as string}
            resourceId={resourceId as string}
            onViewDetail={handleViewDetail}
          />
        </div>
      )}

      {/* Модальне вікно для створення рекомендації */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Додати рекомендацію для ресурсу</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CreateRecommendation
                resourceType={resourceType as string}
                resourceId={resourceId as string}
                onSuccess={handleCreateSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceRecommendationsPage;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'uk', ['common'])),
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};
