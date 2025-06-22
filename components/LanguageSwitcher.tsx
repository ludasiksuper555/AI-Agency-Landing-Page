import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import React from 'react';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');

  const locales = {
    uk: t('language.uk', 'Українська'),
    en: t('language.en', 'English'),
    de: t('language.de', 'Deutsch'),
    pl: t('language.pl', 'Polski'),
  };

  const handleLanguageChange = (locale: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale });
  };

  return (
    <div className={`language-switcher ${className}`}>
      <select
        value={router.locale || i18n.language || 'uk'}
        onChange={e => handleLanguageChange(e.target.value)}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm dark:text-gray-200"
        aria-label={t('language.change', 'Змінити мову')}
      >
        {Object.entries(locales).map(([locale, name]) => (
          <option key={locale} value={locale}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
