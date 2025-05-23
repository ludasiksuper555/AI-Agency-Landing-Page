import React, { useEffect, createContext, useContext } from 'react';
import { ClerkProvider as ClerkProviderBase, enUS, ukUA, deDE, plPL } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

// Створення контексту для теми
interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ClerkProviderProps {
  children: React.ReactNode;
}

const ClerkProvider: React.FC<ClerkProviderProps> = ({ children }) => {
  const router = useRouter();
  const { i18n } = useTranslation('common', { useSuspense: false });
  const locale = router.locale || i18n?.language || 'uk';
  
  // Покращення взаємодії з браузером через оптимізацію завантаження
  useEffect(() => {
    // Попереднє завантаження важливих маршрутів для швидшої навігації
    router.prefetch('/');
    router.prefetch('/sign-in');
    router.prefetch('/sign-up');
    router.prefetch('/profile');
    router.prefetch('/dashboard');
  }, [router]);
  
  // Функція для отримання локалізації на основі поточної мови
  const getLocalization = () => {
    switch (locale) {
      case 'en': return enUS;
      case 'de': return deDE;
      case 'pl': return plPL;
      default: return ukUA;
    }
  };

  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  // Визначення теми на стороні клієнта
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Перевірка збереженої теми в localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          // Використовуємо збережену тему, якщо вона є і має коректне значення
          setTheme(savedTheme);
        } else {
          // Інакше використовуємо системну тему
          const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(isDarkMode ? 'dark' : 'light');
        }
        
        // Слухач змін теми
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          // Змінюємо тему тільки якщо користувач не встановив її вручну
          if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
          }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        
        return () => mediaQuery.removeEventListener('change', handleChange);
      } catch (error) {
        console.error('Помилка при ініціалізації теми:', error);
        // Встановлюємо світлу тему як запасний варіант
        setTheme('light');
      }
    }
  }, []);
  
  // Зберігаємо тему в localStorage при її зміні
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme', theme);
        
        // Оновлюємо атрибут data-theme на html елементі для глобальних стилів
        document.documentElement.setAttribute('data-theme', theme);
        
        // Додаємо або видаляємо клас dark для інтеграції з Tailwind CSS
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Помилка при збереженні теми:', error);
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ClerkProviderBase 
        localization={getLocalization()}
        appearance={{
          baseTheme: theme,
          elements: {
            formButtonPrimary: theme === 'dark' 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white',
            card: theme === 'dark' 
              ? 'rounded-lg shadow-none bg-gray-800 border border-gray-700' 
              : 'rounded-lg shadow-none',
            socialButtonsBlockButton: theme === 'dark' 
              ? 'border border-gray-700 hover:border-gray-600 bg-gray-800' 
              : 'border border-gray-300 hover:border-gray-400',
            formFieldInput: theme === 'dark' 
              ? 'rounded-md border-gray-700 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500' 
              : 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          },
        }}
      >
        {children}
      </ClerkProviderBase>
    </ThemeContext.Provider>
  );
};

export default ClerkProvider;