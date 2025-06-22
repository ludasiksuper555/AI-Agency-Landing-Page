import { NextRequest } from 'next/server';

/**
 * Content Security Policy Configuration
 * Детальна конфігурація CSP для різних середовищ
 */

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'child-src': string[];
  'worker-src': string[];
  'frame-src': string[];
  'form-action': string[];
  'base-uri': string[];
  'manifest-src': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests': boolean;
  'block-all-mixed-content': boolean;
}

/**
 * Base CSP directives
 */
const baseDirectives: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Потрібно для Next.js в development
    "'unsafe-inline'", // Тимчасово для inline scripts
    'https://vercel.live',
    'https://va.vercel-scripts.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Потрібно для CSS-in-JS
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  'img-src': [
    "'self'",
    'blob:',
    'data:',
    'https:',
    'http:', // Тимчасово для development
    'https://images.unsplash.com',
    'https://via.placeholder.com',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
  'connect-src': [
    "'self'",
    'https://vercel.live',
    'https://vitals.vercel-insights.com',
    'https://www.google-analytics.com',
    'https://api.github.com',
    'wss://ws.pusher.com', // Для real-time функцій
    'ws://localhost:*', // Development WebSocket
    'wss://localhost:*',
  ],
  'media-src': ["'self'", 'blob:', 'data:'],
  'object-src': ["'none'"],
  'child-src': ["'self'", 'blob:'],
  'worker-src': ["'self'", 'blob:'],
  'frame-src': ["'self'", 'https://www.youtube.com', 'https://player.vimeo.com'],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': false, // Встановити в true для production
};

/**
 * Development CSP (більш м'які обмеження)
 */
const developmentDirectives: Partial<CSPDirectives> = {
  'script-src': [
    ...baseDirectives['script-src'],
    "'unsafe-eval'",
    "'unsafe-inline'",
    'http://localhost:*',
    'ws://localhost:*',
    'wss://localhost:*',
  ],
  'connect-src': [
    ...baseDirectives['connect-src'],
    'http://localhost:*',
    'ws://localhost:*',
    'wss://localhost:*',
  ],
  'img-src': [...baseDirectives['img-src'], 'http://localhost:*'],
  'block-all-mixed-content': false,
};

/**
 * Production CSP (суворі обмеження)
 */
const productionDirectives: Partial<CSPDirectives> = {
  'script-src': baseDirectives['script-src'].filter(
    src => !src.includes('unsafe-eval') && !src.includes('unsafe-inline')
  ),
  'style-src': ["'self'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
  'img-src': baseDirectives['img-src'].filter(src => src !== 'http:'),
  'connect-src': baseDirectives['connect-src'].filter(src => !src.includes('localhost')),
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true,
};

/**
 * Генерує nonce для inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Створює CSP header string
 */
export function buildCSPHeader(
  environment: 'development' | 'production' = 'production',
  nonce?: string
): string {
  const directives = {
    ...baseDirectives,
    ...(environment === 'development' ? developmentDirectives : productionDirectives),
  };

  const cspParts: string[] = [];

  // Додаємо nonce до script-src якщо надано
  if (nonce) {
    directives['script-src'] = [...directives['script-src'], `'nonce-${nonce}'`];
  }

  // Конвертуємо директиви в CSP string
  Object.entries(directives).forEach(([directive, values]) => {
    if (typeof values === 'boolean') {
      if (values) {
        cspParts.push(directive.replace(/([A-Z])/g, '-$1').toLowerCase());
      }
    } else if (Array.isArray(values) && values.length > 0) {
      const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
      cspParts.push(`${directiveName} ${values.join(' ')}`);
    }
  });

  return cspParts.join('; ');
}

/**
 * Отримує CSP конфігурацію для поточного середовища
 */
export function getCSPConfig(request?: NextRequest): {
  header: string;
  nonce?: string;
  reportUri?: string;
} {
  const environment = process.env.NODE_ENV === 'development' ? 'development' : 'production';
  const nonce = generateNonce();

  let header = buildCSPHeader(environment, nonce);

  // Додаємо report-uri для production
  if (environment === 'production') {
    const reportUri = '/api/security/csp-report';
    header += `; report-uri ${reportUri}`;

    return {
      header,
      nonce,
      reportUri,
    };
  }

  return {
    header,
    nonce,
  };
}

/**
 * CSP для специфічних сторінок
 */
export const pageSpecificCSP = {
  '/admin': {
    'script-src': ["'self'", "'unsafe-eval'"], // Адмін панель може потребувати eval
    'connect-src': ["'self'", 'https://api.admin-tools.com'],
  },
  '/api/upload': {
    'img-src': ["'self'", 'blob:', 'data:'],
    'media-src': ["'self'", 'blob:'],
  },
  '/embed': {
    'frame-ancestors': ['https://trusted-domain.com'], // Дозволити embedding
    'frame-src': ["'self'", 'https://trusted-iframe-source.com'],
  },
};

/**
 * Отримує CSP для конкретної сторінки
 */
export function getPageCSP(pathname: string, baseCSP: string): string {
  const pageConfig = pageSpecificCSP[pathname as keyof typeof pageSpecificCSP];

  if (!pageConfig) {
    return baseCSP;
  }

  // Модифікуємо базовий CSP для конкретної сторінки
  let modifiedCSP = baseCSP;

  Object.entries(pageConfig).forEach(([directive, values]) => {
    const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
    const regex = new RegExp(`${directiveName}\\s+[^;]+`, 'g');
    const newDirective = `${directiveName} ${values.join(' ')}`;

    if (modifiedCSP.includes(directiveName)) {
      modifiedCSP = modifiedCSP.replace(regex, newDirective);
    } else {
      modifiedCSP += `; ${newDirective}`;
    }
  });

  return modifiedCSP;
}

export default {
  generateNonce,
  buildCSPHeader,
  getCSPConfig,
  getPageCSP,
  baseDirectives,
  developmentDirectives,
  productionDirectives,
};
