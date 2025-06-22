import { GetServerSideProps } from 'next';
import Head from 'next/head';
import React from 'react';

import UserActivityDashboard from '../../components/UserActivityDashboard';
// import { withApiMiddleware } from '../../middleware/api';

type AdminPageProps = {
  isAuthorized: boolean;
};

const UserActivityPage: React.FC<AdminPageProps> = ({ isAuthorized }) => {
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ заборонено</h1>
          <p className="text-gray-600 mb-4">
            У вас немає прав для перегляду цієї сторінки. Будь ласка, зверніться до адміністратора
            системи.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Повернутися на головну
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Панель активності користувачів | Адмін-панель</title>
        <meta name="description" content="Панель для відстеження активності користувачів" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Адміністративна панель</h1>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <UserActivityDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async _context => {
  // Тут має бути перевірка прав доступу користувача
  // Наприклад, перевірка ролі користувача через сесію або токен

  // Для прикладу, просто повертаємо isAuthorized: true
  // В реальному додатку тут має бути справжня перевірка прав
  return {
    props: {
      isAuthorized: true,
    },
  };
};

export default UserActivityPage;
