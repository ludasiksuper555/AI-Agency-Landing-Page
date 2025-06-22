#!/usr/bin/env node

/**
 * 🤖 Automated PWA Testing Script - Stage 6 Companion
 * Complements the manual testing guide with automated checks
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  outputDir: './test-results',
  lighthouse: {
    onlyCategories: ['pwa', 'performance', 'accessibility', 'best-practices', 'seo'],
    settings: {
      onlyAudits: [
        'service-worker',
        'works-offline',
        'is-on-https',
        'redirects-http',
        'splash-screen',
        'themed-omnibox',
        'content-width',
        'viewport',
        'apple-touch-icon',
        'maskable-icon',
        'installable-manifest',
        'pwa-cross-browser',
        'pwa-page-transitions',
        'pwa-each-page-has-url',
      ],
    },
  },
  timeouts: {
    navigation: 30000,
    element: 10000,
    test: 60000,
  },
};

// Test results storage
const testResults = {
  security: [],
  pwa: [],
  performance: [],
  lighthouse: null,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
};

// Utility functions
const log = {
  info: msg => console.log(chalk.blue('ℹ️ '), msg),
  success: msg => console.log(chalk.green('✅'), msg),
  error: msg => console.log(chalk.red('❌'), msg),
  warn: msg => console.log(chalk.yellow('⚠️ '), msg),
  test: msg => console.log(chalk.cyan('🧪'), msg),
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Test runner class
class PWATestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.chrome = null;
  }

  async setup() {
    log.info('Setting up test environment...');

    // Create output directory
    await fs.mkdir(CONFIG.outputDir, { recursive: true });

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });

    this.page = await this.browser.newPage();

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Enable request interception for network analysis
    await this.page.setRequestInterception(true);

    this.page.on('request', request => {
      request.continue();
    });

    log.success('Test environment ready');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.chrome) {
      await this.chrome.kill();
    }
  }

  // Security Tests
  async testSecurityHeaders() {
    log.test('Testing security headers...');

    try {
      const response = await this.page.goto(CONFIG.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeouts.navigation,
      });

      const headers = response.headers();
      const requiredHeaders = {
        'content-security-policy': 'Content Security Policy',
        'x-frame-options': 'X-Frame-Options',
        'x-content-type-options': 'X-Content-Type-Options',
        'referrer-policy': 'Referrer Policy',
        'permissions-policy': 'Permissions Policy',
      };

      let passed = 0;
      let total = Object.keys(requiredHeaders).length;

      for (const [header, name] of Object.entries(requiredHeaders)) {
        if (headers[header]) {
          log.success(`${name}: ${headers[header]}`);
          passed++;
        } else {
          log.error(`Missing ${name} header`);
        }
      }

      const result = {
        test: 'Security Headers',
        passed: passed === total,
        score: `${passed}/${total}`,
        details: headers,
      };

      testResults.security.push(result);
      return result;
    } catch (error) {
      log.error(`Security headers test failed: ${error.message}`);
      const result = {
        test: 'Security Headers',
        passed: false,
        error: error.message,
      };
      testResults.security.push(result);
      return result;
    }
  }

  async testHTTPS() {
    log.test('Testing HTTPS enforcement...');

    try {
      const url = new URL(CONFIG.baseUrl);
      const isHTTPS = url.protocol === 'https:';
      const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

      const result = {
        test: 'HTTPS Enforcement',
        passed: isHTTPS || isLocalhost,
        details: {
          protocol: url.protocol,
          hostname: url.hostname,
          isLocalhost,
        },
      };

      if (result.passed) {
        log.success('HTTPS or localhost detected');
      } else {
        log.error('HTTPS required for production PWA');
      }

      testResults.security.push(result);
      return result;
    } catch (error) {
      log.error(`HTTPS test failed: ${error.message}`);
      const result = {
        test: 'HTTPS Enforcement',
        passed: false,
        error: error.message,
      };
      testResults.security.push(result);
      return result;
    }
  }

  // PWA Tests
  async testServiceWorker() {
    log.test('Testing Service Worker registration...');

    try {
      await this.page.goto(CONFIG.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeouts.navigation,
      });

      // Wait for service worker registration
      await sleep(2000);

      const swRegistration = await this.page.evaluate(() => {
        return navigator.serviceWorker
          .getRegistration()
          .then(registration => {
            if (registration) {
              return {
                scope: registration.scope,
                state: registration.active ? registration.active.state : 'no active worker',
                scriptURL: registration.active ? registration.active.scriptURL : null,
              };
            }
            return null;
          })
          .catch(error => ({ error: error.message }));
      });

      const result = {
        test: 'Service Worker Registration',
        passed: swRegistration && swRegistration.state === 'activated',
        details: swRegistration,
      };

      if (result.passed) {
        log.success(`Service Worker active: ${swRegistration.scriptURL}`);
      } else {
        log.error('Service Worker not properly registered');
      }

      testResults.pwa.push(result);
      return result;
    } catch (error) {
      log.error(`Service Worker test failed: ${error.message}`);
      const result = {
        test: 'Service Worker Registration',
        passed: false,
        error: error.message,
      };
      testResults.pwa.push(result);
      return result;
    }
  }

  async testWebAppManifest() {
    log.test('Testing Web App Manifest...');

    try {
      await this.page.goto(CONFIG.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeouts.navigation,
      });

      // Check for manifest link
      const manifestLink = await this.page.$('link[rel="manifest"]');
      if (!manifestLink) {
        throw new Error('Manifest link not found in HTML');
      }

      const manifestHref = await this.page.$eval('link[rel="manifest"]', el => el.href);

      // Fetch and parse manifest
      const manifestResponse = await this.page.goto(manifestHref);
      const manifestText = await manifestResponse.text();
      const manifest = JSON.parse(manifestText);

      // Check required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);

      // Check icons
      const hasValidIcons =
        manifest.icons &&
        manifest.icons.length > 0 &&
        manifest.icons.some(icon => icon.sizes && icon.src);

      const result = {
        test: 'Web App Manifest',
        passed: missingFields.length === 0 && hasValidIcons,
        details: {
          manifest,
          missingFields,
          hasValidIcons,
          iconCount: manifest.icons ? manifest.icons.length : 0,
        },
      };

      if (result.passed) {
        log.success(`Manifest valid with ${manifest.icons.length} icons`);
      } else {
        log.error(`Manifest issues: ${missingFields.join(', ')}`);
      }

      testResults.pwa.push(result);
      return result;
    } catch (error) {
      log.error(`Manifest test failed: ${error.message}`);
      const result = {
        test: 'Web App Manifest',
        passed: false,
        error: error.message,
      };
      testResults.pwa.push(result);
      return result;
    }
  }

  async testOfflineFunctionality() {
    log.test('Testing offline functionality...');

    try {
      // Load page first
      await this.page.goto(CONFIG.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeouts.navigation,
      });

      // Wait for service worker to cache resources
      await sleep(3000);

      // Go offline
      await this.page.setOfflineMode(true);

      // Try to reload page
      const response = await this.page.reload({
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeouts.navigation,
      });

      // Check if page loads offline
      const pageContent = await this.page.content();
      const hasContent = pageContent.length > 1000; // Basic content check

      // Go back online
      await this.page.setOfflineMode(false);

      const result = {
        test: 'Offline Functionality',
        passed: hasContent,
        details: {
          contentLength: pageContent.length,
          responseStatus: response ? response.status() : 'no response',
        },
      };

      if (result.passed) {
        log.success('Page loads offline successfully');
      } else {
        log.error('Page fails to load offline');
      }

      testResults.pwa.push(result);
      return result;
    } catch (error) {
      // Ensure we're back online
      await this.page.setOfflineMode(false);

      log.error(`Offline test failed: ${error.message}`);
      const result = {
        test: 'Offline Functionality',
        passed: false,
        error: error.message,
      };
      testResults.pwa.push(result);
      return result;
    }
  }

  async testInstallability() {
    log.test('Testing PWA installability...');

    try {
      await this.page.goto(CONFIG.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeouts.navigation,
      });

      // Check for beforeinstallprompt event
      const installPromptResult = await this.page.evaluate(() => {
        return new Promise(resolve => {
          let prompted = false;

          window.addEventListener('beforeinstallprompt', e => {
            prompted = true;
            resolve({ canInstall: true, prompted: true });
          });

          // Wait a bit for the event
          setTimeout(() => {
            if (!prompted) {
              resolve({ canInstall: false, prompted: false });
            }
          }, 3000);
        });
      });

      const result = {
        test: 'PWA Installability',
        passed: installPromptResult.canInstall,
        details: installPromptResult,
      };

      if (result.passed) {
        log.success('PWA is installable');
      } else {
        log.warn('PWA install prompt not triggered (may still be installable)');
      }

      testResults.pwa.push(result);
      return result;
    } catch (error) {
      log.error(`Installability test failed: ${error.message}`);
      const result = {
        test: 'PWA Installability',
        passed: false,
        error: error.message,
      };
      testResults.pwa.push(result);
      return result;
    }
  }

  // Performance Tests
  async testPageLoadSpeed() {
    log.test('Testing page load speed...');

    try {
      const startTime = Date.now();

      await this.page.goto(CONFIG.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeouts.navigation,
      });

      const loadTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint:
            performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        };
      });

      const result = {
        test: 'Page Load Speed',
        passed: loadTime < 3000, // 3 seconds threshold
        details: {
          totalLoadTime: loadTime,
          ...metrics,
        },
      };

      if (result.passed) {
        log.success(`Page loaded in ${loadTime}ms`);
      } else {
        log.warn(`Page load time ${loadTime}ms exceeds 3s threshold`);
      }

      testResults.performance.push(result);
      return result;
    } catch (error) {
      log.error(`Performance test failed: ${error.message}`);
      const result = {
        test: 'Page Load Speed',
        passed: false,
        error: error.message,
      };
      testResults.performance.push(result);
      return result;
    }
  }

  // Lighthouse Audit
  async runLighthouseAudit() {
    log.test('Running Lighthouse PWA audit...');

    try {
      // Launch Chrome for Lighthouse
      this.chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
      });

      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: CONFIG.lighthouse.onlyCategories,
        port: this.chrome.port,
        ...CONFIG.lighthouse.settings,
      };

      const runnerResult = await lighthouse(CONFIG.baseUrl, options);

      // Extract scores
      const scores = {
        pwa: Math.round(runnerResult.lhr.categories.pwa.score * 100),
        performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
        accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(runnerResult.lhr.categories['best-practices'].score * 100),
        seo: Math.round(runnerResult.lhr.categories.seo.score * 100),
      };

      // Save full report
      const reportPath = path.join(CONFIG.outputDir, 'lighthouse-report.json');
      await fs.writeFile(reportPath, runnerResult.report);

      const result = {
        test: 'Lighthouse PWA Audit',
        passed: scores.pwa >= 90,
        scores,
        reportPath,
      };

      testResults.lighthouse = result;

      log.success(
        `Lighthouse scores: PWA ${scores.pwa}, Perf ${scores.performance}, A11y ${scores.accessibility}`
      );

      return result;
    } catch (error) {
      log.error(`Lighthouse audit failed: ${error.message}`);
      const result = {
        test: 'Lighthouse PWA Audit',
        passed: false,
        error: error.message,
      };
      testResults.lighthouse = result;
      return result;
    }
  }

  // Generate Report
  async generateReport() {
    log.info('Generating test report...');

    // Calculate summary
    const allTests = [...testResults.security, ...testResults.pwa, ...testResults.performance];

    if (testResults.lighthouse) {
      allTests.push(testResults.lighthouse);
    }

    testResults.summary = {
      total: allTests.length,
      passed: allTests.filter(t => t.passed).length,
      failed: allTests.filter(t => !t.passed).length,
      skipped: 0,
    };

    testResults.summary.successRate = Math.round(
      (testResults.summary.passed / testResults.summary.total) * 100
    );

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(CONFIG.outputDir, 'pwa-test-report.html');
    await fs.writeFile(htmlPath, htmlReport);

    // Generate JSON report
    const jsonPath = path.join(CONFIG.outputDir, 'pwa-test-results.json');
    await fs.writeFile(jsonPath, JSON.stringify(testResults, null, 2));

    log.success(`Reports generated: ${htmlPath}, ${jsonPath}`);

    return {
      htmlPath,
      jsonPath,
      summary: testResults.summary,
    };
  }

  generateHTMLReport() {
    const timestamp = new Date().toISOString();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PWA Test Report - Stage 6</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #495057; }
        .summary-card .number { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .section { padding: 0 30px 30px 30px; }
        .section h2 { color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
        .test-item { background: #f8f9fa; margin: 15px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #e9ecef; }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .test-name { font-weight: bold; font-size: 1.1em; }
        .test-status { padding: 5px 15px; border-radius: 20px; color: white; font-size: 0.9em; }
        .test-status.passed { background: #28a745; }
        .test-status.failed { background: #dc3545; }
        .test-details { background: white; padding: 15px; border-radius: 4px; margin-top: 10px; font-family: monospace; font-size: 0.9em; }
        .lighthouse-scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .score-card { background: white; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #e9ecef; }
        .score-number { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .score-90 { color: #28a745; border-color: #28a745; }
        .score-70 { color: #ffc107; border-color: #ffc107; }
        .score-50 { color: #dc3545; border-color: #dc3545; }
        .footer { text-align: center; padding: 20px; color: #6c757d; border-top: 1px solid #e9ecef; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 PWA Test Report</h1>
            <p>Automated testing results for Stage 6 - Generated on ${timestamp}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="number">${testResults.summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number passed">${testResults.summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number failed">${testResults.summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="number ${testResults.summary.successRate >= 85 ? 'passed' : 'failed'}">${testResults.summary.successRate}%</div>
            </div>
        </div>

        ${
          testResults.lighthouse
            ? `
        <div class="section">
            <h2>🚀 Lighthouse Scores</h2>
            <div class="lighthouse-scores">
                ${Object.entries(testResults.lighthouse.scores || {})
                  .map(
                    ([category, score]) => `
                <div class="score-card ${score >= 90 ? 'score-90' : score >= 70 ? 'score-70' : 'score-50'}">
                    <div>${category.toUpperCase()}</div>
                    <div class="score-number">${score}</div>
                </div>
                `
                  )
                  .join('')}
            </div>
        </div>
        `
            : ''
        }

        <div class="section">
            <h2>🔒 Security Tests</h2>
            ${testResults.security
              .map(
                test => `
            <div class="test-item ${test.passed ? 'passed' : 'failed'}">
                <div class="test-header">
                    <div class="test-name">${test.test}</div>
                    <div class="test-status ${test.passed ? 'passed' : 'failed'}">
                        ${test.passed ? '✅ PASSED' : '❌ FAILED'}
                    </div>
                </div>
                ${test.details ? `<div class="test-details">${JSON.stringify(test.details, null, 2)}</div>` : ''}
                ${test.error ? `<div class="test-details">Error: ${test.error}</div>` : ''}
            </div>
            `
              )
              .join('')}
        </div>

        <div class="section">
            <h2>📱 PWA Tests</h2>
            ${testResults.pwa
              .map(
                test => `
            <div class="test-item ${test.passed ? 'passed' : 'failed'}">
                <div class="test-header">
                    <div class="test-name">${test.test}</div>
                    <div class="test-status ${test.passed ? 'passed' : 'failed'}">
                        ${test.passed ? '✅ PASSED' : '❌ FAILED'}
                    </div>
                </div>
                ${test.details ? `<div class="test-details">${JSON.stringify(test.details, null, 2)}</div>` : ''}
                ${test.error ? `<div class="test-details">Error: ${test.error}</div>` : ''}
            </div>
            `
              )
              .join('')}
        </div>

        <div class="section">
            <h2>⚡ Performance Tests</h2>
            ${testResults.performance
              .map(
                test => `
            <div class="test-item ${test.passed ? 'passed' : 'failed'}">
                <div class="test-header">
                    <div class="test-name">${test.test}</div>
                    <div class="test-status ${test.passed ? 'passed' : 'failed'}">
                        ${test.passed ? '✅ PASSED' : '❌ FAILED'}
                    </div>
                </div>
                ${test.details ? `<div class="test-details">${JSON.stringify(test.details, null, 2)}</div>` : ''}
                ${test.error ? `<div class="test-details">Error: ${test.error}</div>` : ''}
            </div>
            `
              )
              .join('')}
        </div>

        <div class="footer">
            <p>Generated by PWA Test Runner - Stage 6 | ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Main test runner
  async runAllTests() {
    log.info('🚀 Starting PWA automated tests...');

    try {
      await this.setup();

      // Security Tests
      log.info('\n🔒 Running Security Tests...');
      await this.testHTTPS();
      await this.testSecurityHeaders();

      // PWA Tests
      log.info('\n📱 Running PWA Tests...');
      await this.testServiceWorker();
      await this.testWebAppManifest();
      await this.testOfflineFunctionality();
      await this.testInstallability();

      // Performance Tests
      log.info('\n⚡ Running Performance Tests...');
      await this.testPageLoadSpeed();

      // Lighthouse Audit
      log.info('\n🚀 Running Lighthouse Audit...');
      await this.runLighthouseAudit();

      // Generate Report
      const report = await this.generateReport();

      // Summary
      log.info('\n📊 Test Summary:');
      log.info(`Total Tests: ${testResults.summary.total}`);
      log.success(`Passed: ${testResults.summary.passed}`);
      log.error(`Failed: ${testResults.summary.failed}`);
      log.info(`Success Rate: ${testResults.summary.successRate}%`);

      if (testResults.summary.successRate >= 85) {
        log.success('🎉 PWA tests passed! Ready for production.');
      } else {
        log.warn('⚠️  Some tests failed. Review and fix issues before production.');
      }

      return report;
    } catch (error) {
      log.error(`Test runner failed: ${error.message}`);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// CLI Interface
if (require.main === module) {
  const runner = new PWATestRunner();

  runner
    .runAllTests()
    .then(report => {
      console.log('\n📋 Reports generated:');
      console.log(`HTML: ${report.htmlPath}`);
      console.log(`JSON: ${report.jsonPath}`);

      process.exit(testResults.summary.successRate >= 85 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = PWATestRunner;
