import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import ExportOpportunitiesMap from '../components/ExportOpportunitiesMap';
import Layout from '../components/Layout';
import MeatPriceMonitor from '../components/MeatPriceMonitor';
import SchemaOrgMeat from '../components/SchemaOrgMeat';

interface MeatIndustryDashboardProps {
  userId?: string;
}

const MeatIndustryDashboard: React.FC<MeatIndustryDashboardProps> = ({ userId }) => {
  const { t } = useTranslation('common');

  // Дані для структурованої розмітки Schema.org
  const organizationSchema = {
    type: 'Organization' as const,
    name: "М'ясний Консалтинг",
    description:
      "Провідна консалтингова компанія, що спеціалізується на просуванні м'ясних та ковбасних виробів в Україні та за кордоном",
    url: '/meat-industry-dashboard',
    address: {
      streetAddress: 'вул. Хрещатик, 10',
      addressLocality: 'Київ',
      addressRegion: 'Київська область',
      postalCode: '01001',
      addressCountry: 'Україна',
    },
  };

  // Дані для структурованої розмітки Schema.org для продукту
  const productSchema = {
    type: 'Product' as const,
    name: "Аналітика м'ясного ринку",
    description:
      "Комплексний аналіз ринку м'ясної продукції з використанням передових технологій та експертних знань",
    image: '/images/meat-analytics.jpg',
    offers: {
      price: 5000,
      priceCurrency: 'UAH',
      availability: 'InStock' as const,
    },
    meatIndustryInfo: {
      certifications: ['ISO 9001', 'HACCP', 'GlobalG.A.P.'],
    },
  };

  return (
    <Layout
      seo={{
        title: "Аналітика м'ясної індустрії | М'ясний Консалтинг",
        description:
          "Інтерактивна панель моніторингу цін, експортних можливостей та аналітики для м'ясної індустрії",
        keywords: [
          "м'ясна індустрія",
          "аналітика м'ясного ринку",
          "експорт м'ясної продукції",
          "моніторинг цін на м'ясо",
        ],
      }}
    >
      {/* Структурована розмітка Schema.org для організації та продукту */}
      <SchemaOrgMeat {...organizationSchema} />
      <SchemaOrgMeat {...productSchema} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Аналітична панель м'ясної індустрії
        </h1>

        <div className="grid grid-cols-1 gap-8 mb-10">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Огляд ринку</h2>
            <p className="text-gray-600 mb-6">
              Ласкаво просимо до аналітичної панелі м'ясної індустрії. Тут ви знайдете актуальну
              інформацію про ціни, експортні можливості та тренди ринку м'ясної продукції.
              Використовуйте ці дані для прийняття обґрунтованих бізнес-рішень та розробки
              ефективних стратегій розвитку.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="font-semibold text-red-800 mb-2">Моніторинг цін</h3>
                <p className="text-sm text-gray-600">
                  Відстежуйте зміни цін на м'ясну продукцію в реальному часі
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">Експортні можливості</h3>
                <p className="text-sm text-gray-600">
                  Досліджуйте потенційні ринки збуту для вашої продукції
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="font-semibold text-green-800 mb-2">Аналітика трендів</h3>
                <p className="text-sm text-gray-600">
                  Аналізуйте сезонні тренди та прогнозуйте попит
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Компонент моніторингу цін */}
        <div className="mb-10">
          <MeatPriceMonitor userId={userId} showNotifications={true} />
        </div>

        {/* Компонент карти експортних можливостей */}
        <div className="mb-10">
          <ExportOpportunitiesMap showFilters={true} />
        </div>

        {/* Секція з рекомендаціями */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Рекомендації для вашого бізнесу</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Оптимізація виробництва</h3>
              <p className="text-gray-600">
                Зосередьтеся на виробництві ковбасних виробів перед зимовими святами, коли попит
                зростає на 15-20%.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Експортні стратегії</h3>
              <p className="text-gray-600">
                Розгляньте можливість виходу на ринок Польщі та ОАЕ, де спостерігається найвищий
                темп зростання попиту.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Маркетингові кампанії</h3>
              <p className="text-gray-600">
                Розробіть спеціальну маркетингову кампанію для літнього сезону, щоб компенсувати
                традиційний спад продажів.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Розвиток продукту</h3>
              <p className="text-gray-600">
                Інвестуйте в розробку органічних м'ясних продуктів, попит на які зростає на 8-10%
                щороку.
              </p>
            </div>
          </div>
        </div>

        {/* Заклик до дії */}
        <div className="bg-red-600 text-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Потрібна детальна консультація?</h2>
          <p className="mb-6">
            Наші експерти допоможуть вам розробити індивідуальну стратегію розвитку для вашого
            м'ясного бізнесу
          </p>
          <button className="bg-white text-red-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors">
            Замовити консультацію
          </button>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  // В реальному додатку тут можна отримати userId з сесії або cookies
  const userId = 'user123';

  return {
    props: {
      ...(await serverSideTranslations(locale || 'uk', ['common'])),
      userId,
    },
  };
};

export default MeatIndustryDashboard;
