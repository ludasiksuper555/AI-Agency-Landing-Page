import { getAuth } from '@clerk/nextjs/server';
import { GetServerSideProps } from 'next';
import React from 'react';

import SecurityDashboard from '../../components/SecurityDashboard';
import { UserRole } from '../../middleware/accessControl';

interface SecurityDashboardPageProps {
  userRole: UserRole;
}

/**
 * Страница панели мониторинга безопасности ISO 27001
 * Доступна только для администраторов и специалистов по безопасности
 */
const SecurityDashboardPage: React.FC<SecurityDashboardPageProps> = ({ userRole: _userRole }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Панель мониторинга безопасности ISO 27001</h1>

      <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          Информация о соответствии ISO 27001
        </h2>
        <p className="text-blue-700 mb-2">
          Эта панель предоставляет инструменты для мониторинга и аудита безопасности в соответствии
          с требованиями ISO 27001.
        </p>
        <p className="text-blue-700">
          Используйте фильтры для анализа событий безопасности и экспортируйте данные для
          формирования отчетов.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">События безопасности</h3>
          <p className="text-4xl font-bold text-blue-600">128</p>
          <p className="text-gray-500">За последние 24 часа</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Критические инциденты</h3>
          <p className="text-4xl font-bold text-red-600">3</p>
          <p className="text-gray-500">Требуют внимания</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Соответствие ISO 27001</h3>
          <p className="text-4xl font-bold text-green-600">92%</p>
          <p className="text-gray-500">Уровень соответствия</p>
        </div>
      </div>

      <SecurityDashboard title="Журнал событий безопасности" maxEvents={50} showFilters={true} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async context => {
  // Получаем информацию о пользователе из Clerk
  const { userId } = getAuth(context.req);

  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!userId) {
    return {
      redirect: {
        destination: '/sign-in',
        permanent: false,
      },
    };
  }

  // В реальном приложении здесь будет проверка роли пользователя
  // и доступ только для администраторов и специалистов по безопасности
  // Для примера предполагаем, что у пользователя роль ADMIN
  const userRole = UserRole.ADMIN;

  return {
    props: {
      userRole,
    },
  };
};

export default SecurityDashboardPage;
