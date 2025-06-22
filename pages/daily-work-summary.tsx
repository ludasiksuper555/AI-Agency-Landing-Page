import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Layout from '../components/Layout';

// Типы для ежедневных отчетов
interface WorkSummary {
  date: string;
  technicalSummary: string;
  businessValueSummary: string;
  keyAchievements: string[];
  codeDocumentation: string;
  compressedVersion: string;
}

interface WorkSummaryFormData {
  technicalSummary: string;
  keyAchievements: string;
  codeDocumentation: string;
}

const DailyWorkSummary: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [summaries, setSummaries] = useState<WorkSummary[]>([]);
  const [formData, setFormData] = useState<WorkSummaryFormData>({
    technicalSummary: '',
    keyAchievements: '',
    codeDocumentation: '',
  });
  const [activeTab, setActiveTab] = useState('create');
  const [businessValue, setBusinessValue] = useState('');
  const [compressedSummary, setCompressedSummary] = useState('');

  // Загрузка сохраненных отчетов при монтировании компонента
  useEffect(() => {
    const savedSummaries = localStorage.getItem('work_summaries');
    if (savedSummaries) {
      setSummaries(JSON.parse(savedSummaries));
    }
  }, []);

  // Обработчик изменения полей формы
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Генерация бизнес-ценности из технической информации
  const generateBusinessValue = () => {
    setIsLoading(true);

    // Имитация обработки с помощью AI
    setTimeout(() => {
      const technicalText = formData.technicalSummary;

      // Простая логика преобразования (в реальном приложении здесь был бы вызов AI API)
      let businessText = '';

      if (technicalText.includes('оптимизация')) {
        businessText +=
          '✓ Повышение производительности системы на 15%, что приведет к сокращению времени отклика и улучшению пользовательского опыта.\n';
      }

      if (technicalText.includes('баг') || technicalText.includes('ошибка')) {
        businessText +=
          '✓ Устранение критических ошибок, что снижает риск простоя системы и потенциальные потери на 20%.\n';
      }

      if (technicalText.includes('интерфейс') || technicalText.includes('UI')) {
        businessText +=
          '✓ Улучшение пользовательского интерфейса, что повышает удовлетворенность клиентов и может увеличить конверсию на 5-10%.\n';
      }

      if (technicalText.includes('API') || technicalText.includes('интеграция')) {
        businessText +=
          '✓ Расширение возможностей интеграции, что открывает новые каналы взаимодействия с партнерами и клиентами.\n';
      }

      if (technicalText.includes('тест')) {
        businessText +=
          '✓ Повышение надежности системы через улучшенное тестирование, что снижает риски отказов в производственной среде.\n';
      }

      if (businessText === '') {
        businessText =
          '✓ Техническое улучшение, которое способствует долгосрочной стабильности и масштабируемости системы.\n';
      }

      setBusinessValue(businessText);
      setIsLoading(false);
    }, 1500);
  };

  // Сжатие текста с сохранением ключевой информации
  const compressText = () => {
    setIsLoading(true);

    // Имитация обработки с помощью AI
    setTimeout(() => {
      const technicalText = formData.technicalSummary;
      const achievements = formData.keyAchievements;

      // Простая логика сжатия (в реальном приложении здесь был бы вызов AI API)
      const sentences = technicalText.split('.');
      const keyPoints = achievements.split('\n').filter(line => line.trim() !== '');

      let compressed = '';

      // Берем только первое и последнее предложение из технического описания
      if (sentences.length > 0) {
        if (sentences.length > 1) {
          compressed +=
            sentences[0].trim() + '. ... ' + sentences[sentences.length - 1].trim() + '.\n\n';
        } else {
          compressed += sentences[0].trim() + '.\n\n';
        }
      }

      // Добавляем только первые 3 ключевых достижения или меньше
      if (keyPoints.length > 0) {
        compressed += 'Ключевые результаты:\n';
        for (let i = 0; i < Math.min(keyPoints.length, 3); i++) {
          compressed += '- ' + keyPoints[i].trim() + '\n';
        }
      }

      setCompressedSummary(compressed);
      setIsLoading(false);
    }, 1500);
  };

  // Сохранение отчета
  const saveWorkSummary = () => {
    if (!formData.technicalSummary.trim()) {
      console.warn('Пожалуйста, заполните техническое описание работы');
      return;
    }

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    const newSummary: WorkSummary = {
      date: formattedDate,
      technicalSummary: formData.technicalSummary,
      businessValueSummary: businessValue || 'Не сгенерировано',
      keyAchievements: formData.keyAchievements.split('\n').filter(line => line.trim() !== ''),
      codeDocumentation: formData.codeDocumentation,
      compressedVersion: compressedSummary || 'Не сгенерировано',
    };

    const updatedSummaries = [newSummary, ...summaries];
    setSummaries(updatedSummaries);

    // Сохранение в localStorage
    localStorage.setItem('work_summaries', JSON.stringify(updatedSummaries));

    // Сброс формы
    setFormData({
      technicalSummary: '',
      keyAchievements: '',
      codeDocumentation: '',
    });
    setBusinessValue('');
    setCompressedSummary('');

    // Переключение на вкладку истории
    setActiveTab('history');
  };

  return (
    <Layout
      seo={{
        title: 'Ежедневные отчеты о работе | Trae AI',
        description:
          'Создание и управление ежедневными отчетами о проделанной работе с автоматической генерацией бизнес-ценности и сжатием информации.',
        keywords: ['отчеты', 'резюме работы', 'документация', 'бизнес-ценность', 'Trae AI'],
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Ежедневные отчеты о работе</h1>

        {/* Вкладки */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'create' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('create')}
            >
              Создать отчет
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'history' ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab('history')}
            >
              История отчетов
            </button>
          </div>
        </div>

        {/* Форма создания отчета */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" htmlFor="technicalSummary">
                Техническое описание работы
              </label>
              <textarea
                id="technicalSummary"
                name="technicalSummary"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Опишите техническую сторону вашей работы (что было сделано, какие технологии использовались, какие проблемы решены)"
                value={formData.technicalSummary}
                onChange={handleInputChange}
              />
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={generateBusinessValue}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
                  disabled={isLoading || !formData.technicalSummary.trim()}
                >
                  {isLoading ? 'Генерация...' : 'Перевести на язык бизнес-ценности'}
                </button>
                <button
                  onClick={compressText}
                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded"
                  disabled={isLoading || !formData.technicalSummary.trim()}
                >
                  {isLoading ? 'Обработка...' : 'Сжать текст'}
                </button>
              </div>
            </div>

            {businessValue && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Бизнес-ценность:</h3>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{businessValue}</pre>
                </div>
              </div>
            )}

            {compressedSummary && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Сжатая версия:</h3>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{compressedSummary}</pre>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" htmlFor="keyAchievements">
                Ключевые достижения
              </label>
              <textarea
                id="keyAchievements"
                name="keyAchievements"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Перечислите ключевые достижения (по одному на строку)"
                value={formData.keyAchievements}
                onChange={handleInputChange}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" htmlFor="codeDocumentation">
                Документация к коду
              </label>
              <textarea
                id="codeDocumentation"
                name="codeDocumentation"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Добавьте документацию к написанному коду (описание функций, классов, API и т.д.)"
                value={formData.codeDocumentation}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveWorkSummary}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                disabled={isLoading || !formData.technicalSummary.trim()}
              >
                Сохранить отчет
              </button>
            </div>
          </div>
        )}

        {/* История отчетов */}
        {activeTab === 'history' && (
          <div>
            {summaries.length > 0 ? (
              <div className="space-y-6">
                {summaries.map((summary, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Отчет от {summary.date}</h2>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full text-xs">
                        {summary.date === new Date().toISOString().split('T')[0]
                          ? 'Сегодня'
                          : summary.date}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Техническое описание:</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm">{summary.technicalSummary}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Бизнес-ценность:</h3>
                      <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {summary.businessValueSummary}
                        </pre>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Сжатая версия:</h3>
                      <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {summary.compressedVersion}
                        </pre>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Ключевые достижения:</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <ul className="list-disc pl-5 space-y-1">
                          {summary.keyAchievements.map((achievement, i) => (
                            <li key={i} className="text-sm">
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {summary.codeDocumentation && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Документация к коду:</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {summary.codeDocumentation}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  У вас пока нет сохраненных отчетов
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                  Создать первый отчет
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'uk', ['common'])),
    },
  };
};

export default DailyWorkSummary;
