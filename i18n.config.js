/**
 * Enhanced Team Portfolio - Internationalization Configuration
 * Multi-language support and localization settings
 */

const i18nConfig = {
  // =============================================================================
  // BASIC I18N SETTINGS
  // =============================================================================

  // Default language
  defaultLocale: 'en',

  // Fallback language when translation is missing
  fallbackLocale: 'en',

  // Supported locales
  locales: [
    'en', // English
    'uk', // Ukrainian
    'es', // Spanish
    'fr', // French
    'de', // German
    'it', // Italian
    'pt', // Portuguese
    'ru', // Russian
    'pl', // Polish
    'nl', // Dutch
    'sv', // Swedish
    'da', // Danish
    'no', // Norwegian
    'fi', // Finnish
    'ja', // Japanese
    'ko', // Korean
    'zh', // Chinese (Simplified)
    'zh-TW', // Chinese (Traditional)
    'ar', // Arabic
    'he', // Hebrew
    'hi', // Hindi
    'th', // Thai
    'vi', // Vietnamese
    'tr', // Turkish
    'cs', // Czech
    'sk', // Slovak
    'hu', // Hungarian
    'ro', // Romanian
    'bg', // Bulgarian
    'hr', // Croatian
    'sr', // Serbian
    'sl', // Slovenian
    'et', // Estonian
    'lv', // Latvian
    'lt', // Lithuanian
  ],

  // Locale detection strategy
  detection: {
    // Order of detection methods
    order: ['cookie', 'header', 'querystring', 'path', 'subdomain'],

    // Cookie settings
    cookie: {
      name: 'team-portfolio-locale',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },

    // Header detection
    header: {
      name: 'Accept-Language',
    },

    // Query string parameter
    querystring: {
      name: 'lang',
    },

    // Path detection
    path: {
      enabled: true,
      segment: 0, // First segment of path
    },

    // Subdomain detection
    subdomain: {
      enabled: false,
      domain: 'yourdomain.com',
    },
  },

  // =============================================================================
  // LOCALE CONFIGURATIONS
  // =============================================================================

  localeConfigs: {
    en: {
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'h:mm A',
      currency: 'USD',
      currencySymbol: '$',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 2,
      },
      pluralRules: 'en',
    },
    uk: {
      name: 'Ukrainian',
      nativeName: 'Українська',
      flag: '🇺🇦',
      direction: 'ltr',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm',
      currency: 'UAH',
      currencySymbol: '₴',
      numberFormat: {
        decimal: ',',
        thousands: ' ',
        precision: 2,
      },
      pluralRules: 'uk',
    },
    es: {
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      direction: 'ltr',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      currencySymbol: '€',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        precision: 2,
      },
      pluralRules: 'es',
    },
    fr: {
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      direction: 'ltr',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      currencySymbol: '€',
      numberFormat: {
        decimal: ',',
        thousands: ' ',
        precision: 2,
      },
      pluralRules: 'fr',
    },
    de: {
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      direction: 'ltr',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      currencySymbol: '€',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        precision: 2,
      },
      pluralRules: 'de',
    },
    it: {
      name: 'Italian',
      nativeName: 'Italiano',
      flag: '🇮🇹',
      direction: 'ltr',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      currencySymbol: '€',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        precision: 2,
      },
      pluralRules: 'it',
    },
    pt: {
      name: 'Portuguese',
      nativeName: 'Português',
      flag: '🇵🇹',
      direction: 'ltr',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      currencySymbol: '€',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        precision: 2,
      },
      pluralRules: 'pt',
    },
    ru: {
      name: 'Russian',
      nativeName: 'Русский',
      flag: '🇷🇺',
      direction: 'ltr',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm',
      currency: 'RUB',
      currencySymbol: '₽',
      numberFormat: {
        decimal: ',',
        thousands: ' ',
        precision: 2,
      },
      pluralRules: 'ru',
    },
    ja: {
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      direction: 'ltr',
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      currency: 'JPY',
      currencySymbol: '¥',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 0,
      },
      pluralRules: 'ja',
    },
    ko: {
      name: 'Korean',
      nativeName: '한국어',
      flag: '🇰🇷',
      direction: 'ltr',
      dateFormat: 'YYYY.MM.DD',
      timeFormat: 'HH:mm',
      currency: 'KRW',
      currencySymbol: '₩',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 0,
      },
      pluralRules: 'ko',
    },
    zh: {
      name: 'Chinese (Simplified)',
      nativeName: '简体中文',
      flag: '🇨🇳',
      direction: 'ltr',
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      currency: 'CNY',
      currencySymbol: '¥',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 2,
      },
      pluralRules: 'zh',
    },
    'zh-TW': {
      name: 'Chinese (Traditional)',
      nativeName: '繁體中文',
      flag: '🇹🇼',
      direction: 'ltr',
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      currency: 'TWD',
      currencySymbol: 'NT$',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 2,
      },
      pluralRules: 'zh',
    },
    ar: {
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      direction: 'rtl',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'SAR',
      currencySymbol: 'ر.س',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 2,
      },
      pluralRules: 'ar',
    },
    he: {
      name: 'Hebrew',
      nativeName: 'עברית',
      flag: '🇮🇱',
      direction: 'rtl',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'ILS',
      currencySymbol: '₪',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 2,
      },
      pluralRules: 'he',
    },
  },

  // =============================================================================
  // TRANSLATION NAMESPACES
  // =============================================================================

  namespaces: {
    // Common translations used across the app
    common: {
      path: '/locales/{{lng}}/common.json',
      keys: [
        'navigation',
        'buttons',
        'forms',
        'messages',
        'errors',
        'loading',
        'pagination',
        'search',
        'filters',
        'sorting',
        'actions',
        'status',
        'time',
        'dates',
      ],
    },

    // Team-specific translations
    team: {
      path: '/locales/{{lng}}/team.json',
      keys: [
        'titles',
        'positions',
        'departments',
        'skills',
        'bio',
        'contact',
        'social',
        'projects',
        'achievements',
        'experience',
      ],
    },

    // Home page translations
    home: {
      path: '/locales/{{lng}}/home.json',
      keys: ['hero', 'about', 'services', 'testimonials', 'cta', 'features', 'stats'],
    },

    // Contact page translations
    contact: {
      path: '/locales/{{lng}}/contact.json',
      keys: ['form', 'info', 'map', 'social', 'office', 'hours'],
    },

    // Projects translations
    projects: {
      path: '/locales/{{lng}}/projects.json',
      keys: ['categories', 'technologies', 'status', 'details', 'gallery', 'testimonials'],
    },

    // Blog translations
    blog: {
      path: '/locales/{{lng}}/blog.json',
      keys: ['categories', 'tags', 'meta', 'comments', 'sharing', 'related'],
    },

    // SEO translations
    seo: {
      path: '/locales/{{lng}}/seo.json',
      keys: ['titles', 'descriptions', 'keywords', 'openGraph', 'twitter', 'schema'],
    },
  },

  // =============================================================================
  // FORMATTING CONFIGURATIONS
  // =============================================================================

  formatting: {
    // Date formatting
    date: {
      // Date-fns locale mapping
      localeMapping: {
        en: 'enUS',
        uk: 'uk',
        es: 'es',
        fr: 'fr',
        de: 'de',
        it: 'it',
        pt: 'pt',
        ru: 'ru',
        ja: 'ja',
        ko: 'ko',
        zh: 'zhCN',
        'zh-TW': 'zhTW',
        ar: 'ar',
        he: 'he',
      },

      // Common date formats
      formats: {
        short: 'P', // 04/29/1453
        medium: 'PP', // Apr 29, 1453
        long: 'PPP', // April 29th, 1453
        full: 'PPPP', // Friday, April 29th, 1453
        time: 'p', // 12:00 AM
        datetime: 'Pp', // 04/29/1453, 12:00 AM
        relative: 'relative', // 2 hours ago
      },
    },

    // Number formatting
    number: {
      // Intl.NumberFormat options
      currency: {
        style: 'currency',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
      integer: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
    },

    // Pluralization rules
    pluralization: {
      // English pluralization
      en: {
        cardinal: ['one', 'other'],
        ordinal: ['one', 'two', 'few', 'other'],
      },
      // Ukrainian pluralization
      uk: {
        cardinal: ['one', 'few', 'many', 'other'],
        ordinal: ['other'],
      },
      // Russian pluralization
      ru: {
        cardinal: ['one', 'few', 'many', 'other'],
        ordinal: ['other'],
      },
      // Arabic pluralization
      ar: {
        cardinal: ['zero', 'one', 'two', 'few', 'many', 'other'],
        ordinal: ['other'],
      },
    },
  },

  // =============================================================================
  // CONTENT MANAGEMENT
  // =============================================================================

  content: {
    // Translation management
    management: {
      // Translation keys validation
      validation: {
        enabled: true,
        rules: {
          // Check for missing translations
          missingKeys: true,
          // Check for unused translations
          unusedKeys: true,
          // Check for empty translations
          emptyValues: true,
          // Check for HTML in translations
          htmlContent: true,
          // Check for interpolation syntax
          interpolation: true,
        },
      },

      // Translation extraction
      extraction: {
        // File patterns to scan
        patterns: [
          'src/**/*.{js,jsx,ts,tsx}',
          'pages/**/*.{js,jsx,ts,tsx}',
          'components/**/*.{js,jsx,ts,tsx}',
        ],
        // Translation function names
        functions: ['t', 'i18n.t', 'useTranslation'],
        // Marker functions for extraction
        markers: ['i18n.mark', 'mark'],
      },

      // Translation workflow
      workflow: {
        // Source locale for translations
        sourceLocale: 'en',
        // Translation status tracking
        statusTracking: true,
        // Review process
        reviewProcess: {
          enabled: true,
          reviewers: ['translator', 'reviewer', 'approver'],
        },
      },
    },

    // Dynamic content
    dynamic: {
      // CMS integration
      cms: {
        enabled: true,
        provider: 'contentful', // contentful, strapi, sanity
        fallbackToStatic: true,
      },

      // User-generated content
      ugc: {
        // Translation of user content
        autoTranslate: false,
        // Language detection
        languageDetection: true,
        // Content moderation
        moderation: true,
      },
    },
  },

  // =============================================================================
  // SEO AND METADATA
  // =============================================================================

  seo: {
    // Localized URLs
    urls: {
      // URL structure
      structure: 'path', // 'path', 'domain', 'subdomain'

      // Path-based URLs
      pathBased: {
        prefix: true, // /en/page or /page
        defaultLocaleInPath: false,
      },

      // Domain-based URLs
      domainBased: {
        domains: {
          en: 'yourdomain.com',
          uk: 'yourdomain.com.ua',
          es: 'yourdomain.es',
          fr: 'yourdomain.fr',
          de: 'yourdomain.de',
        },
      },

      // Subdomain-based URLs
      subdomainBased: {
        subdomains: {
          en: 'www',
          uk: 'ua',
          es: 'es',
          fr: 'fr',
          de: 'de',
        },
      },
    },

    // Hreflang tags
    hreflang: {
      enabled: true,
      // Include default locale
      includeDefault: true,
      // X-default locale
      xDefault: 'en',
    },

    // Sitemap generation
    sitemap: {
      enabled: true,
      // Include all locales
      includeAllLocales: true,
      // Alternate URLs
      alternateUrls: true,
    },

    // Robots.txt
    robots: {
      enabled: true,
      // Locale-specific robots
      localeSpecific: false,
    },
  },

  // =============================================================================
  // PERFORMANCE OPTIMIZATION
  // =============================================================================

  performance: {
    // Lazy loading
    lazyLoading: {
      enabled: true,
      // Preload critical namespaces
      preload: ['common', 'navigation'],
      // Load on demand
      onDemand: ['team', 'projects', 'blog'],
    },

    // Caching
    caching: {
      enabled: true,
      // Cache duration
      duration: 24 * 60 * 60 * 1000, // 24 hours
      // Cache strategy
      strategy: 'memory', // 'memory', 'localStorage', 'sessionStorage'
    },

    // Bundle optimization
    bundleOptimization: {
      // Split translations by namespace
      splitByNamespace: true,
      // Split by locale
      splitByLocale: true,
      // Tree shaking
      treeShaking: true,
    },
  },

  // =============================================================================
  // DEVELOPMENT TOOLS
  // =============================================================================

  development: {
    // Debug mode
    debug: process.env.NODE_ENV === 'development',

    // Missing key handling
    missingKeyHandler: {
      enabled: true,
      // Log missing keys
      log: true,
      // Return key as fallback
      returnKey: true,
      // Custom handler
      handler: (lng, ns, key) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation: ${lng}:${ns}:${key}`);
        }
        return key;
      },
    },

    // Translation tools
    tools: {
      // In-context editing
      inContextEditing: {
        enabled: process.env.NODE_ENV === 'development',
        highlightMissing: true,
        showKeys: false,
      },

      // Translation statistics
      statistics: {
        enabled: true,
        // Track usage
        trackUsage: true,
        // Performance metrics
        performance: true,
      },
    },
  },

  // =============================================================================
  // UTILITIES
  // =============================================================================

  utils: {
    // Get locale configuration
    getLocaleConfig: locale => {
      return i18nConfig.localeConfigs[locale] || i18nConfig.localeConfigs[i18nConfig.defaultLocale];
    },

    // Check if locale is RTL
    isRTL: locale => {
      const config = i18nConfig.utils.getLocaleConfig(locale);
      return config.direction === 'rtl';
    },

    // Get supported locales
    getSupportedLocales: () => {
      return i18nConfig.locales;
    },

    // Validate locale
    isValidLocale: locale => {
      return i18nConfig.locales.includes(locale);
    },

    // Get locale from path
    getLocaleFromPath: path => {
      const segments = path.split('/').filter(Boolean);
      const firstSegment = segments[0];

      if (i18nConfig.utils.isValidLocale(firstSegment)) {
        return firstSegment;
      }

      return i18nConfig.defaultLocale;
    },

    // Remove locale from path
    removeLocaleFromPath: (path, locale) => {
      if (path.startsWith(`/${locale}/`)) {
        return path.substring(locale.length + 1);
      }
      if (path === `/${locale}`) {
        return '/';
      }
      return path;
    },

    // Add locale to path
    addLocaleToPath: (path, locale) => {
      if (
        locale === i18nConfig.defaultLocale &&
        !i18nConfig.seo.urls.pathBased.defaultLocaleInPath
      ) {
        return path;
      }

      if (path === '/') {
        return `/${locale}`;
      }

      return `/${locale}${path}`;
    },

    // Format number with locale
    formatNumber: (number, locale, options = {}) => {
      const config = i18nConfig.utils.getLocaleConfig(locale);
      const formatter = new Intl.NumberFormat(locale, {
        ...i18nConfig.formatting.number.decimal,
        ...options,
        currency: config.currency,
      });

      return formatter.format(number);
    },

    // Format currency with locale
    formatCurrency: (amount, locale, currency) => {
      const config = i18nConfig.utils.getLocaleConfig(locale);
      const formatter = new Intl.NumberFormat(locale, {
        ...i18nConfig.formatting.number.currency,
        currency: currency || config.currency,
      });

      return formatter.format(amount);
    },

    // Format date with locale
    formatDate: (date, locale, format = 'medium') => {
      const config = i18nConfig.utils.getLocaleConfig(locale);
      const formatter = new Intl.DateTimeFormat(locale, {
        dateStyle: format,
      });

      return formatter.format(new Date(date));
    },

    // Get plural form
    getPlural: (count, locale) => {
      const rules = new Intl.PluralRules(locale);
      return rules.select(count);
    },

    // Detect browser locale
    detectBrowserLocale: () => {
      if (typeof window === 'undefined') return i18nConfig.defaultLocale;

      const browserLocales = navigator.languages || [navigator.language];

      for (const browserLocale of browserLocales) {
        // Exact match
        if (i18nConfig.locales.includes(browserLocale)) {
          return browserLocale;
        }

        // Language match (e.g., 'en-US' -> 'en')
        const language = browserLocale.split('-')[0];
        if (i18nConfig.locales.includes(language)) {
          return language;
        }
      }

      return i18nConfig.defaultLocale;
    },

    // Generate alternate URLs
    generateAlternateUrls: (path, currentLocale) => {
      const alternates = [];

      for (const locale of i18nConfig.locales) {
        if (locale !== currentLocale) {
          const localizedPath = i18nConfig.utils.addLocaleToPath(path, locale);
          alternates.push({
            locale,
            url: localizedPath,
            hreflang: locale,
          });
        }
      }

      return alternates;
    },
  },
};

// Export configuration
module.exports = i18nConfig;

// Export for ES modules
module.exports.default = i18nConfig;
