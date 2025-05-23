import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authenticateWithMGX, getMGXUserInfo, configureMGXIntegration } from '../utils/mgxUtils';

const MGXIntegration: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<{username: string; email: string} | null>(null);
  const { code } = router.query;

  useEffect(() => {
    // Перевіряємо, чи є код авторизації в URL після перенаправлення з MGX
    if (code && typeof code === 'string') {
      handleAuthCode(code);
    }
  }, [code]);

  const handleAuthCode = async (authCode: string) => {
    setIsLoading(true);
    try {
      const authResponse = await authenticateWithMGX(authCode);
      if (authResponse.success && authResponse.token) {
        // Зберігаємо токен в localStorage
        localStorage.setItem('mgx_token', authResponse.token);
        setIsAuthenticated(true);
        
        // Отримуємо інформацію про користувача
        const user = await getMGXUserInfo(authResponse.token);
        if (user) {
          setUserInfo({
            username: user.username,
            email: user.email
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMGXAuth = () => {
    setIsLoading(true);
    // Перенаправлення на сторінку авторизації MGX
    window.location.href = 'https://mgx.dev/chat/p125h#2-%D0%BE%D0%BF%D1%80%D0%B5%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D0%B0';
  };

  const handleMGXIntegration = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('mgx_token');
      if (!token) {
        alert(t('mgx.authRequired'));
        return;
      }
      
      const result = await configureMGXIntegration(token, {
        appId: 'trae-app',
        locale: router.locale || 'uk'
      });
      
      if (result.success) {
        alert(result.message);
      } else {
        alert(`${t('mgx.error')}: ${result.message}`);
      }
    } catch (error) {
      console.error('Integration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-8">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
        {t('mgx.title')}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {t('mgx.description')}
      </p>
      
      <div className="flex flex-col space-y-4">
        {!isAuthenticated ? (
          <button
            onClick={handleMGXAuth}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            aria-label={t('mgx.authButton')}
            tabIndex={0}
          >
            {isLoading ? t('mgx.loading') : t('mgx.authButton')}
          </button>
        ) : null}
        
        {isAuthenticated && userInfo && (
          <div className="text-center text-gray-700 dark:text-gray-300 py-2 mb-4">
            {t('mgx.loggedInAs')}: <span className="font-semibold">{userInfo.username}</span>
          </div>
        )}
        
        {isAuthenticated && (
          <>
            <button
              onClick={handleMGXIntegration}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
              aria-label={t('mgx.integrationButton')}
              tabIndex={0}
            >
              {isLoading ? t('mgx.loading') : t('mgx.integrationButton')}
            </button>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                GitHub Integration
              </h3>
              
              {!gitHubConnected ? (
                <button
                  onClick={handleGitHubAuth}
                  disabled={isLoading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 mb-3"
                  aria-label="Connect GitHub"
                  tabIndex={0}
                >
                  {isLoading ? t('mgx.loading') : 'Connect GitHub Account'}
                </button>
              ) : (
                <>
                  <div className="text-sm text-green-600 dark:text-green-400 mb-3">
                    GitHub account connected
                  </div>
                  
                  <button
                    onClick={handleGitHubSync}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 mb-3"
                    aria-label="Sync with GitHub"
                    tabIndex={0}
                  >
                    {isLoading ? t('mgx.loading') : 'Sync with GitHub'}
                  </button>
                  
                  {syncStatus && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      {syncStatus}
                    </div>
                  )}
                  
                  <button
                    onClick={handleCodeAnalysis}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 mb-3"
                    aria-label="Analyze Code with MGX"
                    tabIndex={0}
                  >
                    {isLoading ? t('mgx.loading') : 'Analyze Code with MGX'}
                  </button>
                  
                  {codeAnalysisResult && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded max-h-40 overflow-y-auto">
                      {codeAnalysisResult}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
        
        <Link
          href="https://mgx.dev/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-blue-500 hover:text-blue-700 transition-colors duration-300"
          aria-label={t('mgx.learnMore')}
          tabIndex={0}
        >
          {t('mgx.learnMore')}
        </Link>
      </div>
    </div>
  );
};

export default MGXIntegration;