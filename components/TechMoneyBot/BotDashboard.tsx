'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
// Temporary SVG icons to replace lucide-react
const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const Bot = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const DollarSign = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14,2 L6,2 C4.9,2 4,2.9 4,4 L4,20 C4,21.1 4.9,22 6,22 L18,22 C19.1,22 20,21.1 20,20 L20,8 L14,2 Z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const Pause = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

const Search = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
    <polyline points="16,7 22,7 22,13" />
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
  </svg>
);

import { BotSettings as BotSettingsType, Project as ProjectType } from './BotService';
import BotSettings from './BotSettings';

interface DashboardStats {
  totalProjects: number;
  proposalsSent: number;
  responseRate: number;
  activeSearches: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  isRunning: boolean;
  lastUpdate: string;
}

interface BotDashboardProps {
  initialData?: any;
}

const BotDashboard: React.FC<BotDashboardProps> = ({ initialData }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [botSettings, setBotSettings] = useState<BotSettingsType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [botStats, setBotStats] = useState<DashboardStats>({
    totalProjects: 127,
    proposalsSent: 23,
    responseRate: 18.5,
    activeSearches: 5,
    dailyEarnings: 450,
    weeklyEarnings: 2850,
    isRunning: true,
    lastUpdate: new Date().toLocaleTimeString('uk-UA'),
  });

  const [projects, setProjects] = useState<ProjectType[]>([
    {
      id: '1',
      title: 'React Developer for E-commerce Platform',
      platform: 'upwork',
      budget: '$2000-$5000',
      description: 'Looking for experienced React developer to build modern e-commerce platform...',
      postedAt: '2 години тому',
      status: 'new',
      clientRating: 4.8,
    },
    {
      id: '2',
      title: 'Full Stack Developer - Node.js & React',
      platform: 'freelancer',
      budget: '$1500-$3000',
      description: 'Need full stack developer for SaaS application development...',
      postedAt: '4 години тому',
      status: 'applied',
      clientRating: 4.5,
    },
    {
      id: '3',
      title: 'Mobile App Development - React Native',
      platform: 'fiverr',
      budget: '$3000-$7000',
      description: 'Seeking React Native developer for cross-platform mobile app...',
      postedAt: '6 годин тому',
      status: 'responded',
      clientRating: 4.9,
    },
  ]);

  const [searchSettings, setSearchSettings] = useState({
    keywords: 'React, Node.js, TypeScript, Next.js',
    minBudget: 1000,
    maxBudget: 10000,
    platforms: ['upwork', 'freelancer', 'fiverr'],
    autoApply: true,
    searchInterval: 2,
  });

  const toggleBot = () => {
    setBotStats(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleStartSearch = async () => {
    setIsSearching(true);
    // Simulate search process
    setTimeout(() => {
      setIsSearching(false);
      // Update projects or show results
    }, 3000);
  };

  const refreshData = () => {
    setBotStats(prev => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString('uk-UA'),
      totalProjects: prev.totalProjects + Math.floor(Math.random() * 5),
    }));
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'upwork':
        return 'bg-green-100 text-green-800';
      case 'freelancer':
        return 'bg-blue-100 text-blue-800';
      case 'fiverr':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Огляд', icon: BarChart3 },
    { id: 'projects', name: 'Проекти', icon: Search },
    { id: 'proposals', name: 'Пропозиції', icon: FileText },
    { id: 'analytics', name: 'Аналітика', icon: TrendingUp },
    { id: 'settings', name: 'Налаштування', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TechMoneyBot</h1>
                <p className="text-gray-600">Автоматизація пошуку IT проектів</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${botStats.isRunning ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-sm font-medium">
                  {botStats.isRunning ? 'Активний' : 'Зупинений'}
                </span>
              </div>

              <button
                onClick={toggleBot}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  botStats.isRunning
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {botStats.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {botStats.isRunning ? 'Зупинити' : 'Запустити'}
              </button>

              <button
                onClick={refreshData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Оновити
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Знайдено проектів</p>
                <p className="text-2xl font-bold text-gray-900">{botStats.totalProjects}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Відправлено пропозицій</p>
                <p className="text-2xl font-bold text-gray-900">{botStats.proposalsSent}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Відсоток відповідей</p>
                <p className="text-2xl font-bold text-gray-900">{botStats.responseRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Тижневий дохід</p>
                <p className="text-2xl font-bold text-gray-900">${botStats.weeklyEarnings}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Activity Chart */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Активність за тиждень
                    </h3>
                    <div className="space-y-3">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, index) => (
                        <div key={day} className="flex items-center space-x-3">
                          <span className="w-8 text-sm font-medium text-gray-600">{day}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.random() * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {Math.floor(Math.random() * 20) + 5}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Остання активність</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-700">Знайдено 5 нових проектів</span>
                        <span className="text-xs text-gray-500">2 хв тому</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <span className="text-sm text-gray-700">
                          Відправлено пропозицію на Upwork
                        </span>
                        <span className="text-xs text-gray-500">15 хв тому</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm text-gray-700">
                          Отримано відповідь від клієнта
                        </span>
                        <span className="text-xs text-gray-500">1 год тому</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Знайдені проекти</h3>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Останнє оновлення: {botStats.lastUpdate}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {projects.map(project => (
                    <div
                      key={project.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{project.title}</h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(project.platform)}`}
                            >
                              {project.platform}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                            >
                              {project.status === 'new'
                                ? 'Новий'
                                : project.status === 'applied'
                                  ? 'Подано заявку'
                                  : project.status === 'responded'
                                    ? 'Отримано відповідь'
                                    : 'Відхилено'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Бюджет: {project.budget}</span>
                            <span>Рейтинг клієнта: {project.clientRating}/5</span>
                            <span>{project.postedAt}</span>
                          </div>
                        </div>
                        <button className="ml-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                          Переглянути
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'proposals' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Генератор пропозицій</h3>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Налаштування AI генератора</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тон пропозиції
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Професійний</option>
                        <option>Дружній</option>
                        <option>Формальний</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Довжина пропозиції
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Коротка (100-150 слів)</option>
                        <option>Середня (150-250 слів)</option>
                        <option>Детальна (250+ слів)</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-send" className="rounded" />
                      <label htmlFor="auto-send" className="text-sm text-gray-700">
                        Автоматично відправляти пропозиції
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Проекти</h3>
                  <button
                    onClick={handleStartSearch}
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {isSearching ? 'Пошук...' : 'Почати пошук'}
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6">
                    <div className="space-y-4">
                      {projects.map(project => (
                        <div
                          key={project.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {project.title}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                project.status === 'new'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : project.status === 'applied'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : project.status === 'won'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {project.status === 'new'
                                ? 'Новий'
                                : project.status === 'applied'
                                  ? 'Подано заявку'
                                  : project.status === 'won'
                                    ? 'Виграно'
                                    : 'Відхилено'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {project.description}
                          </p>
                          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              {project.platform} • ${project.budget}
                            </span>
                            <span>{new Date(project.postedAt).toLocaleDateString('uk-UA')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Пропозиції</h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-gray-500 dark:text-gray-400">
                    Функціонал пропозицій буде додано незабаром...
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Аналітика</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Статистика за місяць</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Знайдено проектів:</span>
                        <span className="font-medium">342</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Відправлено пропозицій:</span>
                        <span className="font-medium">89</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Отримано відповідей:</span>
                        <span className="font-medium">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Виграно проектів:</span>
                        <span className="font-medium">8</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Ефективність платформ</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Upwork</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: '75%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">75%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Freelancer</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: '60%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">60%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Fiverr</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: '45%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">45%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <BotSettings
                onSettingsUpdate={settings => {
                  setBotSettings(settings);
                  // Можна додати додаткову логіку при оновленні налаштувань
                }}
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BotDashboard;
