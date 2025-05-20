# Оптимізація продуктивності

## Вступ

Цей документ містить рекомендації та найкращі практики для оптимізації продуктивності проекту AI Agency Landing Page. Впровадження цих рекомендацій допоможе покращити швидкість завантаження, відображення та взаємодії з користувачем.

## Оптимізація зображень

### Рекомендації

1. **Використання сучасних форматів зображень**
   - Використовуйте WebP замість JPEG та PNG для зменшення розміру файлів на 25-35%
   - Для підтримки старих браузерів використовуйте тег `<picture>` з fallback на JPEG/PNG

2. **Адаптивні зображення**
   - Використовуйте атрибути `srcset` та `sizes` для завантаження зображень відповідно до розміру екрану
   - Приклад:
     ```html
     <img 
       src="image-800w.jpg" 
       srcset="image-400w.jpg 400w, image-800w.jpg 800w, image-1200w.jpg 1200w" 
       sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
       alt="Опис зображення"
     />
     ```

3. **Lazy Loading**
   - Використовуйте атрибут `loading="lazy"` для зображень, які знаходяться поза областю видимості
   - Для старих браузерів використовуйте бібліотеку Intersection Observer API

## Оптимізація JavaScript

### Рекомендації

1. **Code Splitting**
   - Розділіть JavaScript код на менші частини за допомогою динамічного імпорту
   - Використовуйте `React.lazy()` та `Suspense` для компонентів, які не потрібні при початковому завантаженні
   - Приклад:
     ```jsx
     import React, { Suspense, lazy } from 'react';
     
     const HeavyComponent = lazy(() => import('./HeavyComponent'));
     
     function App() {
       return (
         <div>
           <Suspense fallback={<div>Завантаження...</div>}>
             <HeavyComponent />
           </Suspense>
         </div>
       );
     }
     ```

2. **Мінімізація розміру бандлу**
   - Використовуйте Tree Shaking для видалення невикористаного коду
   - Аналізуйте розмір бандлу за допомогою інструментів, таких як `webpack-bundle-analyzer`
   - Замініть великі бібліотеки на легші альтернативи (наприклад, `date-fns` замість `moment`)

3. **Оптимізація рендерингу React**
   - Використовуйте `React.memo()` для запобігання непотрібних перерендерів функціональних компонентів
   - Використовуйте `useMemo()` та `useCallback()` для кешування обчислень та функцій
   - Приклад:
     ```jsx
     import React, { useMemo, useCallback } from 'react';
     
     function ExpensiveComponent({ data, onItemClick }) {
       // Кешуємо результат обчислення
       const processedData = useMemo(() => {
         return data.map(item => ({ ...item, processed: true }));
       }, [data]);
     
       // Кешуємо функцію обробки кліку
       const handleClick = useCallback((id) => {
         onItemClick(id);
       }, [onItemClick]);
     
       return (
         <ul>
           {processedData.map(item => (
             <li key={item.id} onClick={() => handleClick(item.id)}>
               {item.name}
             </li>
           ))}
         </ul>
       );
     }
     
     // Запобігаємо перерендеру, якщо пропси не змінилися
     export default React.memo(ExpensiveComponent);
     ```

## Оптимізація CSS

### Рекомендації

1. **Видалення невикористаних стилів**
   - Використовуйте PurgeCSS для видалення невикористаних CSS класів
   - Налаштуйте Tailwind CSS для включення тільки використовуваних класів

2. **Критичний CSS**
   - Вбудовуйте критичні стилі безпосередньо в HTML для прискорення першого відображення
   - Використовуйте інструменти, такі як `critical` або `critters`

3. **CSS-in-JS оптимізації**
   - Використовуйте статичну екстракцію стилів, якщо можливо
   - Мінімізуйте динамічні стилі, які залежать від пропсів

## Оптимізація Next.js

### Рекомендації

1. **Статична генерація (SSG)**
   - Використовуйте `getStaticProps` та `getStaticPaths` для сторінок, які можуть бути попередньо згенеровані
   - Приклад:
     ```jsx
     export async function getStaticProps() {
       const data = await fetchData();
       return {
         props: { data },
         revalidate: 60 // Оновлення кожну хвилину (ISR)
       };
     }
     ```

2. **Інкрементальна статична регенерація (ISR)**
   - Використовуйте параметр `revalidate` для оновлення статичних сторінок через певний час

3. **Оптимізація зображень Next.js**
   - Використовуйте компонент `next/image` для автоматичної оптимізації зображень
   - Приклад:
     ```jsx
     import Image from 'next/image';
     
     function Hero() {
       return (
         <div>
           <Image
             src="/hero-image.jpg"
             alt="Hero Image"
             width={1200}
             height={600}
             priority // Для зображень у видимій області
           />
         </div>
       );
     }
     ```

## Оптимізація завантаження шрифтів

### Рекомендації

1. **Використання локальних шрифтів**
   - Зберігайте шрифти локально замість завантаження з Google Fonts
   - Використовуйте `font-display: swap` для відображення тексту до завантаження шрифту

2. **Підмножини шрифтів**
   - Використовуйте підмножини шрифтів для включення тільки необхідних символів
   - Для кириличних шрифтів використовуйте підмножину `cyrillic`

3. **Preload важливих шрифтів**
   - Використовуйте `<link rel="preload">` для критичних шрифтів
   - Приклад:
     ```html
     <link 
       rel="preload" 
       href="/fonts/roboto-v20-cyrillic-regular.woff2" 
       as="font" 
       type="font/woff2" 
       crossorigin
     />
     ```

## Оптимізація API запитів

### Рекомендації

1. **Кешування даних**
   - Використовуйте React Query або SWR для кешування та повторного використання даних
   - Приклад з SWR:
     ```jsx
     import useSWR from 'swr';
     
     function Profile() {
       const { data, error } = useSWR('/api/user', fetcher, {
         revalidateOnFocus: false,
         dedupingInterval: 60000
       });
     
       if (error) return <div>Помилка завантаження</div>;
       if (!data) return <div>Завантаження...</div>;
     
       return <div>Привіт, {data.name}!</div>;
     }
     ```

2. **Пакетна обробка запитів**
   - Об'єднуйте кілька запитів в один для зменшення кількості HTTP запитів

3. **Оптимізація розміру відповіді**
   - Використовуйте GraphQL для отримання тільки необхідних даних
   - Стискайте відповіді за допомогою gzip або brotli

## Моніторинг продуктивності

### Інструменти

1. **Lighthouse**
   - Регулярно запускайте Lighthouse для аналізу продуктивності, доступності та SEO
   - Інтегруйте Lighthouse в CI/CD для автоматичного моніторингу

2. **Web Vitals**
   - Відстежуйте Core Web Vitals (LCP, FID, CLS) за допомогою бібліотеки `web-vitals`
   - Приклад:
     ```jsx
     import { getCLS, getFID, getLCP } from 'web-vitals';
     
     function sendToAnalytics({ name, delta, id }) {
       // Відправка метрик в аналітику
       console.log({ name, delta, id });
     }
     
     getCLS(sendToAnalytics);
     getFID(sendToAnalytics);
     getLCP(sendToAnalytics);
     ```

3. **Performance API**
   - Використовуйте браузерний Performance API для вимірювання часу виконання критичних операцій

## Чек-лист оптимізації

- [ ] Оптимізовані зображення (формат, розмір, lazy loading)
- [ ] Налаштований code splitting та динамічний імпорт
- [ ] Мінімізований розмір JavaScript бандлу
- [ ] Оптимізовані React компоненти (memo, useMemo, useCallback)
- [ ] Видалені невикористані CSS стилі
- [ ] Налаштований критичний CSS
- [ ] Використання статичної генерації для відповідних сторінок
- [ ] Оптимізовані шрифти (локальні, підмножини, preload)
- [ ] Налаштоване кешування API запитів
- [ ] Налаштований моніторинг Core Web Vitals

## Додаткові ресурси

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/performance)
- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)
- [Tailwind CSS Optimization](https://tailwindcss.com/docs/optimizing-for-production)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)