import React, { useEffect, useState } from 'react';

import { botService, BotSettings as BotSettingsType } from './BotService';

interface BotSettingsProps {
  onSettingsUpdate?: (settings: BotSettingsType) => void;
}

const BotSettings: React.FC<BotSettingsProps> = ({ onSettingsUpdate }) => {
  const [settings, setSettings] = useState<BotSettingsType>({
    searchInterval: 30,
    autoApply: false,
    platforms: ['upwork', 'freelancer'],
    keywords: 'react, javascript, typescript',
    minBudget: 500,
    maxBudget: 5000,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Завантаження налаштувань при монтуванні компонента
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await botService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Помилка завантаження налаштувань' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await botService.updateSettings(settings);
      setMessage({ type: 'success', text: 'Налаштування збережено успішно!' });
      onSettingsUpdate?.(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Помилка збереження налаштувань' });
    } finally {
      setSaving(false);
    }
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSettings(prev => ({
        ...prev,
        platforms: [...prev.platforms, platform],
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        platforms: prev.platforms.filter(p => p !== platform),
      }));
    }
  };

  const resetToDefaults = () => {
    setSettings({
      searchInterval: 30,
      autoApply: false,
      platforms: ['upwork', 'freelancer'],
      keywords: 'react, javascript, typescript',
      minBudget: 500,
      maxBudget: 5000,
    });
    setMessage({ type: 'success', text: 'Налаштування скинуто до значень за замовчуванням' });
  };

  // Автоматичне приховування повідомлень
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Налаштування бота</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Конфігурація параметрів пошуку та автоматизації
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Повідомлення */}
        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Інтервал пошуку */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Інтервал пошуку (хвилини)
          </label>
          <input
            type="number"
            min="5"
            max="1440"
            value={settings.searchInterval}
            onChange={e =>
              setSettings(prev => ({ ...prev, searchInterval: parseInt(e.target.value) || 30 }))
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Як часто бот буде шукати нові проекти (від 5 до 1440 хвилин)
          </p>
        </div>

        {/* Платформи */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Платформи для пошуку
          </label>
          <div className="space-y-2">
            {['upwork', 'freelancer', 'fiverr'].map(platform => (
              <label key={platform} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.platforms.includes(platform)}
                  onChange={e => handlePlatformChange(platform, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {platform}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Ключові слова */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ключові слова
          </label>
          <textarea
            value={settings.keywords}
            onChange={e => setSettings(prev => ({ ...prev, keywords: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="react, javascript, typescript, node.js"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Розділіть ключові слова комами
          </p>
        </div>

        {/* Бюджет */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Мінімальний бюджет ($)
            </label>
            <input
              type="number"
              min="0"
              value={settings.minBudget}
              onChange={e =>
                setSettings(prev => ({ ...prev, minBudget: parseInt(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Максимальний бюджет ($)
            </label>
            <input
              type="number"
              min="0"
              value={settings.maxBudget}
              onChange={e =>
                setSettings(prev => ({ ...prev, maxBudget: parseInt(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Автоматичне подання заявок */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoApply}
              onChange={e => setSettings(prev => ({ ...prev, autoApply: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Автоматично подавати заявки на підходящі проекти
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            ⚠️ Увага: автоматичне подання заявок може призвести до блокування акаунта
          </p>
        </div>

        {/* Кнопки дій */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Збереження...
              </>
            ) : (
              'Зберегти налаштування'
            )}
          </button>

          <button
            onClick={resetToDefaults}
            className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Скинути
          </button>
        </div>
      </div>
    </div>
  );
};

export default BotSettings;
