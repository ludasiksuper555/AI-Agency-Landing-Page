import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useMediaQuery } from './useMediaQuery';
import { useMounted } from './useMounted';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

type ThemeConfig = {
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
  value?: Record<string, string>;
};

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: ResolvedTheme;
  themes: string[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook for managing theme state
 * @param config - Theme configuration
 * @returns Theme state and controls
 */
export function useTheme(config: ThemeConfig = {}): ThemeContextType {
  const {
    attribute = 'data-theme',
    defaultTheme = 'system',
    enableSystem = true,
    disableTransitionOnChange = false,
    storageKey = 'theme',
    themes = ['light', 'dark'],
    value = {},
  } = config;

  const mounted = useMounted();
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const systemTheme: ResolvedTheme = prefersDark ? 'dark' : 'light';

  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);
  const [theme, setThemeState] = useState<Theme>(storedTheme);

  // Resolve the actual theme (convert 'system' to 'light' or 'dark')
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : (theme as ResolvedTheme);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    // Disable transitions temporarily if requested
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          '*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
        )
      );
      document.head.appendChild(css);

      // Force reflow
      (() => window.getComputedStyle(body))();

      // Re-enable transitions
      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    }

    // Set attribute
    const themeValue = value[resolvedTheme] || resolvedTheme;
    root.setAttribute(attribute, themeValue);

    // Set class for compatibility
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    // Set CSS custom property
    root.style.setProperty('--theme', resolvedTheme);

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme, resolvedTheme, systemTheme },
      })
    );
  }, [mounted, theme, resolvedTheme, systemTheme, attribute, value, disableTransitionOnChange]);

  // Update theme
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      setStoredTheme(newTheme);
    },
    [setStoredTheme]
  );

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      setTheme(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, systemTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    systemTheme,
    themes,
  };
}

/**
 * Hook to access theme context
 * @returns Theme context
 */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Simple theme hook without context
 * @returns Basic theme state and controls
 */
export function useSimpleTheme() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [theme, setStoredTheme] = useLocalStorage<'light' | 'dark' | 'auto'>('theme', 'auto');

  const resolvedTheme = theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme;
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;

    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }, [mounted, resolvedTheme]);

  const setTheme = useCallback(
    (newTheme: 'light' | 'dark' | 'auto') => {
      setStoredTheme(newTheme);
    },
    [setStoredTheme]
  );

  const toggleTheme = useCallback(() => {
    if (theme === 'auto') {
      setTheme(prefersDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, prefersDark, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}

/**
 * Hook for theme-aware styling
 * @param lightStyles - Styles for light theme
 * @param darkStyles - Styles for dark theme
 * @returns Current theme styles
 */
export function useThemeStyles<T>(lightStyles: T, darkStyles: T): T {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkStyles : lightStyles;
}

/**
 * Hook for conditional rendering based on theme
 * @returns Theme state booleans
 */
export function useThemeState() {
  const { theme, resolvedTheme, systemTheme } = useTheme();

  return {
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
    isSystemDark: systemTheme === 'dark',
    isSystemLight: systemTheme === 'light',
    theme,
    resolvedTheme,
    systemTheme,
  };
}

/**
 * Hook for theme-aware values
 * @param lightValue - Value for light theme
 * @param darkValue - Value for dark theme
 * @returns Current theme value
 */
export function useThemeValue<T>(lightValue: T, darkValue: T): T {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkValue : lightValue;
}

/**
 * Hook for listening to theme changes
 * @param callback - Function to call when theme changes
 */
export function useThemeEffect(callback: (theme: ResolvedTheme) => void) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    callback(resolvedTheme);
  }, [resolvedTheme, callback]);
}

/**
 * Hook for getting theme-specific CSS variables
 * @returns CSS variables object
 */
export function useThemeVariables() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const [variables, setVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const themeVariables: Record<string, string> = {};

    // Get all CSS custom properties
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      if (property.startsWith('--')) {
        themeVariables[property] = computedStyle.getPropertyValue(property).trim();
      }
    }

    setVariables(themeVariables);
  }, [mounted, resolvedTheme]);

  return variables;
}

/**
 * Hook for theme persistence across page reloads
 * @param key - Storage key
 * @returns Theme persistence utilities
 */
export function useThemePersistence(key: string = 'app-theme') {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // Save theme to multiple storage locations
  useEffect(() => {
    if (!mounted) return;

    // localStorage
    localStorage.setItem(key, theme);

    // sessionStorage
    sessionStorage.setItem(key, theme);

    // Cookie for SSR
    document.cookie = `${key}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [mounted, theme, key]);

  // Restore theme on mount
  useEffect(() => {
    if (!mounted) return;

    const savedTheme = localStorage.getItem(key) as Theme;
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
  }, [mounted, key, theme, setTheme]);

  return { theme, setTheme };
}

/**
 * Hook for automatic theme switching based on time
 * @param lightHour - Hour to switch to light theme (0-23)
 * @param darkHour - Hour to switch to dark theme (0-23)
 */
export function useAutoTheme(lightHour: number = 6, darkHour: number = 18) {
  const { setTheme } = useTheme();
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;

    const checkTime = () => {
      const hour = new Date().getHours();
      if (hour >= lightHour && hour < darkHour) {
        setTheme('light');
      } else {
        setTheme('dark');
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [mounted, lightHour, darkHour, setTheme]);
}

/**
 * Theme Provider Component Props
 */
export type ThemeProviderProps = {
  children: React.ReactNode;
  config?: ThemeConfig;
};

/**
 * Theme Provider Component
 */
export function ThemeProvider({ children, config = {} }: ThemeProviderProps) {
  const themeValue = useTheme(config);

  return React.createElement(ThemeContext.Provider, { value: themeValue }, children);
}

/**
 * Utility function to get theme from cookies (for SSR)
 * @param cookies - Cookie string
 * @param key - Theme key
 * @returns Theme value
 */
export function getThemeFromCookies(cookies: string, key: string = 'theme'): Theme | null {
  const match = cookies.match(new RegExp(`(^| )${key}=([^;]+)`));
  return match ? (match[2] as Theme) : null;
}
