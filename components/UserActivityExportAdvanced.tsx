import React, { useEffect, useState } from 'react';

import {
  UserActivityRecord,
  UserChangeRecord,
  UserQuestionRecord,
} from '../lib/userActivityDatabase';
import { ExportFormat, ExportParams, UserActivityExport } from '../lib/userActivityExport';

type ExportDataType = 'activity' | 'changes' | 'questions';

type FieldOption = {
  id: string;
  label: string;
  checked: boolean;
};

type UserActivityExportAdvancedProps = {
  activityData?: UserActivityRecord[];
  changesData?: UserChangeRecord[];
  questionsData?: UserQuestionRecord[];
  className?: string;
  defaultDataType?: ExportDataType;
  defaultFormat?: ExportFormat;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: string) => void;
};

const UserActivityExportAdvanced: React.FC<UserActivityExportAdvancedProps> = ({
  activityData = [],
  changesData = [],
  questionsData = [],
  className = '',
  defaultDataType = 'activity',
  defaultFormat = 'csv',
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const [dataType, setDataType] = useState<ExportDataType>(defaultDataType);
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [fileName, setFileName] = useState<string>(
    `user-${dataType}-${new Date().toISOString().slice(0, 10)}`
  );
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [dateFormat, setDateFormat] = useState<string>('iso');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Фільтри
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');
  const [resourceType, setResourceType] = useState<string>('');

  // Поля для експорту
  const [availableFields, setAvailableFields] = useState<FieldOption[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Список унікальних користувачів та типів дій
  const [uniqueUsers, setUniqueUsers] = useState<{ id: string; name?: string }[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);

  // Ініціалізація полів при зміні типу даних
  useEffect(() => {
    initializeFields();
    updateUniqueValues();
    setFileName(`user-${dataType}-${new Date().toISOString().slice(0, 10)}`);
  }, [dataType, activityData, changesData, questionsData]);

  const initializeFields = () => {
    let fields: FieldOption[] = [];

    switch (dataType) {
      case 'activity':
        fields = [
          { id: 'userId', label: 'ID користувача', checked: true },
          { id: 'username', label: "Ім'я користувача", checked: true },
          { id: 'actionType', label: 'Тип дії', checked: true },
          { id: 'actionDetails', label: 'Деталі дії', checked: true },
          { id: 'resourceType', label: 'Тип ресурсу', checked: true },
          { id: 'resourceId', label: 'ID ресурсу', checked: true },
          { id: 'timestamp', label: 'Час', checked: true },
          { id: 'metadata', label: 'Метадані', checked: false },
        ];
        break;
      case 'changes':
        fields = [
          { id: 'changeId', label: 'ID зміни', checked: true },
          { id: 'userId', label: 'ID користувача', checked: true },
          { id: 'changeType', label: 'Тип зміни', checked: true },
          { id: 'entityType', label: 'Тип сутності', checked: true },
          { id: 'entityId', label: 'ID сутності', checked: true },
          { id: 'timestamp', label: 'Час', checked: true },
          { id: 'changes', label: 'Зміни', checked: true },
          { id: 'metadata', label: 'Метадані', checked: false },
        ];
        break;
      case 'questions':
        fields = [
          { id: 'questionId', label: 'ID запитання', checked: true },
          { id: 'userId', label: 'ID користувача', checked: true },
          { id: 'question', label: 'Запитання', checked: true },
          { id: 'context', label: 'Контекст', checked: true },
          { id: 'timestamp', label: 'Час', checked: true },
          { id: 'metadata', label: 'Метадані', checked: false },
        ];
        break;
    }

    setAvailableFields(fields);
    setSelectedFields(fields.filter(f => f.checked).map(f => f.id));
  };

  const updateUniqueValues = () => {
    let users: { id: string; name?: string }[] = [];
    let types: string[] = [];
    let resources: string[] = [];

    switch (dataType) {
      case 'activity':
        users = Array.from(new Set(activityData.map(item => item.userId))).map(id => ({
          id,
          name: activityData.find(item => item.userId === id)?.username,
        }));
        types = Array.from(new Set(activityData.map(item => item.actionType)));
        resources = Array.from(
          new Set(
            activityData.filter(item => item.resourceType).map(item => item.resourceType as string)
          )
        );
        break;
      case 'changes':
        users = Array.from(new Set(changesData.map(item => item.userId))).map(id => ({ id }));
        types = Array.from(new Set(changesData.map(item => item.changeType)));
        resources = Array.from(new Set(changesData.map(item => item.entityType)));
        break;
      case 'questions':
        users = Array.from(new Set(questionsData.map(item => item.userId))).map(id => ({ id }));
        types = [];
        resources = [];
        break;
    }

    setUniqueUsers(users);
    setActionTypes(types);
    setResourceTypes(resources);
  };

  const handleDataTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDataType = e.target.value as ExportDataType;
    setDataType(newDataType);
    // Скидання фільтрів при зміні типу даних
    setUserId('');
    setActionType('');
    setResourceType('');
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as ExportFormat);
  };

  const handleFieldToggle = (fieldId: string) => {
    setAvailableFields(prev =>
      prev.map(field => (field.id === fieldId ? { ...field, checked: !field.checked } : field))
    );

    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };

  const handleSelectAllFields = () => {
    setAvailableFields(prev => prev.map(field => ({ ...field, checked: true })));
    setSelectedFields(availableFields.map(field => field.id));
  };

  const handleDeselectAllFields = () => {
    setAvailableFields(prev => prev.map(field => ({ ...field, checked: false })));
    setSelectedFields([]);
  };

  const filterActivityData = (data: UserActivityRecord[]) => {
    return data.filter(item => {
      // Фільтрація за датою
      if (startDate && new Date(item.timestamp) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(item.timestamp) > new Date(`${endDate}T23:59:59.999Z`)) {
        return false;
      }

      // Фільтрація за користувачем
      if (userId && item.userId !== userId) {
        return false;
      }

      // Фільтрація за типом дії
      if (actionType && item.actionType !== actionType) {
        return false;
      }

      // Фільтрація за типом ресурсу
      if (resourceType && item.resourceType !== resourceType) {
        return false;
      }

      return true;
    });
  };

  const filterChangesData = (data: UserChangeRecord[]) => {
    return data.filter(item => {
      // Фільтрація за датою
      if (startDate && new Date(item.timestamp) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(item.timestamp) > new Date(`${endDate}T23:59:59.999Z`)) {
        return false;
      }

      // Фільтрація за користувачем
      if (userId && item.userId !== userId) {
        return false;
      }

      // Фільтрація за типом змін
      if (actionType && item.changeType !== actionType) {
        return false;
      }

      // Фільтрація за типом сутності
      if (resourceType && item.entityType !== resourceType) {
        return false;
      }

      return true;
    });
  };

  const filterQuestionsData = (data: UserQuestionRecord[]) => {
    return data.filter(item => {
      // Фільтрація за датою
      if (startDate && new Date(item.timestamp) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(item.timestamp) > new Date(`${endDate}T23:59:59.999Z`)) {
        return false;
      }

      // Фільтрація за користувачем
      if (userId && item.userId !== userId) {
        return false;
      }

      return true;
    });
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      setExportError('Виберіть хоча б одне поле для експорту');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    onExportStart?.();

    try {
      let dataToExport: any[] = [];

      switch (dataType) {
        case 'activity':
          if (activityData.length === 0) {
            throw new Error('Немає даних про активність для експорту');
          }
          dataToExport = filterActivityData(activityData) as any[];
          break;
        case 'changes':
          if (changesData.length === 0) {
            throw new Error('Немає даних про зміни для експорту');
          }
          dataToExport = filterChangesData(changesData) as any[];
          break;
        case 'questions':
          if (questionsData.length === 0) {
            throw new Error('Немає даних про запитання для експорту');
          }
          dataToExport = filterQuestionsData(questionsData) as any[];
          break;
        default:
          throw new Error(`Непідтримуваний тип даних: ${dataType}`);
      }

      if (dataToExport.length === 0) {
        throw new Error('Немає даних, що відповідають вибраним фільтрам');
      }

      // Фільтрація полів для експорту
      const filteredData = dataToExport.map(item => {
        const filteredItem: Partial<UserActivityRecord> = {};
        selectedFields.forEach(field => {
          if (item[field] !== undefined) {
            filteredItem[field] = item[field];
          }
        });
        return filteredItem;
      });

      const params: ExportParams = {
        format,
        fileName,
        includeHeaders,
        dateFormat,
      };

      // Фільтрація даних за вибраними полями буде виконана в методах експорту
      const fieldsToExport = selectedFields;

      // Виклик відповідного методу експорту
      switch (dataType) {
        case 'activity':
          UserActivityExport.downloadActivityData(filteredData as UserActivityRecord[], params);
          break;
        case 'changes':
          UserActivityExport.downloadChangesData(filteredData as UserChangeRecord[], params);
          break;
        case 'questions':
          UserActivityExport.downloadQuestionsData(filteredData as UserQuestionRecord[], params);
          break;
      }

      onExportComplete?.();
    } catch (error) {
      console.error('Помилка при експорті даних:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка при експорті';
      setExportError(errorMessage);
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Розширений експорт даних</h2>

      {exportError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <p>{exportError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-1">
            Тип даних
          </label>
          <select
            id="dataType"
            value={dataType}
            onChange={handleDataTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isExporting}
          >
            <option value="activity">Активність користувачів</option>
            <option value="changes">Зміни користувачів</option>
            <option value="questions">Запитання користувачів</option>
          </select>
        </div>

        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
            Формат експорту
          </label>
          <select
            id="format"
            value={format}
            onChange={handleFormatChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isExporting}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="excel">Excel (XLSX)</option>
          </select>
        </div>

        <div>
          <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
            Ім'я файлу
          </label>
          <input
            type="text"
            id="fileName"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isExporting}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium mb-2 border-b pb-2">Фільтри</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Дата початку
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Дата кінця
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            />
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              Користувач
            </label>
            <select
              id="userId"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            >
              <option value="">Всі користувачі</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name ? `${user.name} (${user.id})` : user.id}
                </option>
              ))}
            </select>
          </div>

          {dataType !== 'questions' && (
            <div>
              <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
                {dataType === 'activity' ? 'Тип дії' : 'Тип зміни'}
              </label>
              <select
                id="actionType"
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isExporting}
              >
                <option value="">Всі типи</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {dataType !== 'questions' && (
            <div>
              <label
                htmlFor="resourceType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {dataType === 'activity' ? 'Тип ресурсу' : 'Тип сутності'}
              </label>
              <select
                id="resourceType"
                value={resourceType}
                onChange={e => setResourceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isExporting}
              >
                <option value="">Всі типи</option>
                {resourceTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-medium border-b pb-2">Поля для експорту</h3>
          <div className="space-x-2">
            <button
              type="button"
              onClick={handleSelectAllFields}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isExporting}
            >
              Вибрати всі
            </button>
            <button
              type="button"
              onClick={handleDeselectAllFields}
              className="text-sm text-red-600 hover:text-red-800"
              disabled={isExporting}
            >
              Скасувати всі
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {availableFields.map(field => (
            <div key={field.id} className="flex items-center">
              <input
                type="checkbox"
                id={`field-${field.id}`}
                checked={field.checked}
                onChange={() => handleFieldToggle(field.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isExporting}
              />
              <label htmlFor={`field-${field.id}`} className="ml-2 block text-sm text-gray-700">
                {field.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {dataType === 'activity' && `Доступно записів: ${activityData.length}`}
          {dataType === 'changes' && `Доступно записів: ${changesData.length}`}
          {dataType === 'questions' && `Доступно записів: ${questionsData.length}`}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeHeaders"
              checked={includeHeaders}
              onChange={e => setIncludeHeaders(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isExporting}
            />
            <label htmlFor="includeHeaders" className="ml-2 block text-sm text-gray-700">
              Включити заголовки
            </label>
          </div>

          <button
            onClick={handleExport}
            disabled={
              isExporting ||
              (dataType === 'activity' && activityData.length === 0) ||
              (dataType === 'changes' && changesData.length === 0) ||
              (dataType === 'questions' && questionsData.length === 0) ||
              selectedFields.length === 0
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isExporting ? 'Експортування...' : 'Експортувати дані'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserActivityExportAdvanced;
