# 🌍 Internationalization (i18n)

**Приоритет**: 📈 Средний
**Время выполнения**: 3 часа
**Статус**: Важно для глобального использования

---

## 📋 Цели компонента

1. Настройка мультиязычности приложения
2. Локализация всех компонентов
3. Поддержка RTL (Right-to-Left) языков
4. Динамическое переключение языков

---

## 🔧 Настройка i18n

### Установка зависимостей

```bash
# Основные пакеты для i18n
npm install next-i18next react-i18next i18next
npm install --save-dev @types/react-i18next

# Дополнительные пакеты
npm install i18next-browser-languagedetector i18next-http-backend
```

### Конфигурация next-i18next

**next-i18next.config.js**:

```javascript
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'uk', 'ru', 'de', 'fr', 'es', 'ar', 'he'],
    localePath: './public/locales',
    localeDetection: true,
    domains: [
      {
        domain: 'example.com',
        defaultLocale: 'en',
      },
      {
        domain: 'example.ua',
        defaultLocale: 'uk',
      },
      {
        domain: 'example.ru',
        defaultLocale: 'ru',
      },
    ],
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  saveMissing: false,
  strictMode: true,
  serializeConfig: false,
  react: {
    useSuspense: false,
  },
};
```

### Обновление Next.js конфигурации

**next.config.js** (добавить):

```javascript
const { i18n } = require('./next-i18next.config');

module.exports = {
  i18n,
  // ... остальная конфигурация
};
```

---

## 📁 Структура локализации

### Создание директорий

```bash
# Создание структуры локалей
mkdir -p public/locales/en
mkdir -p public/locales/uk
mkdir -p public/locales/ru
mkdir -p public/locales/de
mkdir -p public/locales/fr
mkdir -p public/locales/es
mkdir -p public/locales/ar
mkdir -p public/locales/he
```

### Файлы переводов

**public/locales/en/common.json**:

```json
{
  "navigation": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "contact": "Contact",
    "login": "Login",
    "logout": "Logout",
    "profile": "Profile"
  },
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "previous": "Previous"
  },
  "forms": {
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "firstName": "First Name",
    "lastName": "Last Name",
    "phone": "Phone Number",
    "address": "Address",
    "city": "City",
    "country": "Country"
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "An error occurred",
    "loading": "Loading...",
    "noData": "No data available",
    "confirmDelete": "Are you sure you want to delete this item?"
  },
  "meta": {
    "title": "Your App Title",
    "description": "Your app description",
    "keywords": "keyword1, keyword2, keyword3"
  }
}
```

**public/locales/uk/common.json**:

```json
{
  "navigation": {
    "home": "Головна",
    "about": "Про нас",
    "services": "Послуги",
    "contact": "Контакти",
    "login": "Увійти",
    "logout": "Вийти",
    "profile": "Профіль"
  },
  "buttons": {
    "submit": "Надіслати",
    "cancel": "Скасувати",
    "save": "Зберегти",
    "delete": "Видалити",
    "edit": "Редагувати",
    "back": "Назад",
    "next": "Далі",
    "previous": "Попередній"
  },
  "forms": {
    "email": "Електронна пошта",
    "password": "Пароль",
    "confirmPassword": "Підтвердити пароль",
    "firstName": "Ім'я",
    "lastName": "Прізвище",
    "phone": "Номер телефону",
    "address": "Адреса",
    "city": "Місто",
    "country": "Країна"
  },
  "messages": {
    "success": "Операція виконана успішно",
    "error": "Сталася помилка",
    "loading": "Завантаження...",
    "noData": "Дані відсутні",
    "confirmDelete": "Ви впевнені, що хочете видалити цей елемент?"
  },
  "meta": {
    "title": "Назва вашого додатку",
    "description": "Опис вашого додатку",
    "keywords": "ключове слово1, ключове слово2, ключове слово3"
  }
}
```

**public/locales/ru/common.json**:

```json
{
  "navigation": {
    "home": "Главная",
    "about": "О нас",
    "services": "Услуги",
    "contact": "Контакты",
    "login": "Войти",
    "logout": "Выйти",
    "profile": "Профиль"
  },
  "buttons": {
    "submit": "Отправить",
    "cancel": "Отменить",
    "save": "Сохранить",
    "delete": "Удалить",
    "edit": "Редактировать",
    "back": "Назад",
    "next": "Далее",
    "previous": "Предыдущий"
  },
  "forms": {
    "email": "Электронная почта",
    "password": "Пароль",
    "confirmPassword": "Подтвердить пароль",
    "firstName": "Имя",
    "lastName": "Фамилия",
    "phone": "Номер телефона",
    "address": "Адрес",
    "city": "Город",
    "country": "Страна"
  },
  "messages": {
    "success": "Операция выполнена успешно",
    "error": "Произошла ошибка",
    "loading": "Загрузка...",
    "noData": "Данные отсутствуют",
    "confirmDelete": "Вы уверены, что хотите удалить этот элемент?"
  },
  "meta": {
    "title": "Название вашего приложения",
    "description": "Описание вашего приложения",
    "keywords": "ключевое слово1, ключевое слово2, ключевое слово3"
  }
}
```

---

## 🔧 Компоненты локализации

### Переключатель языков

**components/LanguageSwitcher.tsx**:

```typescript
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { ChevronDownIcon, GlobeIcon } from '@heroicons/react/24/outline';

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'he', name: 'עברית', flag: '🇮🇱', rtl: true },
];

const LanguageSwitcher: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === router.locale) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    const { pathname, asPath, query } = router;

    // Сохранить выбор языка в localStorage
    localStorage.setItem('preferredLanguage', languageCode);

    // Переключить язык
    await router.push({ pathname, query }, asPath, { locale: languageCode });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GlobeIcon className="w-4 h-4 mr-2" />
        <span className="mr-1">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDownIcon className="w-4 h-4 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-56 mt-2 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`${
                  language.code === router.locale
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700'
                } group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900`}
                role="menuitem"
                onClick={() => handleLanguageChange(language.code)}
                dir={language.rtl ? 'rtl' : 'ltr'}
              >
                <span className="mr-3">{language.flag}</span>
                <span>{language.name}</span>
                {language.code === router.locale && (
                  <span className="ml-auto text-indigo-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
```

### HOC для локализации

**lib/i18n/withTranslation.tsx**:

```typescript
import { GetStaticProps, GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const withTranslation = (
  namespaces: string[] = ['common'],
  getStaticProps?: GetStaticProps
): GetStaticProps => {
  return async context => {
    const locale = context.locale || 'en';

    const translations = await serverSideTranslations(locale, namespaces);

    if (getStaticProps) {
      const result = await getStaticProps(context);

      if ('props' in result) {
        return {
          ...result,
          props: {
            ...result.props,
            ...translations,
          },
        };
      }

      return result;
    }

    return {
      props: {
        ...translations,
      },
    };
  };
};

export const withSSRTranslation = (
  namespaces: string[] = ['common'],
  getServerSideProps?: GetServerSideProps
): GetServerSideProps => {
  return async context => {
    const locale = context.locale || 'en';

    const translations = await serverSideTranslations(locale, namespaces);

    if (getServerSideProps) {
      const result = await getServerSideProps(context);

      if ('props' in result) {
        return {
          ...result,
          props: {
            ...result.props,
            ...translations,
          },
        };
      }

      return result;
    }

    return {
      props: {
        ...translations,
      },
    };
  };
};
```

---

## 🔄 RTL поддержка

### RTL стили

**styles/rtl.css**:

```css
/* RTL поддержка */
[dir='rtl'] {
  direction: rtl;
  text-align: right;
}

[dir='rtl'] .rtl-flip {
  transform: scaleX(-1);
}

[dir='rtl'] .ml-2 {
  margin-left: 0;
  margin-right: 0.5rem;
}

[dir='rtl'] .mr-2 {
  margin-right: 0;
  margin-left: 0.5rem;
}

[dir='rtl'] .pl-4 {
  padding-left: 0;
  padding-right: 1rem;
}

[dir='rtl'] .pr-4 {
  padding-right: 0;
  padding-left: 1rem;
}

[dir='rtl'] .text-left {
  text-align: right;
}

[dir='rtl'] .text-right {
  text-align: left;
}

/* Tailwind RTL utilities */
@layer utilities {
  .rtl\:ml-2[dir='rtl'] {
    margin-left: 0;
    margin-right: 0.5rem;
  }

  .rtl\:mr-2[dir='rtl'] {
    margin-right: 0;
    margin-left: 0.5rem;
  }

  .rtl\:text-right[dir='rtl'] {
    text-align: right;
  }

  .rtl\:text-left[dir='rtl'] {
    text-align: left;
  }
}
```

### RTL компонент

**components/RTLProvider.tsx**:

```typescript
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface RTLProviderProps {
  children: React.ReactNode;
}

const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const router = useRouter();
  const isRTL = rtlLanguages.includes(router.locale || 'en');

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = router.locale || 'en';
  }, [isRTL, router.locale]);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
};

export default RTLProvider;
```

---

## 🔧 Утилиты локализации

### Форматирование дат

**lib/i18n/dateFormatter.ts**:

```typescript
import { useRouter } from 'next/router';

export const useDateFormatter = () => {
  const router = useRouter();
  const locale = router.locale || 'en';

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
  };
};
```

### Форматирование чисел и валют

**lib/i18n/numberFormatter.ts**:

```typescript
import { useRouter } from 'next/router';

export const useNumberFormatter = () => {
  const router = useRouter();
  const locale = router.locale || 'en';

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(number);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCompactNumber = (number: number) => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(number);
  };

  return {
    formatNumber,
    formatCurrency,
    formatPercent,
    formatCompactNumber,
  };
};
```

---

## 🧪 Тестирование локализации

### Тесты переводов

**tests/i18n.test.ts**:

```typescript
import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'public/locales');
const supportedLocales = ['en', 'uk', 'ru', 'de', 'fr', 'es', 'ar', 'he'];

describe('Internationalization', () => {
  describe('Translation files', () => {
    supportedLocales.forEach(locale => {
      it(`should have common.json for ${locale}`, () => {
        const filePath = path.join(localesDir, locale, 'common.json');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it(`should have valid JSON for ${locale}`, () => {
        const filePath = path.join(localesDir, locale, 'common.json');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
      });
    });
  });

  describe('Translation completeness', () => {
    const enTranslations = JSON.parse(
      fs.readFileSync(path.join(localesDir, 'en', 'common.json'), 'utf8')
    );

    const getKeys = (obj: any, prefix = ''): string[] => {
      let keys: string[] = [];
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys = keys.concat(getKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    };

    const enKeys = getKeys(enTranslations);

    supportedLocales
      .filter(locale => locale !== 'en')
      .forEach(locale => {
        it(`should have all keys for ${locale}`, () => {
          const translations = JSON.parse(
            fs.readFileSync(path.join(localesDir, locale, 'common.json'), 'utf8')
          );
          const localeKeys = getKeys(translations);

          enKeys.forEach(key => {
            expect(localeKeys).toContain(key);
          });
        });
      });
  });
});
```

---

## 🚀 Команды для выполнения

```bash
# Установка зависимостей
npm install next-i18next react-i18next i18next
npm install i18next-browser-languagedetector i18next-http-backend
npm install --save-dev @types/react-i18next

# Создание структуры локалей
mkdir -p public/locales/{en,uk,ru,de,fr,es,ar,he}

# Тестирование переводов
npm run test -- tests/i18n.test.ts

# Проверка RTL поддержки
npm run test -- tests/rtl.test.ts
```

---

## ✅ Критерии успеха

- [ ] Мультиязычность настроена
- [ ] Все компоненты локализованы
- [ ] RTL поддержка работает
- [ ] Переключение языков функционирует
- [ ] Форматирование дат/чисел корректно
- [ ] Все переводы полные
- [ ] Тесты проходят

---

## 📈 Метрики

- **Поддерживаемые языки**: 8
- **Покрытие переводов**: 100%
- **RTL языки**: 2 (арабский, иврит)
- **Время переключения языка**: < 500ms
- **SEO оптимизация**: Полная
