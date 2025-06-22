import React, { useCallback, useEffect, useState } from 'react';

import {
  UserActivityRecord,
  UserChangeRecord,
  UserQuestionRecord,
} from '../lib/userActivityDatabase';

type UserActivityStatsProps = {
  activityData?: UserActivityRecord[];
  changesData?: UserChangeRecord[];
  questionsData?: UserQuestionRecord[];
  className?: string;
  period?: 'day' | 'week' | 'month' | 'year';
  showCharts?: boolean;
};

type ActivityByType = {
  [key: string]: number;
};

type ActivityByDate = {
  date: string;
  count: number;
  type?: string;
};

const UserActivityStats: React.FC<UserActivityStatsProps> = ({
  activityData = [],
  changesData = [],
  questionsData = [],
  className = '',
  period = 'week',
  showCharts = true,
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'changes' | 'questions'>('activity');
  const [activityByType, setActivityByType] = useState<ActivityByType>({});
  const [activityByDate, setActivityByDate] = useState<ActivityByDate[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Обчислення статистики при зміні даних або періоду
  useEffect(() => {
    calculateStats();
  }, [activityData, changesData, questionsData, activeTab, period]);

  const calculateStats = useCallback(() => {
    setLoading(true);

    try {
      // Розрахунок статистики за типом
      const byType: ActivityByType = {};

      // Обробка даних в залежності від активної вкладки
      switch (activeTab) {
        case 'activity':
          activityData.forEach(item => {
            const type = item.actionType || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
          });
          break;
        case 'changes':
          changesData.forEach(item => {
            const type = item.changeType || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
          });
          break;
        case 'questions':
          questionsData.forEach(item => {
            const type = item.questionId || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
          });
          break;
      }
      setActivityByType(byType);

      // Розрахунок статистики за датою
      const byDate: ActivityByDate[] = [];
      const dateMap = new Map<string, number>();

      const processDateForItem = (timestamp: Date) => {
        const date = new Date(timestamp);
        let dateKey = '';

        // Форматування дати в залежності від обраного періоду
        switch (period) {
          case 'day':
            dateKey = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            dateKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            dateKey = `${date.getFullYear()}`;
            break;
        }

        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      };

      // Обробка дат в залежності від активної вкладки
      switch (activeTab) {
        case 'activity':
          activityData.forEach(item => processDateForItem(item.timestamp));
          break;
        case 'changes':
          changesData.forEach(item => processDateForItem(item.timestamp));
          break;
        case 'questions':
          questionsData.forEach(item => processDateForItem(item.timestamp));
          break;
      }

      // Перетворення Map у масив для відображення
      dateMap.forEach((count, date) => {
        byDate.push({ date, count });
      });

      // Сортування за датою
      byDate.sort((a, b) => a.date.localeCompare(b.date));

      setActivityByDate(byDate);
    } catch (error) {
      console.error('Помилка при обчисленні статистики:', error);
    } finally {
      setLoading(false);
    }
  }, [activityData, changesData, questionsData, activeTab, period]);

  const handleTabChange = (tab: 'activity' | 'changes' | 'questions') => {
    setActiveTab(tab);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as 'day' | 'week' | 'month' | 'year';
    // Період змінюється через пропс, тому тут ми можемо тільки викликати callback, якщо він є
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      view: 'bg-blue-100 text-blue-800',
      edit: 'bg-yellow-100 text-yellow-800',
      question: 'bg-purple-100 text-purple-800',
      login: 'bg-green-100 text-green-800',
      logout: 'bg-red-100 text-red-800',
      change: 'bg-indigo-100 text-indigo-800',
      api_call: 'bg-orange-100 text-orange-800',
      download: 'bg-teal-100 text-teal-800',
      upload: 'bg-emerald-100 text-emerald-800',
      share: 'bg-pink-100 text-pink-800',
    };

    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    // Форматування дати в залежності від періоду
    switch (period) {
      case 'day':
        return new Date(dateString).toLocaleDateString('uk-UA');
      case 'week':
        const date = new Date(dateString);
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 6);
        return `${date.toLocaleDateString('uk-UA')} - ${endDate.toLocaleDateString('uk-UA')}`;
      case 'month':
        const [year, month] = dateString.split('-');
        return `${month}.${year}`;
      case 'year':
        return dateString;
      default:
        return dateString;
    }
  };

  // Функція для створення простого графіка на основі даних
  const renderChart = () => {
    if (!showCharts || activityByDate.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">Немає даних для відображення графіка</div>
      );
    }

    const maxCount = Math.max(...activityByDate.map(item => item.count));

    return (
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Графік активності за часом</h3>
        <div className="h-64 flex items-end space-x-2">
          {activityByDate.map((item, index) => {
            const height = (item.count / maxCount) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${item.count} дій`}
                ></div>
                <div className="text-xs mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {formatDate(item.date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Функція для створення кругової діаграми за типами активності
  const renderPieChart = () => {
    if (!showCharts || Object.keys(activityByType).length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">Немає даних для відображення діаграми</div>
      );
    }

    const total = Object.values(activityByType).reduce((sum, count) => sum + count, 0);

    return (
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Розподіл за типами</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(activityByType).map(([type, count], index) => {
              const percentage = ((count / total) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${getTypeColor(type).split(' ')[0]}`}
                  ></div>
                  <span className="text-sm">
                    {type}: {percentage}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center items-center">
            <div className="relative w-32 h-32">
              {Object.entries(activityByType).map(([type, count], index, array) => {
                const percentage = (count / total) * 100;
                let cumulativePercentage = 0;
                for (let i = 0; i < index; i++) {
                  cumulativePercentage += (array[i][1] / total) * 100;
                }

                return (
                  <div
                    key={index}
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(transparent ${cumulativePercentage}%, ${getTypeColor(type).split(' ')[0].replace('bg-', '')} ${cumulativePercentage}%, ${getTypeColor(type).split(' ')[0].replace('bg-', '')} ${cumulativePercentage + percentage}%, transparent ${cumulativePercentage + percentage}%)`,
                    }}
                  ></div>
                );
              })}
              <div className="absolute inset-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="bg-blue-600 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">Статистика активності користувачів</h2>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('activity')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'activity' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            aria-current={activeTab === 'activity' ? 'page' : undefined}
          >
            Активність
          </button>
          <button
            onClick={() => handleTabChange('changes')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'changes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            aria-current={activeTab === 'changes' ? 'page' : undefined}
          >
            Зміни
          </button>
          <button
            onClick={() => handleTabChange('questions')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'questions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            aria-current={activeTab === 'questions' ? 'page' : undefined}
          >
            Запитання
          </button>
        </nav>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {activeTab === 'activity' && 'Статистика активності'}
            {activeTab === 'changes' && 'Статистика змін'}
            {activeTab === 'questions' && 'Статистика запитань'}
          </h3>

          <select
            value={period}
            onChange={handlePeriodChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">За днями</option>
            <option value="week">За тижнями</option>
            <option value="month">За місяцями</option>
            <option value="year">За роками</option>
          </select>
        </div>

        {loading ? (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Завантаження даних...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Загальна кількість</h4>
                <p className="text-2xl font-bold text-blue-900">
                  {activeTab === 'activity' && activityData.length}
                  {activeTab === 'changes' && changesData.length}
                  {activeTab === 'questions' && questionsData.length}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-1">Унікальних користувачів</h4>
                <p className="text-2xl font-bold text-green-900">
                  {activeTab === 'activity' && new Set(activityData.map(item => item.userId)).size}
                  {activeTab === 'changes' && new Set(changesData.map(item => item.userId)).size}
                  {activeTab === 'questions' &&
                    new Set(questionsData.map(item => item.userId)).size}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-800 mb-1">Типів активності</h4>
                <p className="text-2xl font-bold text-purple-900">
                  {Object.keys(activityByType).length}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Розподіл за типами</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(activityByType).map(([type, count], index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(type)}`}
                      >
                        {type}
                      </span>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(activityByType))) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {renderChart()}
            {renderPieChart()}
          </>
        )}
      </div>
    </div>
  );
};

export default UserActivityStats;
