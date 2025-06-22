/** @type {import('next').NextConfig} */
const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Основные настройки
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  // Экспериментальные функции
  experimental: {
    // Включить новый App Router (если используется Next.js 13+)
    appDir: false,
    // Оптимизация сборки
    optimizeCss: true,
    // Улучшенная обработка изображений
    images: {
      allowFutureImage: true,
    },
    // Серверные компоненты
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    // Турбо режим
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Настройки изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost', 'example.com', 'images.unsplash.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Настройки TypeScript
  typescript: {
    // Игнорировать ошибки TypeScript во время сборки (не рекомендуется для продакшена)
    ignoreBuildErrors: false,
  },

  // Настройки ESLint
  eslint: {
    // Игнорировать ошибки ESLint во время сборки (не рекомендуется для продакшена)
    ignoreDuringBuilds: false,
    dirs: ['pages', 'components', 'lib', 'src'],
  },

  // Переменные окружения
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Публичные переменные времени выполнения
  publicRuntimeConfig: {
    // Будут доступны как на сервере, так и на клиенте
    staticFolder: '/static',
  },

  // Приватные переменные времени выполнения
  serverRuntimeConfig: {
    // Будут доступны только на сервере
    mySecret: 'secret',
    secondSecret: process.env.SECOND_SECRET,
  },

  // Настройки Webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Алиасы для путей
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
      '@/constants': path.resolve(__dirname, 'src/constants'),
      '@/config': path.resolve(__dirname, 'src/config'),
    };

    // Обработка SVG файлов
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    // Оптимизации для продакшена
    if (!dev && !isServer) {
      // Разделение кода
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }

    // Анализ бандла (раскомментировать для анализа)
    // if (process.env.ANALYZE === 'true') {
    //   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    //   config.plugins.push(
    //     new BundleAnalyzerPlugin({
    //       analyzerMode: 'static',
    //       openAnalyzer: false,
    //     })
    //   );
    // }

    return config;
  },

  // Настройки заголовков
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // Перенаправления
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ];
  },

  // Перезаписи
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://external-api.com/:path*',
      },
    ];
  },

  // Настройки трейлинг слэша
  trailingSlash: false,

  // Настройки базового пути
  // basePath: '/my-app',

  // Настройки Asset Prefix
  // assetPrefix: 'https://cdn.example.com',

  // Настройки интернационализации
  // i18n: {
  //   locales: ['en', 'fr', 'de'],
  //   defaultLocale: 'en',
  //   domains: [
  //     {
  //       domain: 'example.com',
  //       defaultLocale: 'en',
  //     },
  //     {
  //       domain: 'example.fr',
  //       defaultLocale: 'fr',
  //     },
  //   ],
  // },

  // Настройки вывода
  output: 'standalone',

  // Настройки сжатия
  compress: true,

  // Настройки DevIndicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Настройки для статического экспорта
  // exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
  //   return {
  //     '/': { page: '/' },
  //     '/about': { page: '/about' },
  //   };
  // },

  // Настройки для AMP
  // amp: {
  //   canonicalBase: 'https://example.com',
  // },
};

// Обертка для Sentry (раскомментировать если используется Sentry)
// module.exports = withSentryConfig(nextConfig, {
//   silent: true,
//   org: 'your-org',
//   project: 'your-project',
// }, {
//   widenClientFileUpload: true,
//   transpileClientSDK: true,
//   tunnelRoute: '/monitoring',
//   hideSourceMaps: true,
//   disableLogger: true,
// });

module.exports = nextConfig;
