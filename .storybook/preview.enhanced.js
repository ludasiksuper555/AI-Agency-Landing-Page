/**
 * Enhanced Storybook Preview Configuration
 * Global decorators, parameters, and setup for component stories
 */

import { action } from '@storybook/addon-actions';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import React from 'react';
import { handlers } from '../src/mocks/server';
import '../src/styles/globals.css';

// Initialize MSW
initialize({
  onUnhandledRequest: 'warn',
});

// Mock Next.js router
const mockRouter = {
  push: action('router.push'),
  replace: action('router.replace'),
  prefetch: action('router.prefetch'),
  back: action('router.back'),
  forward: action('router.forward'),
  refresh: action('router.refresh'),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  isFallback: false,
  events: {
    on: action('router.events.on'),
    off: action('router.events.off'),
    emit: action('router.events.emit'),
  },
};

// Mock next-i18next
const mockTranslations = {
  'team.title': 'Our Team',
  'team.filters.search': 'Search team members...',
  'team.filters.position': 'Filter by position',
  'team.filters.department': 'Filter by department',
  'team.filters.allPositions': 'All positions',
  'team.filters.allDepartments': 'All departments',
  'team.sorting.name': 'Name',
  'team.sorting.position': 'Position',
  'team.sorting.department': 'Department',
  'team.stats.totalMembers': 'Total Members',
  'team.stats.positionsCount': '{{count}} Positions',
  'team.stats.departmentsCount': '{{count}} Departments',
  'team.member.viewProfile': 'View Profile',
  'team.member.contact': 'Contact',
  'team.member.skills': 'Skills',
  'team.member.projects': 'Projects',
  'team.member.startDate': 'Start Date',
  'team.member.location': 'Location',
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.retry': 'Retry',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.confirm': 'Confirm',
};

const mockUseTranslation = () => ({
  t: (key, options = {}) => {
    const translation = mockTranslations[key];
    if (options.count !== undefined && translation) {
      return translation.replace('{{count}}', options.count.toString());
    }
    return translation || key;
  },
  i18n: {
    language: 'en',
    changeLanguage: action('i18n.changeLanguage'),
  },
});

// Global decorators
export const decorators = [
  // MSW decorator for API mocking
  mswDecorator,

  // Next.js router decorator
  Story => (
    <RouterContext.Provider value={mockRouter}>
      <Story />
    </RouterContext.Provider>
  ),

  // i18n decorator
  Story => {
    // Mock useTranslation hook
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        window.useTranslation = mockUseTranslation;
      }
    }, []);

    return <Story />;
  },

  // Theme decorator
  (Story, context) => {
    const theme = context.globals.theme || 'light';

    React.useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = theme;
    }, [theme]);

    return (
      <div className={`theme-${theme}`} style={{ minHeight: '100vh' }}>
        <Story />
      </div>
    );
  },

  // Responsive decorator
  (Story, context) => {
    const viewport = context.globals.viewport;
    const isMobile = viewport === 'mobile1' || viewport === 'mobile2';

    return (
      <div className={isMobile ? 'mobile-view' : 'desktop-view'}>
        <Story />
      </div>
    );
  },

  // Accessibility decorator
  Story => (
    <div role="main" aria-label="Storybook component preview">
      <Story />
    </div>
  ),
];

// Global parameters
export const parameters = {
  // Actions
  actions: {
    argTypesRegex: '^on[A-Z].*',
  },

  // Controls
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
    expanded: true,
    sort: 'requiredFirst',
  },

  // Docs
  docs: {
    extractComponentDescription: (component, { notes }) => {
      if (notes) {
        return typeof notes === 'string' ? notes : notes.markdown || notes.text;
      }
      return null;
    },
    source: {
      state: 'open',
    },
  },

  // Viewport
  viewport: {
    viewports: {
      ...INITIAL_VIEWPORTS,
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1440px',
          height: '900px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px',
        },
      },
    },
    defaultViewport: 'desktop',
  },

  // Backgrounds
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#ffffff',
      },
      {
        name: 'dark',
        value: '#1a1a1a',
      },
      {
        name: 'gray',
        value: '#f5f5f5',
      },
      {
        name: 'blue',
        value: '#e3f2fd',
      },
    ],
  },

  // Layout
  layout: 'centered',

  // Options
  options: {
    storySort: {
      order: [
        'Introduction',
        'Design System',
        ['Colors', 'Typography', 'Spacing', 'Components'],
        'Components',
        ['Basic', 'Forms', 'Navigation', 'Layout', 'Feedback'],
        'Pages',
        'Examples',
      ],
    },
  },

  // MSW
  msw: {
    handlers: handlers,
  },

  // A11y
  a11y: {
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: true,
        },
        {
          id: 'focus-trap',
          enabled: true,
        },
        {
          id: 'keyboard-navigation',
          enabled: true,
        },
      ],
    },
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },

  // Design tokens
  designToken: {
    defaultTab: 'Colors',
  },
};

// Global types for toolbar controls
export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'light', title: 'Light', icon: 'sun' },
        { value: 'dark', title: 'Dark', icon: 'moon' },
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', title: 'English', right: '🇺🇸' },
        { value: 'uk', title: 'Ukrainian', right: '🇺🇦' },
        { value: 'es', title: 'Spanish', right: '🇪🇸' },
        { value: 'fr', title: 'French', right: '🇫🇷' },
      ],
      showName: true,
    },
  },
  motion: {
    name: 'Motion',
    description: 'Enable/disable animations',
    defaultValue: 'enabled',
    toolbar: {
      icon: 'play',
      items: [
        { value: 'enabled', title: 'Enabled' },
        { value: 'disabled', title: 'Disabled' },
      ],
      showName: true,
    },
  },
  density: {
    name: 'Density',
    description: 'Component density',
    defaultValue: 'normal',
    toolbar: {
      icon: 'component',
      items: [
        { value: 'compact', title: 'Compact' },
        { value: 'normal', title: 'Normal' },
        { value: 'comfortable', title: 'Comfortable' },
      ],
      showName: true,
    },
  },
};

// Custom webpack configuration for Storybook
export const webpackFinal = async config => {
  // Add support for absolute imports
  config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, '../src')];

  return config;
};
