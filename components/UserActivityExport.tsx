import React, { useState } from 'react';

import {
  UserActivityRecord,
  UserChangeRecord,
  UserQuestionRecord,
} from '../lib/userActivityDatabase';
import { ExportFormat, ExportParams, UserActivityExport } from '../lib/userActivityExport';

type ExportDataType = 'activity' | 'changes' | 'questions';

type UserActivityExportProps = {
  activityData?: UserActivityRecord[];
  changesData?: UserChangeRecord[];
  questionsData?: UserQuestionRecord[];
  className?: string;
  defaultDataType?: ExportDataType;
  defaultFormat?: ExportFormat;
};

const UserActivityExportComponent: React.FC<UserActivityExportProps> = ({
  activityData = [],
  changesData = [],
  questionsData = [],
  className = '',
  defaultDataType = 'activity',
  defaultFormat = 'csv',
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

  const handleDataTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDataType = e.target.value as ExportDataType;
    setDataType(newDataType);
    setFileName(`user-${newDataType}-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as ExportFormat);
  };

  const handleExport = () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const params: ExportParams = {
        format,
        fileName,
        includeHeaders,
        dateFormat,
      };

      switch (dataType) {
        case 'activity':
          if (activityData.length === 0) {
            throw new Error('Немає даних про активність для експорту');
          }
          UserActivityExport.downloadActivityData(activityData, params);
          break;
        case 'changes':
          if (changesData.length === 0) {
            throw new Error('Немає даних про зміни для експорту');
          }
          UserActivityExport.downloadChangesData(changesData, params);
          break;
        case 'questions':
          if (questionsData.length === 0) {
            throw new Error('Немає даних про запитання для експорту');
          }
          UserActivityExport.downloadQuestionsData(questionsData, params);
          break;
        default:
          throw new Error(`Непідтримуваний тип даних: ${dataType}`);
      }
    } catch (error) {
      console.error('Помилка при експорті даних:', error);
      setExportError(error instanceof Error ? error.message : 'Невідома помилка при експорті');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Експорт даних активності</h2>

      {exportError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <p>{exportError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <option value="excel">Excel (CSV)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

        <div>
          <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
            Формат дати
          </label>
          <select
            id="dateFormat"
            value={dateFormat}
            onChange={e => setDateFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isExporting}
          >
            <option value="iso">ISO (2023-01-01T12:00:00.000Z)</option>
            <option value="local">Локальний (01.01.2023, 12:00:00)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center mb-4">
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {dataType === 'activity' && `Доступно записів: ${activityData.length}`}
          {dataType === 'changes' && `Доступно записів: ${changesData.length}`}
          {dataType === 'questions' && `Доступно записів: ${questionsData.length}`}
        </div>

        <button
          onClick={handleExport}
          disabled={
            isExporting ||
            (dataType === 'activity' && activityData.length === 0) ||
            (dataType === 'changes' && changesData.length === 0) ||
            (dataType === 'questions' && questionsData.length === 0)
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isExporting ? 'Експортування...' : 'Експортувати дані'}
        </button>
      </div>
    </div>
  );
};

export default UserActivityExportComponent;
