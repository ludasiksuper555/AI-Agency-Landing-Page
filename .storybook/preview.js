import '../styles/globals.css';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { i18n } from '../next-i18next.config';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

// Инициализация i18next для Storybook
const i18nInstance = i18next.createInstance();
i18nInstance.init({
  lng: 'uk',
  fallbackLng: 'uk',
  supportedLngs: i18n.locales,
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  nextRouter: {
    Provider: RouterContext.Provider,
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#ffffff',
      },
      {
        name: 'dark',
        value: '#1a202c',
      },
    ],
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1440px',
          height: '900px',
        },
      },
    },
  },
};

export const decorators = [
  Story => (
    <I18nextProvider i18n={i18nInstance}>
      <Story />
    </I18nextProvider>
  ),
];
