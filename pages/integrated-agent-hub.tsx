import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Layout from '../components/Layout';
import { authenticateWithMGX, getMGXUserInfo } from '../utils/mgxUtils';

// Типы для интеграций
interface AWSDetails {
  region?: string;
  services?: string[];
}

interface IntegrationStatus {
  connected: boolean;
  message: string;
  details?: any | AWSDetails;
}

interface IntegrationsState {
  mgx: IntegrationStatus;
  github: IntegrationStatus;
  aws: IntegrationStatus;
  browser: IntegrationStatus;
}

const IntegratedAgentHub: React.FC = () => {
  const { t: _t } = useTranslation('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [integrations, setIntegrations] = useState<IntegrationsState>({
    mgx: { connected: false, message: 'Не подключено' },
    github: { connected: false, message: 'Не подключено' },
    aws: { connected: false, message: 'Не подключено' },
    browser: { connected: false, message: 'Не подключено' },
  });

  // Проверка статуса интеграций при загрузке страницы
  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  // Проверка кода авторизации MGX в URL
  useEffect(() => {
    const { code } = router.query;
    if (code && typeof code === 'string') {
      handleMGXAuthCode(code);
    }
  }, [router.query]);

  // Проверка статуса всех интеграций
  const checkIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      // Проверка MGX
      const mgxToken = localStorage.getItem('mgx_token');
      if (mgxToken) {
        const userInfo = await getMGXUserInfo(mgxToken);
        if (userInfo) {
          setIntegrations(prev => ({
            ...prev,
            mgx: {
              connected: true,
              message: 'Подключено',
              details: userInfo,
            },
          }));
        }
      }

      // Проверка GitHub (имитация)
      const githubToken = localStorage.getItem('github_token');
      if (githubToken) {
        setIntegrations(prev => ({
          ...prev,
          github: {
            connected: true,
            message: 'Подключено',
            details: { username: 'github_user' },
          },
        }));
      }

      // Проверка AWS (имитация)
      const awsConfig = localStorage.getItem('aws_config');
      if (awsConfig) {
        setIntegrations(prev => ({
          ...prev,
          aws: {
            connected: true,
            message: 'Подключено',
            details: JSON.parse(awsConfig),
          },
        }));
      }

      // Проверка оптимизации браузера
      if ('serviceWorker' in navigator) {
        setIntegrations(prev => ({
          ...prev,
          browser: {
            connected: true,
            message: 'Оптимизация активна',
            details: { pwa: true },
          },
        }));
      }
    } catch (error) {
      console.error('Error checking integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка кода авторизации MGX
  const handleMGXAuthCode = async (authCode: string) => {
    setIsLoading(true);
    try {
      const authResponse = await authenticateWithMGX(authCode);
      if (authResponse.success && authResponse.token) {
        localStorage.setItem('mgx_token', authResponse.token);

        const userInfo = await getMGXUserInfo(authResponse.token);
        if (userInfo) {
          setIntegrations(prev => ({
            ...prev,
            mgx: {
              connected: true,
              message: 'Подключено',
              details: userInfo,
            },
          }));
        }
      }
    } catch (error) {
      console.error('MGX Authentication error:', error);
    } finally {
      setIsLoading(false);
      // Удаляем код из URL для чистоты
      router.replace('/integrated-agent-hub', undefined, { shallow: true });
    }
  };

  // Инициирование авторизации MGX
  const connectMGX = () => {
    window.location.href =
      'https://mgx.dev/oauth/authorize?client_id=trae-app&redirect_uri=http://localhost:3000/integrated-agent-hub';
  };

  // Инициирование авторизации GitHub (имитация)
  const connectGitHub = () => {
    console.warn('Перенаправление на GitHub для авторизации...');
    // Имитация сохранения токена
    setTimeout(() => {
      localStorage.setItem('github_token', 'mock_github_token');
      checkIntegrationStatus();
    }, 1000);
  };

  // Настройка AWS интеграции (имитация)
  const connectAWS = () => {
    const awsConfig = {
      region: 'eu-central-1',
      services: ['Bedrock', 'SageMaker', 'EC2', 'Lex', 'Rekognition'],
    };
    localStorage.setItem('aws_config', JSON.stringify(awsConfig));
    checkIntegrationStatus();
  };

  // Активация оптимизации браузера (имитация)
  const activateBrowserOptimization = () => {
    console.warn('Активация оптимизации браузера и PWA функциональности...');
    checkIntegrationStatus();
  };

  return (
    <Layout
      seo={{
        title: 'Интегрированный агентный хаб | Trae AI',
        description:
          'Центр управления интеграциями между Trae, MGX, GitHub, AWS AGI и браузером для оптимизации агентной работы.',
        keywords: ['Trae', 'MGX', 'GitHub', 'AWS', 'AGI', 'интеграция', 'агент'],
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Интегрированный агентный хаб</h1>

        {/* Статус интеграций */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Статус интеграций</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MGX */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">MGX</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${integrations.mgx.connected ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}
                >
                  {integrations.mgx.connected ? 'Активно' : 'Неактивно'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{integrations.mgx.message}</p>
              {!integrations.mgx.connected && (
                <button
                  onClick={connectMGX}
                  className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                  disabled={isLoading}
                >
                  Подключить
                </button>
              )}
            </div>

            {/* GitHub */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">GitHub</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${integrations.github.connected ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}
                >
                  {integrations.github.connected ? 'Активно' : 'Неактивно'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {integrations.github.message}
              </p>
              {!integrations.github.connected && (
                <button
                  onClick={connectGitHub}
                  className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                  disabled={isLoading}
                >
                  Подключить
                </button>
              )}
            </div>

            {/* AWS */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">AWS AGI</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${integrations.aws.connected ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}
                >
                  {integrations.aws.connected ? 'Активно' : 'Неактивно'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{integrations.aws.message}</p>
              {!integrations.aws.connected && (
                <button
                  onClick={connectAWS}
                  className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                  disabled={isLoading}
                >
                  Настроить
                </button>
              )}
            </div>

            {/* Браузер */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Оптимизация браузера</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${integrations.browser.connected ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}
                >
                  {integrations.browser.connected ? 'Активно' : 'Неактивно'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {integrations.browser.message}
              </p>
              {!integrations.browser.connected && (
                <button
                  onClick={activateBrowserOptimization}
                  className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                  disabled={isLoading}
                >
                  Активировать
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <a
              href="/daily-work-summary"
              className="px-4 py-3 text-sm font-medium bg-yellow-50 dark:bg-yellow-900 border-b-2 border-yellow-500 dark:border-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800"
            >
              Ежедневные отчеты
            </a>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('overview')}
            >
              Обзор
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'mgx' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('mgx')}
            >
              MGX
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'github' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('github')}
            >
              GitHub
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'aws' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('aws')}
            >
              AWS AGI
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'browser' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('browser')}
            >
              Браузер
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'meat-analytics' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('meat-analytics')}
            >
              Мясная аналитика
            </button>
          </div>

          <div className="p-6">
            {/* Содержимое вкладки Обзор */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Обзор интеграций</h2>
                <p className="mb-4">
                  Этот интегрированный хаб позволяет управлять всеми подключениями между Trae, MGX,
                  GitHub, AWS AGI сервисами и оптимизацией браузера в одном месте.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Преимущества интеграции</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Единый интерфейс для управления всеми интеграциями</li>
                    <li>Автоматическая синхронизация данных между сервисами</li>
                    <li>Повышенная безопасность с соблюдением ISO 27001</li>
                    <li>Оптимизированная производительность</li>
                    <li>Расширенные возможности агентной работы</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Рекомендуемые действия</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Подключите все интеграции для максимальной функциональности</li>
                    <li>Настройте параметры безопасности в соответствии с вашими требованиями</li>
                    <li>Регулярно проверяйте статус интеграций</li>
                    <li>Используйте агентные возможности для автоматизации задач</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Содержимое вкладки MGX */}
            {activeTab === 'mgx' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Интеграция с MGX</h2>
                {integrations.mgx.connected ? (
                  <div>
                    <p className="mb-4">
                      Ваш аккаунт MGX успешно подключен. Вы можете использовать все возможности MGX
                      в Trae.
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                      <h3 className="font-medium mb-2">Информация о пользователе</h3>
                      <p>
                        <strong>Имя пользователя:</strong> {integrations.mgx.details?.username}
                      </p>
                      <p>
                        <strong>Email:</strong> {integrations.mgx.details?.email}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Доступные функции</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Анализ кода с использованием MGX</li>
                        <li>Интеграция с GitHub через MGX API</li>
                        <li>Расширенная аналитика проектов</li>
                        <li>Автоматизация рабочих процессов</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">
                      Подключите ваш аккаунт MGX для доступа к расширенным возможностям анализа кода
                      и интеграции с GitHub.
                    </p>
                    <button
                      onClick={connectMGX}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                      disabled={isLoading}
                    >
                      Подключить MGX
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Содержимое вкладки GitHub */}
            {activeTab === 'github' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Интеграция с GitHub</h2>
                {integrations.github.connected ? (
                  <div>
                    <p className="mb-4">
                      Ваш аккаунт GitHub успешно подключен. Вы можете использовать все возможности
                      GitHub в Trae.
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                      <h3 className="font-medium mb-2">Доступные функции</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Автоматическая синхронизация изменений</li>
                        <li>Интеграция с GitHub Actions для CI/CD</li>
                        <li>Управление репозиториями</li>
                        <li>Анализ кода с помощью MGX</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">
                      Подключите ваш аккаунт GitHub для доступа к возможностям управления
                      репозиториями и автоматизации CI/CD.
                    </p>
                    <button
                      onClick={connectGitHub}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                      disabled={isLoading}
                    >
                      Подключить GitHub
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Содержимое вкладки AWS */}
            {activeTab === 'aws' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Интеграция с AWS AGI</h2>
                {integrations.aws.connected ? (
                  <div>
                    <p className="mb-4">Интеграция с AWS AGI сервисами настроена успешно.</p>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                      <h3 className="font-medium mb-2">Доступные сервисы</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {integrations.aws.details?.services?.map(
                          (service: string, index: number) => <li key={index}>{service}</li>
                        ) || []}
                      </ul>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Возможности интеграции</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Использование моделей AWS Bedrock для генерации контента</li>
                        <li>Анализ данных с помощью AWS SageMaker</li>
                        <li>Автоматизация рабочих процессов с AWS Lambda</li>
                        <li>Распознавание образов с AWS Rekognition</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">
                      Настройте интеграцию с AWS AGI сервисами для доступа к расширенным
                      возможностям искусственного интеллекта.
                    </p>
                    <button
                      onClick={connectAWS}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                      disabled={isLoading}
                    >
                      Настроить интеграцию
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Содержимое вкладки Браузер */}
            {activeTab === 'browser' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Оптимизация браузера</h2>
                {integrations.browser.connected ? (
                  <div>
                    <p className="mb-4">
                      Оптимизация браузера активирована. Ваше приложение работает с максимальной
                      производительностью.
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                      <h3 className="font-medium mb-2">Активные оптимизации</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Progressive Web App (PWA) функциональность</li>
                        <li>Кэширование статических ресурсов</li>
                        <li>Предварительная загрузка критических ресурсов</li>
                        <li>Оптимизация изображений</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">
                      Активируйте оптимизацию браузера для улучшения производительности и
                      возможности работы офлайн.
                    </p>
                    <button
                      onClick={activateBrowserOptimization}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                      disabled={isLoading}
                    >
                      Активировать оптимизацию
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Содержимое вкладки Мясная аналитика */}
            {activeTab === 'meat-analytics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Аналитика мясной промышленности</h2>
                {integrations.mgx.connected ? (
                  <div>
                    <p className="mb-4">
                      Используйте мощные аналитические инструменты для анализа рынка мясной
                      продукции, прогнозирования спроса и оптимизации маркетинговых стратегий.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Анализ рынка</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Получите детальный анализ рынка мясной продукции, включая размер рынка,
                          тенденции роста, сезонные колебания и конкурентный анализ.
                        </p>
                        <button
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                          onClick={() => console.warn('Запуск анализа рынка мясной продукции...')}
                        >
                          Запустить анализ
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Маркетинговая стратегия</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Генерация оптимальной маркетинговой стратегии для мясной продукции с
                          учетом целевой аудитории, каналов продвижения и бюджета.
                        </p>
                        <button
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                          onClick={() => console.warn('Генерация маркетинговой стратегии...')}
                        >
                          Создать стратегию
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Прогноз спроса</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Прогнозирование спроса на мясную продукцию с учетом сезонности,
                          праздников, маркетинговых кампаний и экономической ситуации.
                        </p>
                        <button
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                          onClick={() => console.warn('Расчет прогноза спроса...')}
                        >
                          Рассчитать прогноз
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Анализ отзывов</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Анализ отзывов потребителей о мясной продукции с использованием NLP для
                          выявления сильных и слабых сторон, а также рекомендаций по улучшению.
                        </p>
                        <button
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                          onClick={() => console.warn('Анализ отзывов потребителей...')}
                        >
                          Анализировать отзывы
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">
                        Преимущества аналитики мясной промышленности
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          Точное прогнозирование спроса для оптимизации производства и складских
                          запасов
                        </li>
                        <li>Выявление сезонных трендов для планирования маркетинговых кампаний</li>
                        <li>Анализ конкурентов для определения рыночных возможностей</li>
                        <li>Оптимизация ценообразования на основе эластичности спроса</li>
                        <li>Улучшение продукции на основе анализа отзывов потребителей</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">
                      Для доступа к аналитическим инструментам мясной промышленности необходимо
                      подключить аккаунт MGX.
                    </p>
                    <button
                      onClick={connectMGX}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                      disabled={isLoading}
                    >
                      Подключить MGX
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Получение переводов на стороне сервера
export async function getStaticProps({ locale }: { locale?: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'uk', ['common'])),
    },
  };
}

export default IntegratedAgentHub;
