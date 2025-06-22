import React, { createContext, useContext, useEffect, useState } from 'react';

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

interface MockClerkProviderProps {
  children: React.ReactNode;
}

const MockClerkProvider: React.FC<MockClerkProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Визначення теми на стороні клієнта
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Перевірка збереженої теми в localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setTheme(savedTheme);
        } else {
          // Визначення системної теми
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(prefersDark ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('Error accessing localStorage for theme:', error);
        setTheme('light'); // Fallback to light theme
      }
    }
  }, []);

  // Збереження теми в localStorage при зміні
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme', theme);
        // Додавання класу до документа для CSS
        document.documentElement.setAttribute('data-theme', theme);
      } catch (error) {
        console.warn('Error saving theme to localStorage:', error);
      }
    }
  }, [theme]);

  // Слухач зміни системної теми
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Оновлюємо тему тільки якщо користувач не встановив власну
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`theme-${theme}`} data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default MockClerkProvider;
