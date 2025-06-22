/**
 * Enhanced Storybook Configuration
 * Advanced setup for component documentation and testing
 */

const path = require('path');

module.exports = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-controls',
    '@storybook/addon-docs',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    '@storybook/addon-design-tokens',
    '@storybook/addon-storysource',
    'storybook-addon-next-router',
    'storybook-addon-mock',
    'storybook-addon-pseudo-states',
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.js',
    },
  },

  features: {
    buildStoriesJson: true,
    storyStoreV7: true,
    argTypeTargetsV7: true,
  },

  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    },
  },

  webpackFinal: async config => {
    // Handle CSS modules
    config.module.rules.push({
      test: /\.module\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: '[name]__[local]--[hash:base64:5]',
            },
          },
        },
      ],
    });

    // Handle SCSS/SASS
    config.module.rules.push({
      test: /\.(scss|sass)$/,
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
          },
        },
      ],
    });

    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false,
                },
              ],
            },
          },
        },
        'url-loader',
      ],
    });

    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
      '@/components': path.resolve(__dirname, '../src/components'),
      '@/utils': path.resolve(__dirname, '../src/utils'),
      '@/hooks': path.resolve(__dirname, '../src/hooks'),
      '@/types': path.resolve(__dirname, '../src/types'),
      '@/styles': path.resolve(__dirname, '../src/styles'),
      '@/public': path.resolve(__dirname, '../public'),
      '@/lib': path.resolve(__dirname, '../src/lib'),
      '@/constants': path.resolve(__dirname, '../src/constants'),
      '@/context': path.resolve(__dirname, '../src/context'),
    };

    // Handle TypeScript files
    config.resolve.extensions.push('.ts', '.tsx');

    // Optimize bundle
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };

    return config;
  },

  env: config => ({
    ...config,
    STORYBOOK: 'true',
  }),

  core: {
    builder: {
      name: 'webpack5',
      options: {
        fsCache: true,
        lazyCompilation: true,
      },
    },
    disableTelemetry: true,
  },

  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },

  staticDirs: ['../public'],

  managerHead: head => `
    ${head}
    <style>
      .sidebar-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .sidebar-item[data-selected="true"] {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
    </style>
  `,

  previewHead: head => `
    ${head}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    </style>
  `,

  refs: {
    'design-system': {
      title: 'Design System',
      url: 'https://design-system.example.com',
    },
  },
};
