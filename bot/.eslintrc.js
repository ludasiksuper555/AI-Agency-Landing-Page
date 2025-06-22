module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true
  },
  extends: ['airbnb-base', 'plugin:node/recommended', 'plugin:security/recommended'],
  plugins: ['node', 'security'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    // General rules
    'no-console': 'off', // Allow console for logging
    'no-underscore-dangle': ['error', { allow: ['_id', '__dirname', '__filename'] }],
    'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

    // Import rules
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'tests/**/*.js',
          'test/**/*.js',
          '**/*.test.js',
          '**/*.spec.js',
          'scripts/**/*.js'
        ]
      }
    ],
    'import/prefer-default-export': 'off',
    'import/no-dynamic-require': 'off',

    // Node.js specific rules
    'node/no-unpublished-require': [
      'error',
      {
        allowModules: ['mocha', 'chai', 'sinon', 'supertest', 'nock', '@faker-js/faker']
      }
    ],
    'node/no-missing-require': 'error',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/exports-style': ['error', 'module.exports'],
    'node/prefer-global/buffer': ['error', 'always'],
    'node/prefer-global/console': ['error', 'always'],
    'node/prefer-global/process': ['error', 'always'],
    'node/prefer-global/url-search-params': ['error', 'always'],
    'node/prefer-global/url': ['error', 'always'],
    'node/prefer-promises/dns': 'error',
    'node/prefer-promises/fs': 'error',

    // Security rules
    'security/detect-object-injection': 'off', // Too many false positives
    'security/detect-non-literal-fs-filename': 'off', // We need dynamic file paths
    'security/detect-non-literal-require': 'off', // We need dynamic requires

    // Async/await rules
    'require-await': 'error',
    'no-return-await': 'error',
    'prefer-promise-reject-errors': 'error',

    // Error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // Code style
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }
    ],
    'function-paren-newline': ['error', 'consistent'],
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: { multiline: true, consistent: true },
        ObjectPattern: { multiline: true, consistent: true },
        ImportDeclaration: { multiline: true, consistent: true },
        ExportDeclaration: { multiline: true, consistent: true }
      }
    ],

    // Comments
    'spaced-comment': [
      'error',
      'always',
      {
        line: { markers: ['/'], exceptions: ['-', '+'] },
        block: { markers: ['*'], exceptions: ['*'], balanced: true }
      }
    ],

    // Variables
    'no-var': 'error',
    'prefer-const': 'error',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],

    // Functions
    'arrow-parens': ['error', 'as-needed'],
    'arrow-spacing': 'error',
    'prefer-arrow-callback': 'error',

    // Objects and arrays
    'object-shorthand': 'error',
    'quote-props': ['error', 'as-needed'],
    'prefer-template': 'error',
    'template-curly-spacing': 'error',

    // Control flow
    'no-else-return': 'error',
    'no-lonely-if': 'error',
    'no-unneeded-ternary': 'error',

    // Performance
    'no-loop-func': 'error',
    'no-await-in-loop': 'warn'
  },

  overrides: [
    {
      files: ['tests/**/*.js', 'test/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        mocha: true
      },
      rules: {
        'no-unused-expressions': 'off', // Chai assertions
        'prefer-arrow-callback': 'off', // Mocha uses function expressions
        'func-names': 'off', // Mocha test names
        'max-len': ['error', { code: 150 }], // Longer lines in tests
        'no-magic-numbers': 'off', // Test data can have magic numbers
        'security/detect-object-injection': 'off'
      }
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off', // Scripts can use console
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['config/**/*.js'],
      rules: {
        'global-require': 'off', // Config files may require conditionally
        'import/no-dynamic-require': 'off'
      }
    }
  ],

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json']
      }
    }
  }
};
