# Локалізація проекту

## Вступ

Цей документ описує процес локалізації проекту AI Agency Landing Page для підтримки різних мов. Локалізація дозволяє адаптувати інтерфейс користувача та контент для різних регіонів та мовних груп, що розширює аудиторію проекту.

## Підтримувані мови

На даний момент проект підтримує наступні мови:

- Українська (uk) - основна мова
- Англійська (en)
- Німецька (de)
- Польська (pl)

## Структура локалізації

Для локалізації використовується бібліотека `next-i18next`. Файли перекладів розміщуються в директорії `public/locales/` за наступною структурою:

```
public/
  locales/
    uk/
      common.json
      home.json
      about.json
      contact.json
    en/
      common.json
      home.json
      about.json
      contact.json
    de/
      common.json
      home.json
      about.json
      contact.json
    pl/
      common.json
      home.json
      about.json
      contact.json
```

## Приклади файлів локалізації

### common.json (uk)

```json
{
  "header": {
    "home": "Головна",
    "about": "Про нас",
    "services": "Послуги",
    "team": "Команда",
    "contact": "Контакти",
    "login": "Увійти",
    "signup": "Зареєструватися",
    "logout": "Вийти"
  },
  "footer": {
    "company": "Компанія",
    "about": "Про нас",
    "careers": "Кар'єра",
    "blog": "Блог",
    "resources": "Ресурси",
    "documentation": "Документація",
    "tutorials": "Навчальні матеріали",
    "faq": "FAQ",
    "legal": "Правова інформація",
    "terms": "Умови використання",
    "privacy": "Політика конфіденційності",
    "cookies": "Політика використання файлів cookie",
    "copyright": "© {{year}} AI Agency. Всі права захищено."
  },
  "buttons": {
    "learnMore": "Дізнатися більше",
    "getStarted": "Почати",
    "submit": "Надіслати",
    "cancel": "Скасувати",
    "save": "Зберегти",
    "delete": "Видалити",
    "edit": "Редагувати",
    "view": "Переглянути",
    "download": "Завантажити",
    "upload": "Завантажити",
    "next": "Далі",
    "previous": "Назад"
  },
  "validation": {
    "required": "Це поле є обов'язковим",
    "email": "Будь ласка, введіть коректний email",
    "minLength": "Мінімальна довжина: {{length}} символів",
    "maxLength": "Максимальна довжина: {{length}} символів",
    "passwordMatch": "Паролі не співпадають"
  }
}
```

### common.json (en)

```json
{
  "header": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "team": "Team",
    "contact": "Contact",
    "login": "Log In",
    "signup": "Sign Up",
    "logout": "Log Out"
  },
  "footer": {
    "company": "Company",
    "about": "About",
    "careers": "Careers",
    "blog": "Blog",
    "resources": "Resources",
    "documentation": "Documentation",
    "tutorials": "Tutorials",
    "faq": "FAQ",
    "legal": "Legal",
    "terms": "Terms of Service",
    "privacy": "Privacy Policy",
    "cookies": "Cookie Policy",
    "copyright": "© {{year}} AI Agency. All rights reserved."
  },
  "buttons": {
    "learnMore": "Learn More",
    "getStarted": "Get Started",
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "download": "Download",
    "upload": "Upload",
    "next": "Next",
    "previous": "Previous"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email",
    "minLength": "Minimum length: {{length}} characters",
    "maxLength": "Maximum length: {{length}} characters",
    "passwordMatch": "Passwords do not match"
  }
}
```

### home.json (uk)

```json
{
  "hero": {
    "title": "Революційні AI-рішення для вашого бізнесу",
    "subtitle": "Підвищіть ефективність та інноваційність вашої компанії за допомогою наших AI-інструментів",
    "cta": "Почати безкоштовно"
  },
  "features": {
    "title": "Наші можливості",
    "subtitle": "Відкрийте для себе потужні функції нашої платформи",
    "items": {
      "dataAnalysis": {
        "title": "Аналіз даних",
        "description": "Потужні інструменти для аналізу великих обсягів даних"
      },
      "machineLearning": {
        "title": "Машинне навчання",
        "description": "Алгоритми машинного навчання для прогнозування та класифікації"
      },
      "automation": {
        "title": "Автоматизація",
        "description": "Автоматизуйте рутинні завдання та оптимізуйте робочі процеси"
      },
      "nlp": {
        "title": "Обробка природної мови",
        "description": "Аналіз та розуміння тексту на людській мові"
      }
    }
  },
  "testimonials": {
    "title": "Відгуки клієнтів",
    "subtitle": "Що кажуть наші клієнти про нашу платформу"
  },
  "pricing": {
    "title": "Тарифні плани",
    "subtitle": "Оберіть план, який найкраще відповідає вашим потребам",
    "monthly": "Щомісячно",
    "annually": "Щорічно",
    "plans": {
      "starter": {
        "name": "Стартовий",
        "price": "€29",
        "period": "/міс",
        "description": "Ідеально для малого бізнесу та стартапів"
      },
      "professional": {
        "name": "Професійний",
        "price": "€99",
        "period": "/міс",
        "description": "Для команд та бізнесу середнього розміру"
      },
      "enterprise": {
        "name": "Корпоративний",
        "price": "€299",
        "period": "/міс",
        "description": "Для великих компаній з розширеними потребами"
      }
    }
  },
  "faq": {
    "title": "Часті запитання",
    "subtitle": "Відповіді на найпоширеніші запитання"
  },
  "contact": {
    "title": "Зв'яжіться з нами",
    "subtitle": "Маєте питання? Ми завжди раді допомогти!",
    "form": {
      "name": "Ім'я",
      "email": "Email",
      "message": "Повідомлення",
      "submit": "Надіслати",
      "success": "Дякуємо! Ваше повідомлення успішно надіслано."
    }
  }
}
```

### home.json (en)

```json
{
  "hero": {
    "title": "Revolutionary AI Solutions for Your Business",
    "subtitle": "Enhance the efficiency and innovation of your company with our AI tools",
    "cta": "Start for Free"
  },
  "features": {
    "title": "Our Capabilities",
    "subtitle": "Discover the powerful features of our platform",
    "items": {
      "dataAnalysis": {
        "title": "Data Analysis",
        "description": "Powerful tools for analyzing large volumes of data"
      },
      "machineLearning": {
        "title": "Machine Learning",
        "description": "Machine learning algorithms for prediction and classification"
      },
      "automation": {
        "title": "Automation",
        "description": "Automate routine tasks and optimize workflows"
      },
      "nlp": {
        "title": "Natural Language Processing",
        "description": "Analysis and understanding of human language text"
      }
    }
  },
  "testimonials": {
    "title": "Customer Testimonials",
    "subtitle": "What our customers say about our platform"
  },
  "pricing": {
    "title": "Pricing Plans",
    "subtitle": "Choose the plan that best suits your needs",
    "monthly": "Monthly",
    "annually": "Annually",
    "plans": {
      "starter": {
        "name": "Starter",
        "price": "€29",
        "period": "/mo",
        "description": "Perfect for small businesses and startups"
      },
      "professional": {
        "name": "Professional",
        "price": "€99",
        "period": "/mo",
        "description": "For teams and medium-sized businesses"
      },
      "enterprise": {
        "name": "Enterprise",
        "price": "€299",
        "period": "/mo",
        "description": "For large companies with advanced needs"
      }
    }
  },
  "faq": {
    "title": "Frequently Asked Questions",
    "subtitle": "Answers to the most common questions"
  },
  "contact": {
    "title": "Contact Us",
    "subtitle": "Have questions? We're always happy to help!",
    "form": {
      "name": "Name",
      "email": "Email",
      "message": "Message",
      "submit": "Submit",
      "success": "Thank you! Your message has been successfully sent."
    }
  }
}
```

## Налаштування локалізації

### Конфігурація next-i18next

Для налаштування локалізації в проекті Next.js використовується файл `next-i18next.config.js`:

```javascript
module.exports = {
  i18n: {
    defaultLocale: 'uk',
    locales: ['uk', 'en', 'de', 'pl'],
    localeDetection: true,
  },
  localePath: './public/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
```

### Інтеграція з Next.js

Для інтеграції локалізації з Next.js необхідно оновити файл `next.config.js`:

```javascript
const { i18n } = require('./next-i18next.config');

module.exports = {
  i18n,
  // інші налаштування
};
```

### Використання в компонентах

Приклад використання локалізації в компоненті Header:

```tsx
import { useTranslation } from 'next-i18next';

interface HeaderProps {
  isAuthenticated?: boolean;
  userName?: string;
  logoUrl?: string;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isAuthenticated = false,
  userName = '',
  logoUrl = '/logo.svg',
  onLogout,
}) => {
  const { t } = useTranslation('common');

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="/" className="text-gray-700 hover:text-blue-600">
            {t('header.home')}
          </a>
          <a href="/about" className="text-gray-700 hover:text-blue-600">
            {t('header.about')}
          </a>
          <a href="/services" className="text-gray-700 hover:text-blue-600">
            {t('header.services')}
          </a>
          <a href="/team" className="text-gray-700 hover:text-blue-600">
            {t('header.team')}
          </a>
          <a href="/contact" className="text-gray-700 hover:text-blue-600">
            {t('header.contact')}
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-700">{userName}</span>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                {t('header.logout')}
              </button>
            </>
          ) : (
            <>
              <a
                href="/sign-in"
                className="text-gray-700 hover:text-blue-600"
              >
                {t('header.login')}
              </a>
              <a
                href="/sign-up"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {t('header.signup')}
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

## Перемикач мов

Для зміни мови інтерфейсу можна використовувати компонент LanguageSwitcher:

```tsx
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const router = useRouter();
  const { i18n } = useTranslation();

  const locales = {
    uk: 'Українська',
    en: 'English',
    de: 'Deutsch',
    pl: 'Polski',
  };

  const handleLanguageChange = (locale: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale });
  };

  return (
    <div className={`language-switcher ${className}`}>
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-white border border-gray-300 rounded px-2 py-1 text-sm"
      >
        {Object.keys(locales).map((locale) => (
          <option key={locale} value={locale}>
            {locales[locale]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
```

## Інтеграція з компонентом Footer

Приклад інтеграції перемикача мов з компонентом Footer:

```tsx
import { useTranslation } from 'next-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface FooterProps {
  // ... існуючі props
  showLanguageSwitcher?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  // ... існуючі props
  showLanguageSwitcher = true,
}) => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        {/* ... існуючий код */}
        
        <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">
            {t('footer.copyright', { year: currentYear })}
          </p>
          {showLanguageSwitcher && (
            <LanguageSwitcher className="mt-4 md:mt-0" />
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

## Локалізація сторінок

Для локалізації сторінок використовується функція `serverSideTranslations` з бібліотеки `next-i18next`:

```tsx
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const HomePage = () => {
  const { t } = useTranslation(['common', 'home']);

  return (
    <div className="landing-page">
      <Header />
      <Hero 
        title={t('home:hero.title')} 
        subtitle={t('home:hero.subtitle')} 
        ctaText={t('home:hero.cta')} 
        onCtaClick={() => {}} 
      />
      <Features 
        title={t('home:features.title')} 
        subtitle={t('home:features.subtitle')} 
        features={[
          {
            id: '1',
            title: t('home:features.items.dataAnalysis.title'),
            description: t('home:features.items.dataAnalysis.description'),
            icon: 'chart-bar'
          },
          {
            id: '2',
            title: t('home:features.items.machineLearning.title'),
            description: t('home:features.items.machineLearning.description'),
            icon: 'brain'
          },
          // Інші функції
        ]} 
      />
      <Testimonials 
        title={t('home:testimonials.title')} 
        subtitle={t('home:testimonials.subtitle')} 
        testimonials={[]} 
      />
      <Contact 
        title={t('home:contact.title')} 
        subtitle={t('home:contact.subtitle')} 
        onSubmit={() => {}} 
      />
      <Footer showLanguageSwitcher={true} />
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'uk', ['common', 'home'])),
    },
  };
};

export default HomePage;
```

## Локалізація динамічного контенту

Для локалізації динамічного контенту, який завантажується з API, можна використовувати наступний підхід:

```tsx
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  // інші поля
}

const BlogPage = () => {
  const { i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Передаємо поточну мову в API запит
        const response = await fetch(`/api/blog?locale=${i18n.language}`);
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [i18n.language]); // Повторно завантажуємо дані при зміні мови

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="blog-page">
      {/* Відображення постів */}
    </div>
  );
};

export default BlogPage;
```

## Найкращі практики локалізації

1. **Використовуйте ключі замість повних текстів**: Це спрощує підтримку та оновлення перекладів.

2. **Організуйте переклади за контекстом**: Розділіть переклади на логічні файли (common, home, about, тощо).

3. **Використовуйте параметри для динамічного контенту**: Наприклад, `t('welcome', { name: userName })`.

4. **Враховуйте особливості мов**: Деякі мови можуть потребувати різних форм для множини, роду тощо.

5. **Тестуйте локалізацію**: Переконайтеся, що всі тексти коректно відображаються на всіх підтримуваних мовах.

6. **Оптимізуйте завантаження перекладів**: Завантажуйте тільки ті переклади, які потрібні для поточної сторінки.

7. **Використовуйте інструменти для керування перекладами**: Розгляньте можливість використання спеціалізованих інструментів для керування перекладами, таких як Lokalise, Crowdin або POEditor.

## Висновок

Локалізація є важливою частиною розробки сучасних веб-додатків, яка дозволяє розширити аудиторію проекту та покращити користувацький досвід для людей з різних країн. Використовуючи описані в цьому документі підходи та інструменти, ви зможете ефективно реалізувати багатомовну підтримку в проекті AI Agency Landing Page.