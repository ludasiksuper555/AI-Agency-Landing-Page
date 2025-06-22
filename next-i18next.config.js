module.exports = {
  i18n: {
    defaultLocale: 'uk',
    locales: ['uk', 'en', 'de', 'pl'],
    localeDetection: false,
  },
  localePath: './public/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
