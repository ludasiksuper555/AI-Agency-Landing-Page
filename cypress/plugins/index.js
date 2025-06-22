/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const { lighthouse, prepareAudit } = require('@cypress-audit/lighthouse');
const { pa11y } = require('@cypress-audit/pa11y');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  // Настройка для скриншотов и видео
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name === 'chrome' && browser.isHeadless) {
      launchOptions.args.push('--disable-gpu');
      launchOptions.args.push('--disable-dev-shm-usage');
      launchOptions.args.push('--disable-software-rasterizer');
      launchOptions.args.push('--no-sandbox');
      launchOptions.args.push('--disable-extensions');
    }

    return launchOptions;
  });

  // Настройка для Lighthouse аудита
  on('before:browser:launch', (browser, launchOptions) => {
    prepareAudit(launchOptions);
  });

  // Регистрация команд для аудита доступности и производительности
  on('task', {
    lighthouse: lighthouse(),
    pa11y: pa11y(),
    log(message) {
      console.log(message);
      return null;
    },
    table(message) {
      console.table(message);
      return null;
    },
  });

  // Настройка для переменных окружения
  config.env = {
    ...config.env,
    // Добавляем переменные окружения для тестов
    apiUrl: process.env.CYPRESS_API_URL || 'http://localhost:3000/api',
    // Флаги для включения/отключения определенных тестов
    runLighthouse: process.env.CYPRESS_RUN_LIGHTHOUSE === 'true',
    runA11y: process.env.CYPRESS_RUN_A11Y === 'true',
  };

  return config;
};
