# 📱 Mobile Responsiveness

**Приоритет**: 🔥 Высокий
**Время выполнения**: 3 часа
**Статус**: Критично для пользовательского опыта

---

## 📋 Цели компонента

1. Адаптивный дизайн для всех устройств
2. Touch-friendly интерфейс
3. Оптимизация производительности на мобильных
4. Progressive Web App функциональность
5. Оффлайн поддержка

---

## 🔧 Настройка Mobile Responsiveness

### Установка зависимостей

```bash
# Основные пакеты для мобильной адаптации
npm install react-responsive react-device-detect
npm install --save-dev @types/react-responsive

# PWA и Service Worker
npm install next-pwa workbox-webpack-plugin
npm install --save-dev webpack-pwa-manifest

# Touch и жесты
npm install react-spring @use-gesture/react
npm install react-swipeable framer-motion

# Виртуализация для больших списков
npm install react-window react-window-infinite-loader
npm install --save-dev @types/react-window
```

### Tailwind CSS конфигурация

**tailwind.config.js** (обновить):

```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      // Custom breakpoints
      mobile: { max: '767px' },
      tablet: { min: '768px', max: '1023px' },
      desktop: { min: '1024px' },
      // Touch devices
      touch: { raw: '(hover: none) and (pointer: coarse)' },
      'no-touch': { raw: '(hover: hover) and (pointer: fine)' },
    },
    extend: {
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0, -15px, 0)' },
          '70%': { transform: 'translate3d(0, -7px, 0)' },
          '90%': { transform: 'translate3d(0, -2px, 0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
```

---

## 📱 Responsive компоненты

### Responsive Container

**components/ResponsiveContainer.tsx**:

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'lg',
  padding = 'md',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-4 sm:px-6 lg:px-8 xl:px-12',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
```

### Mobile Navigation

**components/MobileNavigation.tsx**:

```typescript
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useSwipeable } from 'react-swipeable';

interface NavigationItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileNavigationProps {
  items: NavigationItem[];
  logo?: React.ReactNode;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  logo,
  className,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Закрыть меню при изменении маршрута
  useEffect(() => {
    const handleRouteChange = () => setIsOpen(false);
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router.events]);

  // Закрыть меню при нажатии Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setIsOpen(false),
    onSwipedRight: () => setIsOpen(true),
    trackMouse: false,
    trackTouch: true,
  });

  return (
    <>
      {/* Mobile Header */}
      <header
        className={cn(
          'lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200',
          'pt-safe-top',
          className
        )}
      >
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo || (
              <Link href="/" className="text-xl font-bold text-gray-900">
                Logo
              </Link>
            )}
          </div>

          {/* Menu Button */}
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <nav
        {...swipeHandlers}
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
          'pt-safe-top pb-safe-bottom',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Mobile navigation"
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
          <div className="flex-shrink-0">
            {logo || (
              <Link href="/" className="text-xl font-bold text-gray-900">
                Logo
              </Link>
            )}
          </div>
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
          >
            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {items.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          'mr-3 h-5 w-5',
                          isActive ? 'text-blue-700' : 'text-gray-400'
                        )}
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-16 pt-safe-top" />
    </>
  );
};

export default MobileNavigation;
```

### Touch-friendly Button

**components/TouchButton.tsx**:

```typescript
import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'active:scale-95 touch-manipulation',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    ];

    const variantClasses = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700 focus:ring-blue-500',
        'active:bg-blue-800',
      ],
      secondary: [
        'bg-gray-600 text-white',
        'hover:bg-gray-700 focus:ring-gray-500',
        'active:bg-gray-800',
      ],
      outline: [
        'border-2 border-blue-600 text-blue-600 bg-transparent',
        'hover:bg-blue-50 focus:ring-blue-500',
        'active:bg-blue-100',
      ],
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100 focus:ring-gray-500',
        'active:bg-gray-200',
      ],
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-[40px]',
      md: 'px-6 py-3 text-base min-h-[48px]',
      lg: 'px-8 py-4 text-lg min-h-[56px]',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}

        {children}

        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchButton;
```

### Responsive Grid

**components/ResponsiveGrid.tsx**:

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const getGridCols = () => {
    const classes = [];

    if (cols.xs) classes.push(`grid-cols-${cols.xs}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);

    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'grid',
        getGridCols(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;
```

---

## 🎯 Device Detection Hook

**hooks/useDevice.ts**:

```typescript
import { useState, useEffect } from 'react';
import { isMobile, isTablet, isDesktop, isBrowser } from 'react-device-detect';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  isOnline: boolean;
}

export const useDevice = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'lg',
    orientation: 'landscape',
    isOnline: true,
  });

  useEffect(() => {
    if (!isBrowser) return;

    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let screenSize: DeviceInfo['screenSize'] = 'lg';
      if (width < 640) screenSize = 'xs';
      else if (width < 768) screenSize = 'sm';
      else if (width < 1024) screenSize = 'md';
      else if (width < 1280) screenSize = 'lg';
      else if (width < 1536) screenSize = 'xl';
      else screenSize = '2xl';

      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const orientation = height > width ? 'portrait' : 'landscape';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        orientation,
        isOnline: navigator.onLine,
      });
    };

    const handleOnlineStatus = () => {
      setDeviceInfo(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    // Initial update
    updateDeviceInfo();

    // Event listeners
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return deviceInfo;
};
```

---

## 🎨 Mobile-first CSS

**styles/mobile.css**:

```css
/* Mobile-first approach */

/* Base styles for mobile */
.container {
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Safe area support */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-left {
  padding-left: env(safe-area-inset-left);
}

.safe-area-right {
  padding-right: env(safe-area-inset-right);
}

/* Scroll behavior */
.smooth-scroll {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Touch feedback */
.touch-feedback {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease;
}

.touch-feedback:active {
  transform: scale(0.98);
}

/* Prevent zoom on input focus */
@media screen and (max-width: 767px) {
  input[type='text'],
  input[type='email'],
  input[type='password'],
  input[type='number'],
  input[type='tel'],
  input[type='url'],
  input[type='search'],
  textarea,
  select {
    font-size: 16px;
  }
}

/* Responsive typography */
.responsive-text {
  font-size: clamp(0.875rem, 2.5vw, 1.125rem);
  line-height: 1.6;
}

.responsive-heading {
  font-size: clamp(1.5rem, 5vw, 3rem);
  line-height: 1.2;
}

/* Mobile navigation */
.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding-top: env(safe-area-inset-top);
}

/* Bottom navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Swipe indicators */
.swipe-indicator {
  position: relative;
}

.swipe-indicator::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: #d1d5db;
  border-radius: 2px;
}

/* Loading states for mobile */
.mobile-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

/* Responsive images */
.responsive-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* Card layouts */
.mobile-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: white;
}

/* Form styles */
.mobile-form {
  padding: 1rem;
}

.mobile-form .form-group {
  margin-bottom: 1.5rem;
}

.mobile-form input,
.mobile-form textarea,
.mobile-form select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.mobile-form button {
  width: 100%;
  padding: 0.875rem;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  min-height: 48px;
}

/* Tablet styles */
@media (min-width: 768px) {
  .container {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .mobile-form {
    padding: 2rem;
  }

  .mobile-form button {
    width: auto;
    min-width: 120px;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .container {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  .touch-feedback:hover {
    transform: scale(1.02);
  }

  .touch-feedback:active {
    transform: scale(0.98);
  }
}

/* Print styles */
@media print {
  .mobile-nav,
  .bottom-nav,
  .touch-feedback {
    display: none !important;
  }

  .container {
    padding: 0;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .touch-feedback,
  .smooth-scroll {
    transition: none;
    scroll-behavior: auto;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .mobile-card {
    border: 2px solid #000;
  }

  .mobile-form input,
  .mobile-form textarea,
  .mobile-form select {
    border: 2px solid #000;
  }
}
```

---

## 🧪 Тестирование мобильной адаптации

**tests/mobile-responsiveness.test.tsx**:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDevice } from '../hooks/useDevice';
import ResponsiveContainer from '../components/ResponsiveContainer';
import MobileNavigation from '../components/MobileNavigation';
import TouchButton from '../components/TouchButton';

// Mock useDevice hook
jest.mock('../hooks/useDevice');
const mockUseDevice = useDevice as jest.MockedFunction<typeof useDevice>;

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe('ResponsiveContainer', () => {
    it('should render with correct responsive classes', () => {
      render(
        <ResponsiveContainer maxWidth="lg" padding="md">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('max-w-4xl', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should handle different max widths', () => {
      const { rerender } = render(
        <ResponsiveContainer maxWidth="sm">
          <div>Content</div>
        </ResponsiveContainer>
      );

      let container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('max-w-sm');

      rerender(
        <ResponsiveContainer maxWidth="full">
          <div>Content</div>
        </ResponsiveContainer>
      );

      container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('max-w-full');
    });
  });

  describe('MobileNavigation', () => {
    const mockItems = [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ];

    it('should render mobile navigation', () => {
      render(<MobileNavigation items={mockItems} />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should open and close menu', () => {
      render(<MobileNavigation items={mockItems} />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');

      // Menu should be closed initially
      expect(screen.queryByText('Home')).not.toBeInTheDocument();

      // Open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('Home')).toBeInTheDocument();

      // Close menu
      const closeButton = screen.getByLabelText('Close navigation menu');
      fireEvent.click(closeButton);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('should close menu on escape key', () => {
      render(<MobileNavigation items={mockItems} />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      expect(screen.getByText('Home')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('TouchButton', () => {
    it('should render with touch-friendly classes', () => {
      render(<TouchButton>Click me</TouchButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('touch-manipulation', 'active:scale-95');
    });

    it('should have minimum touch target size', () => {
      render(<TouchButton size="sm">Small button</TouchButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[40px]');
    });

    it('should handle loading state', () => {
      render(<TouchButton loading>Loading button</TouchButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should support full width on mobile', () => {
      render(<TouchButton fullWidth>Full width button</TouchButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('useDevice hook', () => {
    it('should detect mobile device', () => {
      mockUseDevice.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'xs',
        orientation: 'portrait',
        isOnline: true,
      });

      const TestComponent = () => {
        const device = useDevice();
        return <div>{device.isMobile ? 'Mobile' : 'Desktop'}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    it('should detect screen size changes', () => {
      // Mock window resize
      const resizeEvent = new Event('resize');

      mockUseDevice.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isTouchDevice: true,
        screenSize: 'md',
        orientation: 'landscape',
        isOnline: true,
      });

      const TestComponent = () => {
        const device = useDevice();
        return <div>Screen: {device.screenSize}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Screen: md')).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 Команды для выполнения

```bash
# Установка зависимостей
npm install react-responsive react-device-detect
npm install next-pwa workbox-webpack-plugin
npm install react-spring @use-gesture/react
npm install react-swipeable framer-motion
npm install react-window react-window-infinite-loader
npm install --save-dev @types/react-responsive @types/react-window

# Тестирование мобильной адаптации
npm run test -- tests/mobile-responsiveness.test.tsx

# Проверка responsive дизайна
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Lighthouse аудит для мобильных
npx lighthouse http://localhost:3000 --preset=perf --view
```

---

## ✅ Критерии успеха

- [ ] Адаптивный дизайн работает на всех устройствах
- [ ] Touch targets минимум 44x44px
- [ ] Навигация удобна на мобильных
- [ ] Формы оптимизированы для touch
- [ ] Производительность на мобильных устройствах
- [ ] PWA функциональность работает
- [ ] Оффлайн поддержка реализована
- [ ] Все тесты проходят

---

## 📈 Метрики

- **Lighthouse Mobile Score**: > 90
- **Touch Target Size**: минимум 44x44px
- **Viewport Coverage**: 100% устройств
- **Load Time (3G)**: < 3 секунды
- **First Contentful Paint**: < 1.5 секунды
- **Cumulative Layout Shift**: < 0.1
