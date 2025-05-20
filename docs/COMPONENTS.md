# Документація компонентів

## Вступ

Цей документ містить детальний опис компонентів, які використовуються в проекті AI Agency Landing Page. Тут ви знайдете інформацію про структуру компонентів, їх властивості (props), стани та приклади використання.

## Структура компонентів

Проект побудований за принципами атомарного дизайну, де компоненти поділяються на:

1. **Атоми** - найменші будівельні блоки (кнопки, поля введення, іконки)
2. **Молекули** - прості групи атомів (форми пошуку, картки)
3. **Організми** - складні групи молекул (навігаційні панелі, секції)
4. **Шаблони** - групи організмів, що формують сторінку
5. **Сторінки** - конкретні екземпляри шаблонів

## Основні компоненти

### Header

```typescript
import React from 'react';

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
  // Реалізація компонента
};

export default Header;
```

**Опис:**
Компонент Header відображає верхню навігаційну панель сайту. Він адаптивний і змінює свій вигляд залежно від стану аутентифікації користувача.

**Props:**
- `isAuthenticated` (boolean): Визначає, чи аутентифікований користувач
- `userName` (string): Ім'я користувача для відображення
- `logoUrl` (string): URL логотипу
- `onLogout` (function): Функція для виходу з системи

**Приклад використання:**

```tsx
<Header 
  isAuthenticated={true} 
  userName="John Doe" 
  onLogout={() => handleLogout()} 
/>
```

### Hero

```typescript
import React from 'react';

interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  backgroundImage = '/images/hero-bg.jpg',
  ctaText = 'Дізнатися більше',
  onCtaClick,
}) => {
  // Реалізація компонента
};

export default Hero;
```

**Опис:**
Компонент Hero відображає головну секцію сторінки з великим заголовком, підзаголовком та кнопкою заклику до дії (CTA).

**Props:**
- `title` (string): Головний заголовок
- `subtitle` (string): Підзаголовок або короткий опис
- `backgroundImage` (string): URL фонового зображення
- `ctaText` (string): Текст кнопки заклику до дії
- `onCtaClick` (function): Функція, яка викликається при натисканні на кнопку

**Приклад використання:**

```tsx
<Hero
  title="Революційні AI-рішення для вашого бізнесу"
  subtitle="Підвищіть ефективність та інноваційність вашої компанії за допомогою наших AI-інструментів"
  ctaText="Почати безкоштовно"
  onCtaClick={() => setShowModal(true)}
/>
```

### Features

```typescript
import React from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

const Features: React.FC<FeaturesProps> = ({
  title = 'Наші можливості',
  subtitle,
  features,
  columns = 3,
}) => {
  // Реалізація компонента
};

export default Features;
```

**Опис:**
Компонент Features відображає секцію з функціями або перевагами продукту у вигляді карток.

**Props:**
- `title` (string): Заголовок секції
- `subtitle` (string): Підзаголовок секції
- `features` (array): Масив об'єктів з інформацією про функції
- `columns` (number): Кількість колонок для відображення (2, 3 або 4)

**Приклад використання:**

```tsx
const featuresList = [
  {
    id: '1',
    title: 'Аналіз даних',
    description: 'Потужні інструменти для аналізу великих обсягів даних',
    icon: 'chart-bar'
  },
  {
    id: '2',
    title: 'Машинне навчання',
    description: 'Алгоритми машинного навчання для прогнозування та класифікації',
    icon: 'brain'
  },
  // Інші функції
];

<Features 
  title="Інноваційні можливості" 
  subtitle="Відкрийте для себе потужні функції нашої платформи" 
  features={featuresList} 
  columns={3} 
/>
```

### Testimonials

```typescript
import React from 'react';

interface Testimonial {
  id: string;
  name: string;
  position?: string;
  company?: string;
  content: string;
  avatar?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
}

interface TestimonialsProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  slidesToShow?: number;
}

const Testimonials: React.FC<TestimonialsProps> = ({
  title = 'Відгуки клієнтів',
  subtitle,
  testimonials,
  slidesToShow = 3,
}) => {
  // Реалізація компонента
};

export default Testimonials;
```

**Опис:**
Компонент Testimonials відображає карусель з відгуками клієнтів.

**Props:**
- `title` (string): Заголовок секції
- `subtitle` (string): Підзаголовок секції
- `testimonials` (array): Масив об'єктів з відгуками
- `slidesToShow` (number): Кількість відгуків, які відображаються одночасно

**Приклад використання:**

```tsx
const testimonialsList = [
  {
    id: '1',
    name: 'Олександр Петренко',
    position: 'CEO',
    company: 'Tech Solutions',
    content: 'Ця платформа повністю змінила наш підхід до аналізу даних. Рекомендую!',
    avatar: '/images/avatars/alex.jpg',
    rating: 5
  },
  // Інші відгуки
];

<Testimonials 
  title="Що кажуть наші клієнти" 
  subtitle="Відгуки від компаній, які вже використовують нашу платформу" 
  testimonials={testimonialsList} 
/>
```

### Contact

```typescript
import React from 'react';

interface ContactProps {
  title?: string;
  subtitle?: string;
  email?: string;
  phone?: string;
  address?: string;
  showMap?: boolean;
  mapLocation?: { lat: number; lng: number };
  onSubmit?: (formData: any) => void;
}

const Contact: React.FC<ContactProps> = ({
  title = 'Зв\'яжіться з нами',
  subtitle,
  email = 'contact@example.com',
  phone,
  address,
  showMap = true,
  mapLocation = { lat: 50.450001, lng: 30.523333 }, // Київ
  onSubmit,
}) => {
  // Реалізація компонента
};

export default Contact;
```

**Опис:**
Компонент Contact відображає контактну форму та інформацію для зв'язку.

**Props:**
- `title` (string): Заголовок секції
- `subtitle` (string): Підзаголовок секції
- `email` (string): Контактна електронна адреса
- `phone` (string): Контактний телефон
- `address` (string): Фізична адреса
- `showMap` (boolean): Чи відображати карту
- `mapLocation` (object): Координати для карти
- `onSubmit` (function): Функція для обробки відправки форми

**Приклад використання:**

```tsx
<Contact 
  title="Зв'яжіться з нашою командою" 
  subtitle="Маєте питання? Ми завжди раді допомогти!" 
  email="support@aiagency.com" 
  phone="+380 44 123 4567" 
  address="вул. Хрещатик, 1, Київ, 01001" 
  onSubmit={handleContactFormSubmit} 
/>
```

### Footer

```typescript
import React from 'react';

interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'github';
  url: string;
}

interface FooterLink {
  title: string;
  url: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  logo?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  copyright?: string;
  showLanguageSwitcher?: boolean;
  languages?: string[];
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

const Footer: React.FC<FooterProps> = ({
  logo = '/logo.svg',
  columns = [],
  socialLinks = [],
  copyright = `© ${new Date().getFullYear()} AI Agency. Всі права захищено.`,
  showLanguageSwitcher = false,
  languages = ['uk', 'en', 'de'],
  currentLanguage = 'uk',
  onLanguageChange,
}) => {
  // Реалізація компонента
};

export default Footer;
```

**Опис:**
Компонент Footer відображає нижню частину сторінки з посиланнями, соціальними мережами та іншою інформацією.

**Props:**
- `logo` (string): URL логотипу
- `columns` (array): Масив колонок з посиланнями
- `socialLinks` (array): Масив посилань на соціальні мережі
- `copyright` (string): Текст авторських прав
- `showLanguageSwitcher` (boolean): Чи відображати перемикач мов
- `languages` (array): Доступні мови
- `currentLanguage` (string): Поточна мова
- `onLanguageChange` (function): Функція для зміни мови

**Приклад використання:**

```tsx
const footerColumns = [
  {
    title: 'Компанія',
    links: [
      { title: 'Про нас', url: '/about' },
      { title: 'Кар\'єра', url: '/careers' },
      { title: 'Блог', url: '/blog' },
    ]
  },
  {
    title: 'Ресурси',
    links: [
      { title: 'Документація', url: '/docs' },
      { title: 'Навчальні матеріали', url: '/tutorials' },
      { title: 'FAQ', url: '/faq' },
    ]
  },
];

const socialLinks = [
  { platform: 'facebook', url: 'https://facebook.com/aiagency' },
  { platform: 'twitter', url: 'https://twitter.com/aiagency' },
  { platform: 'linkedin', url: 'https://linkedin.com/company/aiagency' },
];

<Footer 
  columns={footerColumns} 
  socialLinks={socialLinks} 
  showLanguageSwitcher={true} 
  onLanguageChange={(lang) => setLanguage(lang)} 
/>
```

## Кращі практики використання компонентів

### Композиція компонентів

Для створення складних інтерфейсів рекомендується використовувати композицію компонентів:

```tsx
<div className="landing-page">
  <Header isAuthenticated={isLoggedIn} userName={user.name} onLogout={handleLogout} />
  <Hero 
    title="Революційні AI-рішення" 
    subtitle="Підвищіть ефективність вашого бізнесу" 
    onCtaClick={handleHeroCta} 
  />
  <Features features={featuresData} />
  <Testimonials testimonials={testimonialsData} />
  <Pricing plans={pricingPlans} />
  <FAQ questions={faqData} />
  <Contact onSubmit={handleContactSubmit} />
  <Footer columns={footerColumns} socialLinks={socialLinks} />
</div>
```

### Адаптивний дизайн

Усі компоненти розроблені з урахуванням адаптивності. Для забезпечення коректного відображення на різних пристроях використовуйте класи Tailwind CSS:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {features.map(feature => (
    <FeatureCard key={feature.id} {...feature} />
  ))}
</div>
```

### Доступність (a11y)

Усі компоненти повинні відповідати стандартам доступності WCAG 2.1. Переконайтеся, що:

1. Усі інтерактивні елементи мають відповідні атрибути `aria-*`
2. Зображення мають атрибут `alt`
3. Колірний контраст відповідає вимогам
4. Компоненти доступні з клавіатури

```tsx
<button 
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  aria-label="Відкрити меню"
  tabIndex={0}
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <span className="sr-only">Відкрити меню</span>
  <MenuIcon className="h-6 w-6" />
</button>
```

## Тестування компонентів

Для тестування компонентів використовується Jest та React Testing Library. Приклад тесту для компонента Button:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button component', () => {
  test('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies correct styles for primary variant', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');
  });
});
```

## Внесення змін до компонентів

При внесенні змін до існуючих компонентів або створенні нових, дотримуйтесь наступних правил:

1. Зберігайте сумісність з існуючими props
2. Документуйте нові props та їх призначення
3. Оновлюйте тести для покриття нової функціональності
4. Дотримуйтесь стилістичних конвенцій проекту
5. Переконайтеся, що компонент адаптивний та доступний

## Додаткові ресурси

- [Storybook](https://storybook.js.org/) - для візуального тестування компонентів
- [React DevTools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html) - для налагодження компонентів
- [Axe](https://www.deque.com/axe/) - для перевірки доступності
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - для стилізації компонентів