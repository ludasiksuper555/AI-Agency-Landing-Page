import React, { useEffect, useState } from 'react';

import {
  UserActivityRecord,
  UserChangeRecord,
  UserQuestionRecord,
} from '../lib/userActivityDatabase';
import {
  fetchUserActivityHistory,
  fetchUserChangesHistory,
  fetchUserQuestionsHistory,
} from '../lib/userActivityTracker';
import UserActivityDetails from './UserActivityDetails';
import UserActivityExportComponent from './UserActivityExport';
import UserActivityExportAdvanced from './UserActivityExportAdvanced';
import UserActivityList from './UserActivityList';
import UserActivityStats from './UserActivityStats';

type ActivityData = UserActivityRecord;

type PaginationInfo = {
  total: number;
  limit: number;
  offset: number;
};

type ActivityResponse = {
  data: ActivityData[];
  pagination: PaginationInfo;
  success?: boolean;
  error?: string;
};

type UserActivityDashboardProps = {
  userId?: string;
  className?: string;
};

const UserActivityDashboard: React.FC<UserActivityDashboardProps> = ({
  userId,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>('activity');
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [changesData, setChangesData] = useState<UserChangeRecord[]>([]);
  const [questionsData, setQuestionsData] = useState<UserQuestionRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, limit: 10, offset: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    userId: '',
    username: '',
    email: '',
    actionType: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });

  const actionTypes = [
    'view',
    'edit',
    'question',
    'login',
    'logout',
    'api_call',
    'change',
    'other',
  ];

  const [selectedActivity, setSelectedActivity] = useState<UserActivityRecord | null>(null);
  const [selectedChange, setSelectedChange] = useState<UserChangeRecord | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuestionRecord | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      // Завантаження даних про активність
      const result = await fetchUserActivityHistory(
        filters.userId || userId || '',
        pagination.limit,
        pagination.offset
      );

      // Convert UserAction[] to ActivityData[]
      const activityData: ActivityData[] = result.map((action, index) => ({
        id: index + 1, // Generate ID since UserAction doesn't have one
        userId: action.userId,
        actionType: action.actionType,
        actionDetails: action.actionDetails || '',
        resourceType: action.resourceType,
        resourceId: action.resourceId,
        timestamp: new Date(action.timestamp),
        metadata: action.metadata || {},
      }));

      setActivities(activityData);
      setPagination(prev => ({ ...prev, total: result.length }));

      // Завантаження даних про зміни
      const changesResult = await fetchUserChangesHistory({
        userId: filters.userId || userId || undefined,
        limit: 1000,
      });

      if (changesResult.success === false && changesResult.error) {
        console.error('Помилка при завантаженні змін:', changesResult.error);
      } else {
        setChangesData(changesResult.data || []);
      }

      // Завантаження даних про запитання
      const questionsResult = await fetchUserQuestionsHistory({
        userId: filters.userId || userId || undefined,
        limit: 1000,
      });

      if (questionsResult.success === false && questionsResult.error) {
        console.error('Помилка при завантаженні запитань:', questionsResult.error);
      } else {
        setQuestionsData(questionsResult.data || []);
      }
    } catch (err) {
      setError('Помилка при завантаженні даних активності');
      console.error('Помилка при завантаженні історії активності:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [pagination.offset, pagination.limit, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Скидаємо вибрані елементи при зміні вкладки
    setSelectedActivity(null);
    setSelectedChange(null);
    setSelectedQuestion(null);
  };

  const handleActivityClick = (activity: ActivityData) => {
    setSelectedActivity(activity);
  };

  const handleChangeClick = (change: UserChangeRecord) => {
    setSelectedChange(change);
  };

  const handleQuestionClick = (question: UserQuestionRecord) => {
    setSelectedQuestion(question);
  };

  const handleCloseDetails = () => {
    setSelectedActivity(null);
    setSelectedChange(null);
    setSelectedQuestion(null);
  };

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month' | 'year') => {
    setPeriod(newPeriod);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, offset: 0 })); // Скидаємо пагінацію при зміні фільтрів
    loadActivities();
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Панель активності користувачів</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Оновити дані"
        >
          <span className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Оновити
          </span>
        </button>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('activity')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'activity' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              aria-current={activeTab === 'activity' ? 'page' : undefined}
            >
              Активність
            </button>
            <button
              onClick={() => handleTabChange('changes')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'changes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              aria-current={activeTab === 'changes' ? 'page' : undefined}
            >
              Зміни
            </button>
            <button
              onClick={() => handleTabChange('questions')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'questions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              aria-current={activeTab === 'questions' ? 'page' : undefined}
            >
              Запитання
            </button>
            <button
              onClick={() => handleTabChange('stats')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'stats' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              aria-current={activeTab === 'stats' ? 'page' : undefined}
            >
              Статистика
            </button>
            <button
              onClick={() => handleTabChange('export')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'export' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              aria-current={activeTab === 'export' ? 'page' : undefined}
            >
              Експорт
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Фільтри</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              ID користувача
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введіть ID користувача"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Ім'я користувача
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={filters.username}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введіть ім'я користувача"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email користувача
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введіть email користувача"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
              Тип дії
            </label>
            <select
              id="actionType"
              name="actionType"
              value={filters.actionType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Всі типи</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 mb-1">
              Тип ресурсу
            </label>
            <input
              type="text"
              id="resourceType"
              name="resourceType"
              value={filters.resourceType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введіть тип ресурсу"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Завантаження...' : 'Застосувати фільтри'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Дата початку
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Дата кінця
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Завантаження даних...</span>
        </div>
      ) : (
        <div>
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Фільтри</h2>
                {/* Фільтри залишаються без змін */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* ... існуючі фільтри ... */}
                </div>
                {/* ... інші фільтри ... */}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <UserActivityList
                    userId={filters.userId || userId || undefined}
                    limit={pagination.limit}
                    showFilters={false}
                    showPagination={true}
                    className="h-full"
                    onActivityClick={handleActivityClick}
                  />
                </div>

                <div className="lg:col-span-1">
                  <UserActivityExportComponent activityData={activities} className="mb-6" />

                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Статистика активності</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Загальна кількість дій
                        </h3>
                        <p className="text-2xl font-bold">{pagination.total}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Найпопулярніші типи дій
                        </h3>
                        <div className="mt-2 space-y-2">
                          {actionTypes.slice(0, 5).map(type => {
                            const count = activities.filter(a => a.actionType === type).length;
                            return (
                              <div key={type} className="flex items-center justify-between">
                                <span className="text-sm">{type}</span>
                                <span className="text-sm font-medium">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Останнє оновлення</h3>
                        <p className="text-sm">{new Date().toLocaleString('uk-UA')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedActivity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <UserActivityDetails
                    activity={selectedActivity}
                    onClose={handleCloseDetails}
                    className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="space-y-6">
              <UserActivityList
                userId={filters.userId || userId || undefined}
                showFilters={true}
                showPagination={true}
                limit={20}
                onlyTypes={['change']}
                onActivityClick={activity => {
                  // Знаходимо відповідну зміну за ID ресурсу
                  const change = changesData.find(c => c.changeId === activity.resourceId);
                  if (change) {
                    handleChangeClick(change);
                  }
                }}
              />

              {selectedChange && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <UserActivityDetails
                    change={selectedChange}
                    onClose={handleCloseDetails}
                    className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-6">
              <UserActivityList
                userId={filters.userId || userId || undefined}
                showFilters={true}
                showPagination={true}
                limit={20}
                onlyTypes={['question']}
                onActivityClick={activity => {
                  // Знаходимо відповідне запитання за ID ресурсу
                  const question = questionsData.find(q => q.questionId === activity.resourceId);
                  if (question) {
                    handleQuestionClick(question);
                  }
                }}
              />

              {selectedQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <UserActivityDetails
                    question={selectedQuestion}
                    onClose={handleCloseDetails}
                    className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <UserActivityStats
              activityData={activities}
              changesData={changesData}
              questionsData={questionsData}
              period={period}
              showCharts={true}
            />
          )}

          {activeTab === 'export' && (
            <UserActivityExportAdvanced
              activityData={activities}
              changesData={changesData}
              questionsData={questionsData}
              onExportStart={() => setLoading(true)}
              onExportComplete={() => setLoading(false)}
              onExportError={error => {
                setLoading(false);
                setError(error);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default UserActivityDashboard;
