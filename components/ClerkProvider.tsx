import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect } from 'react';

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
  // Localization removed - using default Clerk localization

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
    return undefined;
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

  // Возвращаем ThemeContext Provider
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export default ClerkProvider;
