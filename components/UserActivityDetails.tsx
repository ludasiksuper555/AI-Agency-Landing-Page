import React from 'react';

import {
  UserActivityRecord,
  UserChangeRecord,
  UserQuestionRecord,
} from '../lib/userActivityDatabase';

type UserActivityDetailsProps = {
  activity?: UserActivityRecord;
  change?: UserChangeRecord;
  question?: UserQuestionRecord;
  onClose: () => void;
  className?: string;
};

const UserActivityDetails: React.FC<UserActivityDetailsProps> = ({
  activity,
  change,
  question,
  onClose,
  className = '',
}) => {
  if (!activity && !change && !question) {
    return null;
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatJSON = (data: any) => {
    if (!data) return 'Немає даних';
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Помилка форматування даних';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {activity
            ? 'Деталі активності користувача'
            : change
              ? 'Деталі змін користувача'
              : 'Деталі запитання користувача'}
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none"
          aria-label="Закрити"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {activity && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID користувача</h3>
                <p className="mt-1">{activity.userId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ім'я користувача</h3>
                <p className="mt-1">{activity.username || 'Не вказано'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Тип дії</h3>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      activity.actionType === 'view'
                        ? 'bg-blue-100 text-blue-800'
                        : activity.actionType === 'edit'
                          ? 'bg-yellow-100 text-yellow-800'
                          : activity.actionType === 'question'
                            ? 'bg-purple-100 text-purple-800'
                            : activity.actionType === 'login'
                              ? 'bg-green-100 text-green-800'
                              : activity.actionType === 'logout'
                                ? 'bg-red-100 text-red-800'
                                : activity.actionType === 'change'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : activity.actionType === 'download'
                                    ? 'bg-teal-100 text-teal-800'
                                    : activity.actionType === 'upload'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : activity.actionType === 'share'
                                        ? 'bg-pink-100 text-pink-800'
                                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {activity.actionType}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Час</h3>
                <p className="mt-1">{formatDate(activity.timestamp)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Деталі дії</h3>
              <p className="mt-1">{activity.actionDetails}</p>
            </div>

            {(activity.resourceType || activity.resourceId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activity.resourceType && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Тип ресурсу</h3>
                    <p className="mt-1">{activity.resourceType}</p>
                  </div>
                )}
                {activity.resourceId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ID ресурсу</h3>
                    <p className="mt-1">{activity.resourceId}</p>
                  </div>
                )}
              </div>
            )}

            {activity.metadata && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Метадані</h3>
                <pre className="mt-1 bg-gray-50 p-2 rounded overflow-auto text-xs">
                  {formatJSON(activity.metadata)}
                </pre>
              </div>
            )}
          </div>
        )}

        {change && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID зміни</h3>
                <p className="mt-1">{change.changeId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID користувача</h3>
                <p className="mt-1">{change.userId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Тип зміни</h3>
                <p className="mt-1">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {change.changeType}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Час</h3>
                <p className="mt-1">{formatDate(change.timestamp)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Тип сутності</h3>
                <p className="mt-1">{change.entityType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID сутності</h3>
                <p className="mt-1">{change.entityId}</p>
              </div>
            </div>

            {change.changes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Зміни</h3>
                <pre className="mt-1 bg-gray-50 p-2 rounded overflow-auto text-xs">
                  {formatJSON(change.changes)}
                </pre>
              </div>
            )}

            {change.metadata && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Метадані</h3>
                <pre className="mt-1 bg-gray-50 p-2 rounded overflow-auto text-xs">
                  {formatJSON(change.metadata)}
                </pre>
              </div>
            )}
          </div>
        )}

        {question && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID запитання</h3>
                <p className="mt-1">{question.questionId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID користувача</h3>
                <p className="mt-1">{question.userId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Час</h3>
                <p className="mt-1">{formatDate(question.timestamp)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Запитання</h3>
              <p className="mt-1 p-2 bg-gray-50 rounded">{question.question}</p>
            </div>

            {question.context && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Контекст</h3>
                <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{question.context}</p>
              </div>
            )}

            {question.metadata && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Метадані</h3>
                <pre className="mt-1 bg-gray-50 p-2 rounded overflow-auto text-xs">
                  {formatJSON(question.metadata)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityDetails;
