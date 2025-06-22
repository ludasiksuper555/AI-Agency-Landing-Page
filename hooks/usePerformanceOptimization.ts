import { useEffect } from 'react';

const usePerformanceOptimization = () => {
  useEffect(() => {
    // Оптимизация загрузки изображений
    if ('loading' in HTMLImageElement.prototype) {
      const images = document.querySelectorAll('img[loading="lazy"]');
      images.forEach(img => {
        if (img instanceof HTMLImageElement) {
          img.loading = 'lazy';
        }
      });
    }

    // Оптимизация для предварительной загрузки критических ресурсов
    const preloadLinks = () => {
      const links = [
        // Добавьте здесь пути к критическим ресурсам, которые нужно предзагрузить
        // Например: '/api/critical-data', '/images/hero.webp'
      ];

      links.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    };

    preloadLinks();

    // Оптимизация для Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Оптимизация для Web Vitals
    const observeWebVitals = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            console.log('Performance entry:', entry);
          });
        });
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      }
    };

    observeWebVitals();
  }, []);
};

export { usePerformanceOptimization };
