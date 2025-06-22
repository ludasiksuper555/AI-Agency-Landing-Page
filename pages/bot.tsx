import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import Layout from '../components/Layout';
import BotDashboard from '../components/TechMoneyBot/BotDashboard';
import { useAuth } from '../src/hooks/useAuth';

interface BotPageProps {
  initialData?: any;
}

const BotPage: React.FC<BotPageProps> = ({ initialData }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Перенаправлення на логін якщо користувач не авторизований
    if (!isLoading && !user) {
      router.push('/login?redirect=/bot');
    }
  }, [user, isLoading, router]);

  // Показуємо завантаження поки перевіряємо авторизацію
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Якщо користувач не авторизований, показуємо повідомлення
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Доступ заборонено
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Для доступу до панелі управління ботом необхідно увійти в систему.
            </p>
            <button
              onClick={() => router.push('/login?redirect=/bot')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Увійти в систему
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>TechMoneyBot - Панель управління | AI Agency</title>
        <meta
          name="description"
          content="Панель управління TechMoneyBot для автоматизації пошуку проектів та генерації пропозицій на фріланс платформах"
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Заголовок сторінки */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      TechMoneyBot
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Автоматизація пошуку проектів та генерації пропозицій
                    </p>
                  </div>

                  {/* Статус бота */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Офлайн</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Основний контент */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BotDashboard initialData={initialData} />
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async context => {
  // Тут можна додати серверну логіку для отримання початкових даних
  // Наприклад, перевірка авторизації через cookies

  try {
    // Можна спробувати отримати початкові дані від бота
    // const initialStats = await fetch(`${process.env.BOT_API_URL}/api/stats`);

    return {
      props: {
        initialData: null, // або дані від бота
      },
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);

    return {
      props: {
        initialData: null,
      },
    };
  }
};

export default BotPage;
