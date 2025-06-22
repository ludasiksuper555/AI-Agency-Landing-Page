# ♿ Accessibility (a11y)

**Приоритет**: 🔥 Высокий
**Время выполнения**: 4 часа
**Статус**: Критично для соответствия стандартам

---

## 📋 Цели компонента

1. Соответствие WCAG 2.1 AA стандартам
2. Поддержка скрин-ридеров
3. Навигация с клавиатуры
4. Высокий контраст и читаемость
5. Семантическая разметка

---

## 🔧 Настройка Accessibility

### Установка зависимостей

```bash
# Основные пакеты для a11y
npm install @axe-core/react react-focus-lock focus-trap-react
npm install --save-dev @axe-core/playwright eslint-plugin-jsx-a11y
npm install --save-dev @testing-library/jest-dom @testing-library/user-event

# Дополнительные утилиты
npm install react-aria @react-aria/utils @react-aria/focus
npm install @headlessui/react @heroicons/react
```

### ESLint конфигурация

**.eslintrc.js** (добавить):

```javascript
module.exports = {
  extends: [
    // ... существующие extends
    'plugin:jsx-a11y/recommended',
  ],
  plugins: [
    // ... существующие plugins
    'jsx-a11y',
  ],
  rules: {
    // A11y правила
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/media-has-caption': 'warn',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',
  },
};
```

---

## 🎯 Доступные компоненты

### Кнопка с полной поддержкой a11y

**components/AccessibleButton.tsx**:

```typescript
import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary'
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  srOnly?: string; // Screen reader only text
}

const AccessibleButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText = 'Loading...',
    srOnly,
    children,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <>
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
            <span className="sr-only">{loadingText}</span>
          </>
        )}
        {children}
        {srOnly && <span className="sr-only">{srOnly}</span>}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton, buttonVariants };
```

### Доступная форма

**components/AccessibleForm.tsx**:

```typescript
import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Input компонент
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const AccessibleInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, required, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          ).trim() || undefined}
          aria-required={required}
          {...props}
        />
        {helperText && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Textarea компонент
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const AccessibleTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, required, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          ).trim() || undefined}
          aria-required={required}
          {...props}
        />
        {helperText && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

export { AccessibleInput, AccessibleTextarea };
```

### Модальное окно с фокус-ловушкой

**components/AccessibleModal.tsx**:

```typescript
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FocusLock from 'react-focus-lock';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else {
      // Возвращаем фокус на предыдущий элемент при закрытии
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <FocusLock returnFocus={false}>
        <div
          ref={modalRef}
          className={cn(
            'relative w-full bg-white rounded-lg shadow-xl',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              onClick={onClose}
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </FocusLock>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AccessibleModal;
```

### Навигация с клавиатуры

**components/AccessibleNavigation.tsx**:

```typescript
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';

interface NavigationItem {
  href: string;
  label: string;
  children?: NavigationItem[];
}

interface AccessibleNavigationProps {
  items: NavigationItem[];
  className?: string;
}

const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({ items, className }) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState<{ [key: number]: boolean }>({});
  const navRef = useRef<HTMLElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent, index: number, item: NavigationItem) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case 'ArrowRight':
        if (item.children) {
          event.preventDefault();
          setIsOpen(prev => ({ ...prev, [index]: true }));
        }
        break;
      case 'ArrowLeft':
        if (item.children && isOpen[index]) {
          event.preventDefault();
          setIsOpen(prev => ({ ...prev, [index]: false }));
        }
        break;
      case 'Enter':
      case ' ':
        if (item.children) {
          event.preventDefault();
          setIsOpen(prev => ({ ...prev, [index]: !prev[index] }));
        }
        break;
      case 'Escape':
        setIsOpen({});
        setActiveIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && navRef.current) {
      const activeElement = navRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
      if (activeElement) {
        activeElement.focus();
      }
    }
  }, [activeIndex]);

  return (
    <nav
      ref={navRef}
      className={cn('relative', className)}
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className="flex space-x-4" role="menubar">
        {items.map((item, index) => {
          const isActive = router.pathname === item.href;
          const hasSubmenu = item.children && item.children.length > 0;
          const submenuOpen = isOpen[index];

          return (
            <li key={item.href} className="relative" role="none">
              {hasSubmenu ? (
                <button
                  type="button"
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  )}
                  data-index={index}
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={submenuOpen}
                  onKeyDown={(e) => handleKeyDown(e, index, item)}
                  onClick={() => setIsOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                >
                  {item.label}
                  <svg
                    className={cn(
                      'ml-1 h-4 w-4 transition-transform',
                      submenuOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  )}
                  data-index={index}
                  role="menuitem"
                  onKeyDown={(e) => handleKeyDown(e, index, item)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )}

              {/* Submenu */}
              {hasSubmenu && submenuOpen && (
                <ul
                  className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                  role="menu"
                  aria-label={`${item.label} submenu`}
                >
                  {item.children!.map((subItem) => (
                    <li key={subItem.href} role="none">
                      <Link
                        href={subItem.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        role="menuitem"
                        onClick={() => setIsOpen(prev => ({ ...prev, [index]: false }))}
                      >
                        {subItem.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default AccessibleNavigation;
```

---

## 🎨 Стили для доступности

### CSS утилиты

**styles/accessibility.css**:

```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus styles */
.focus-visible:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border {
    border-width: 2px;
  }

  .text-gray-500 {
    color: #000;
  }

  .bg-gray-100 {
    background-color: #fff;
    border: 1px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Dark mode accessibility */
@media (prefers-color-scheme: dark) {
  :root {
    --focus-ring: #60a5fa;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --bg-primary: #111827;
    --bg-secondary: #1f2937;
  }
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}

/* Focus indicators for different elements */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
a:focus-visible {
  outline: 2px solid var(--focus-ring, #3b82f6);
  outline-offset: 2px;
}

/* Ensure minimum touch target size */
button,
input[type='button'],
input[type='submit'],
input[type='reset'],
a {
  min-height: 44px;
  min-width: 44px;
}

/* Error states */
.error {
  border-color: #ef4444;
}

.error:focus {
  outline-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

/* Loading states */
.loading {
  cursor: wait;
}

.loading * {
  pointer-events: none;
}

/* Disabled states */
:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## 🧪 Тестирование доступности

### Автоматические тесты

**tests/accessibility.test.tsx**:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { AccessibleButton } from '../components/AccessibleButton';
import { AccessibleInput } from '../components/AccessibleForm';
import AccessibleModal from '../components/AccessibleModal';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('AccessibleButton', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton>Click me</AccessibleButton>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <AccessibleButton onClick={handleClick}>Click me</AccessibleButton>
      );

      const button = screen.getByRole('button', { name: 'Click me' });

      // Test keyboard navigation
      await user.tab();
      expect(button).toHaveFocus();

      // Test Enter key
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Test Space key
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should handle loading state correctly', async () => {
      render(
        <AccessibleButton loading loadingText="Processing...">
          Submit
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('AccessibleInput', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleInput
          label="Email"
          type="email"
          required
          helperText="Enter your email address"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleInput
          label="Email"
          type="email"
          required
          error="Email is required"
          helperText="Enter your email address"
        />
      );

      const input = screen.getByLabelText('Email *');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('should announce errors to screen readers', () => {
      render(
        <AccessibleInput
          label="Email"
          type="email"
          error="Email is required"
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Email is required');
    });
  });

  describe('AccessibleModal', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(
        <AccessibleModal
          isOpen={true}
          onClose={handleClose}
          title="Test Modal"
        >
          <button>First button</button>
          <button>Second button</button>
        </AccessibleModal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      const firstButton = screen.getByText('First button');
      const secondButton = screen.getByText('Second button');

      // Focus should be trapped within modal
      await user.tab();
      expect(closeButton).toHaveFocus();

      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();

      // Should cycle back to close button
      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(
        <AccessibleModal
          isOpen={true}
          onClose={handleClose}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Playwright тесты

**tests/e2e/accessibility.spec.ts**:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test('should not have accessibility violations on homepage', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus');
    await expect(firstFocusable).toBeVisible();

    // Test skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link:focus');
    if ((await skipLink.count()) > 0) {
      await expect(skipLink).toBeVisible();
    }
  });

  test('should work with screen reader', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should work with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Verify animations are disabled
    const animatedElements = page.locator('[class*="animate"]');
    const count = await animatedElements.count();

    for (let i = 0; i < count; i++) {
      const element = animatedElements.nth(i);
      const animationDuration = await element.evaluate(
        el => getComputedStyle(el).animationDuration
      );
      expect(animationDuration).toBe('0.01ms');
    }
  });
});
```

---

## 🚀 Команды для выполнения

```bash
# Установка зависимостей
npm install @axe-core/react react-focus-lock focus-trap-react
npm install --save-dev @axe-core/playwright eslint-plugin-jsx-a11y
npm install --save-dev @testing-library/jest-dom @testing-library/user-event
npm install react-aria @react-aria/utils @react-aria/focus

# Линтинг доступности
npx eslint . --ext .tsx,.ts --fix

# Тестирование доступности
npm run test -- tests/accessibility.test.tsx
npx playwright test tests/e2e/accessibility.spec.ts

# Аудит доступности
npx axe-core --dir ./out
```

---

## ✅ Критерии успеха

- [ ] WCAG 2.1 AA соответствие
- [ ] Навигация с клавиатуры работает
- [ ] Скрин-ридеры поддерживаются
- [ ] Фокус-ловушки функционируют
- [ ] Контрастность соответствует стандартам
- [ ] Семантическая разметка корректна
- [ ] RTL поддержка работает
- [ ] Все тесты проходят

---

## 📈 Метрики

- **WCAG соответствие**: AA уровень
- **Контрастность**: минимум 4.5:1
- **Размер touch targets**: минимум 44x44px
- **Время отклика**: < 100ms для фокуса
- **Покрытие тестами**: 100% компонентов
