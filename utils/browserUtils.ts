/**
 * Утиліти для оптимізації взаємодії з браузером
 * Частина інтеграції між Trae, GitHub, MGX та браузером
 */

import { logger } from './logger';

/**
 * Інтерфейс для налаштувань кешування
 */
interface CacheSettings {
  maxAge: number; // Максимальний час життя кешу в мілісекундах
  immutable?: boolean; // Чи є ресурс незмінним
  staleWhileRevalidate?: boolean; // Використовувати stale-while-revalidate стратегію
}

/**
 * Інтерфейс для метрик продуктивності
 */
interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  navigationStart: number; // Час початку навігації
}

/**
 * Реєстрація Service Worker для офлайн-функціональності та кешування
 * @returns Promise<boolean> Успішність реєстрації
 */
export const registerServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      logger.info('Service Worker registered', { scope: registration.scope });
      return true;
    } catch (error) {
      logger.error('Service Worker registration failed', { error });
      return false;
    }
  }
  return false;
};

/**
 * Налаштування кешування для різних типів ресурсів
 * @param resourceType Тип ресурсу ('image', 'script', 'style', 'font', 'data')
 * @returns Налаштування кешування для вказаного типу ресурсу
 */
export const getCacheSettings = (
  resourceType: 'image' | 'script' | 'style' | 'font' | 'data'
): CacheSettings => {
  const day = 24 * 60 * 60 * 1000;

  switch (resourceType) {
    case 'image':
      return { maxAge: 30 * day, immutable: true };
    case 'script':
      return { maxAge: 7 * day, immutable: false };
    case 'style':
      return { maxAge: 7 * day, immutable: false };
    case 'font':
      return { maxAge: 365 * day, immutable: true };
    case 'data':
      return { maxAge: 1 * day, staleWhileRevalidate: true };
    default:
      return { maxAge: 1 * day };
  }
};

/**
 * Збір метрик продуктивності веб-сторінки
 * @returns Об'єкт з метриками продуктивності або null, якщо API недоступне
 */
export const collectPerformanceMetrics = (): PerformanceMetrics | null => {
  if (!window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;

  // Базові метрики на основі Performance API
  const ttfb = timing.responseStart - timing.navigationStart;
  const navigationStart = timing.navigationStart;

  // Для LCP, FID і CLS потрібна підтримка Web Vitals API
  // Тут використовуємо заглушки, в реальному додатку слід використовувати web-vitals бібліотеку
  const lcp = 0;
  const fid = 0;
  const cls = 0;

  return {
    lcp,
    fid,
    cls,
    ttfb,
    navigationStart,
  };
};

/**
 * Надсилання метрик продуктивності до MGX для аналізу
 * @param metrics Метрики продуктивності
 * @param token Токен авторизації MGX
 * @returns Promise<boolean> Успішність надсилання метрик
 */
export const sendMetricsToMGX = async (
  metrics: PerformanceMetrics,
  _token: string
): Promise<boolean> => {
  try {
    // Тут буде реальний запит до API MGX для аналізу метрик
    logger.info('Sending performance metrics to MGX', { metrics });

    // Імітація успішного надсилання
    return true;
  } catch (error) {
    logger.error('Error sending metrics to MGX', { error });
    return false;
  }
};

/**
 * Оптимізація завантаження зображень через lazy loading
 * @param imageSelector CSS селектор для зображень
 */
export const setupLazyLoading = (imageSelector: string = 'img[data-src]'): void => {
  if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          if (lazyImage.dataset.src) {
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.removeAttribute('data-src');
            lazyImageObserver.unobserve(lazyImage);
          }
        }
      });
    });

    const lazyImages = document.querySelectorAll(imageSelector);
    lazyImages.forEach(image => {
      lazyImageObserver.observe(image);
    });
  } else {
    // Fallback для браузерів без підтримки IntersectionObserver
    const lazyImages = document.querySelectorAll(imageSelector);
    lazyImages.forEach(image => {
      const img = image as HTMLImageElement;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }
};

/**
 * Налаштування prefetching для ресурсів, які можуть знадобитися в майбутньому
 * @param resources Масив URL ресурсів для prefetching
 */
export const setupPrefetching = (resources: string[]): void => {
  if (document.readyState === 'complete') {
    resources.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  } else {
    window.addEventListener('load', () => {
      // Відкладаємо prefetching до завершення завантаження сторінки
      setTimeout(() => {
        resources.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        });
      }, 1000);
    });
  }
};

/**
 * Ініціалізація оптимізацій для браузера
 * @param options Опції ініціалізації
 */
export const initBrowserOptimizations = async (
  options: {
    enableServiceWorker?: boolean;
    enableLazyLoading?: boolean;
    prefetchResources?: string[];
    collectMetrics?: boolean;
    mgxToken?: string;
  } = {}
): Promise<void> => {
  const {
    enableServiceWorker = true,
    enableLazyLoading = true,
    prefetchResources = [],
    collectMetrics = true,
    mgxToken,
  } = options;

  // Реєстрація Service Worker
  if (enableServiceWorker) {
    await registerServiceWorker();
  }

  // Налаштування lazy loading для зображень
  if (enableLazyLoading) {
    setupLazyLoading();
  }

  // Налаштування prefetching для ресурсів
  if (prefetchResources.length > 0) {
    setupPrefetching(prefetchResources);
  }

  // Збір та надсилання метрик продуктивності
  if (collectMetrics && mgxToken) {
    window.addEventListener('load', async () => {
      // Відкладаємо збір метрик до повного завантаження сторінки
      setTimeout(async () => {
        const metrics = collectPerformanceMetrics();
        if (metrics && mgxToken) {
          await sendMetricsToMGX(metrics, mgxToken);
        }
      }, 3000);
    });
  }
};
