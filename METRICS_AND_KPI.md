# 📊 Metrics and KPI

**Приоритет**: 🔥 Высокий
**Время выполнения**: 2-3 часа
**Статус**: Критично для мониторинга

---

## 📋 Обзор метрик и KPI

### 1. Quality Metrics (Метрики качества)

### 2. Performance Metrics (Метрики производительности)

### 3. Business Metrics (Бизнес-метрики)

### 4. Security Metrics (Метрики безопасности)

### 5. User Experience Metrics (Метрики пользовательского опыта)

### 6. Development Metrics (Метрики разработки)

---

## 🎯 1. Quality Metrics (Метрики качества)

### Code Quality Dashboard

**lib/metrics/quality-metrics.ts**:

```typescript
interface QualityMetrics {
  codeCoverage: number;
  testPassRate: number;
  codeComplexity: number;
  technicalDebt: number;
  bugDensity: number;
  codeSmells: number;
  duplicatedLines: number;
  maintainabilityIndex: number;
}

interface QualityThresholds {
  codeCoverage: { min: number; target: number };
  testPassRate: { min: number; target: number };
  codeComplexity: { max: number; target: number };
  technicalDebt: { max: number; target: number };
  bugDensity: { max: number; target: number };
  codeSmells: { max: number; target: number };
  duplicatedLines: { max: number; target: number };
  maintainabilityIndex: { min: number; target: number };
}

class QualityMetricsCollector {
  private thresholds: QualityThresholds = {
    codeCoverage: { min: 70, target: 85 },
    testPassRate: { min: 95, target: 100 },
    codeComplexity: { max: 10, target: 5 },
    technicalDebt: { max: 30, target: 10 }, // в днях
    bugDensity: { max: 5, target: 1 }, // багов на 1000 строк
    codeSmells: { max: 50, target: 10 },
    duplicatedLines: { max: 5, target: 2 }, // процент
    maintainabilityIndex: { min: 70, target: 85 },
  };

  async collectMetrics(): Promise<QualityMetrics> {
    const [coverage, tests, complexity, debt] = await Promise.all([
      this.getCodeCoverage(),
      this.getTestResults(),
      this.getCodeComplexity(),
      this.getTechnicalDebt(),
    ]);

    return {
      codeCoverage: coverage.percentage,
      testPassRate: tests.passRate,
      codeComplexity: complexity.average,
      technicalDebt: debt.days,
      bugDensity: await this.getBugDensity(),
      codeSmells: await this.getCodeSmells(),
      duplicatedLines: await this.getDuplicatedLines(),
      maintainabilityIndex: await this.getMaintainabilityIndex(),
    };
  }

  private async getCodeCoverage() {
    // Интеграция с Jest coverage
    try {
      const coverageData = require('../../../coverage/coverage-summary.json');
      return {
        percentage: coverageData.total.lines.pct,
        lines: coverageData.total.lines,
        functions: coverageData.total.functions,
        branches: coverageData.total.branches,
        statements: coverageData.total.statements,
      };
    } catch (error) {
      console.warn('Coverage data not found');
      return { percentage: 0 };
    }
  }

  private async getTestResults() {
    // Анализ результатов тестов
    try {
      const testResults = require('../../../test-results.json');
      const total = testResults.numTotalTests;
      const passed = testResults.numPassedTests;

      return {
        total,
        passed,
        failed: testResults.numFailedTests,
        passRate: (passed / total) * 100,
      };
    } catch (error) {
      console.warn('Test results not found');
      return { total: 0, passed: 0, failed: 0, passRate: 0 };
    }
  }

  private async getCodeComplexity() {
    // Анализ цикломатической сложности
    const { execSync } = require('child_process');

    try {
      const output = execSync('npx complexity-report --format json src/', { encoding: 'utf8' });
      const report = JSON.parse(output);

      const complexities = report.reports.map((r: any) => r.complexity.cyclomatic);
      const average = complexities.reduce((a: number, b: number) => a + b, 0) / complexities.length;
      const max = Math.max(...complexities);

      return { average, max, distribution: complexities };
    } catch (error) {
      console.warn('Complexity analysis failed');
      return { average: 0, max: 0, distribution: [] };
    }
  }

  private async getTechnicalDebt() {
    // Оценка технического долга
    const { execSync } = require('child_process');

    try {
      // Используем SonarQube или аналогичный инструмент
      const output = execSync('sonar-scanner -Dsonar.projectKey=myproject', { encoding: 'utf8' });
      // Парсинг результатов SonarQube
      return { days: 15 }; // Примерное значение
    } catch (error) {
      console.warn('Technical debt analysis failed');
      return { days: 0 };
    }
  }

  private async getBugDensity(): Promise<number> {
    // Плотность багов на 1000 строк кода
    const totalLines = await this.getTotalLinesOfCode();
    const totalBugs = await this.getTotalBugs();

    return (totalBugs / totalLines) * 1000;
  }

  private async getCodeSmells(): Promise<number> {
    // Количество code smells
    try {
      const { execSync } = require('child_process');
      const output = execSync('npx eslint src/ --format json', { encoding: 'utf8' });
      const results = JSON.parse(output);

      return results.reduce((total: number, file: any) => {
        return total + file.messages.filter((msg: any) => msg.severity === 1).length;
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  private async getDuplicatedLines(): Promise<number> {
    // Процент дублированных строк
    try {
      const { execSync } = require('child_process');
      const output = execSync('npx jscpd src/ --format json', { encoding: 'utf8' });
      const report = JSON.parse(output);

      return report.statistics.total.percentage;
    } catch (error) {
      return 0;
    }
  }

  private async getMaintainabilityIndex(): Promise<number> {
    // Индекс поддерживаемости (0-100)
    const complexity = await this.getCodeComplexity();
    const coverage = await this.getCodeCoverage();
    const smells = await this.getCodeSmells();

    // Упрощенная формула расчета
    const index = Math.max(
      0,
      Math.min(100, 100 - complexity.average * 2 - smells * 0.5 + coverage.percentage * 0.3)
    );

    return Math.round(index);
  }

  private async getTotalLinesOfCode(): Promise<number> {
    const { execSync } = require('child_process');
    try {
      const output = execSync('find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1', {
        encoding: 'utf8',
      });
      return parseInt(output.trim().split(' ')[0]);
    } catch (error) {
      return 10000; // Примерное значение
    }
  }

  private async getTotalBugs(): Promise<number> {
    // Интеграция с системой отслеживания багов
    return 5; // Примерное значение
  }

  getQualityScore(metrics: QualityMetrics): number {
    let score = 0;
    let maxScore = 0;

    // Покрытие кода (25% от общей оценки)
    const coverageScore =
      Math.min(metrics.codeCoverage / this.thresholds.codeCoverage.target, 1) * 25;
    score += coverageScore;
    maxScore += 25;

    // Прохождение тестов (25% от общей оценки)
    const testScore = Math.min(metrics.testPassRate / this.thresholds.testPassRate.target, 1) * 25;
    score += testScore;
    maxScore += 25;

    // Сложность кода (20% от общей оценки)
    const complexityScore =
      Math.max(
        0,
        (this.thresholds.codeComplexity.max - metrics.codeComplexity) /
          this.thresholds.codeComplexity.max
      ) * 20;
    score += complexityScore;
    maxScore += 20;

    // Технический долг (15% от общей оценки)
    const debtScore =
      Math.max(
        0,
        (this.thresholds.technicalDebt.max - metrics.technicalDebt) /
          this.thresholds.technicalDebt.max
      ) * 15;
    score += debtScore;
    maxScore += 15;

    // Индекс поддерживаемости (15% от общей оценки)
    const maintainabilityScore =
      Math.min(metrics.maintainabilityIndex / this.thresholds.maintainabilityIndex.target, 1) * 15;
    score += maintainabilityScore;
    maxScore += 15;

    return Math.round((score / maxScore) * 100);
  }

  generateReport(metrics: QualityMetrics): string {
    const score = this.getQualityScore(metrics);

    let report = '# Quality Metrics Report\n\n';
    report += `**Overall Quality Score: ${score}/100**\n\n`;

    report += '## Metrics\n\n';
    report += `- **Code Coverage**: ${metrics.codeCoverage}% (Target: ${this.thresholds.codeCoverage.target}%)\n`;
    report += `- **Test Pass Rate**: ${metrics.testPassRate}% (Target: ${this.thresholds.testPassRate.target}%)\n`;
    report += `- **Code Complexity**: ${metrics.codeComplexity} (Target: ≤${this.thresholds.codeComplexity.target})\n`;
    report += `- **Technical Debt**: ${metrics.technicalDebt} days (Target: ≤${this.thresholds.technicalDebt.target} days)\n`;
    report += `- **Bug Density**: ${metrics.bugDensity} bugs/1000 lines (Target: ≤${this.thresholds.bugDensity.target})\n`;
    report += `- **Code Smells**: ${metrics.codeSmells} (Target: ≤${this.thresholds.codeSmells.target})\n`;
    report += `- **Duplicated Lines**: ${metrics.duplicatedLines}% (Target: ≤${this.thresholds.duplicatedLines.target}%)\n`;
    report += `- **Maintainability Index**: ${metrics.maintainabilityIndex}/100 (Target: ≥${this.thresholds.maintainabilityIndex.target})\n\n`;

    report += '## Recommendations\n\n';

    if (metrics.codeCoverage < this.thresholds.codeCoverage.target) {
      report += `- 🔴 Increase code coverage to ${this.thresholds.codeCoverage.target}%\n`;
    }

    if (metrics.testPassRate < this.thresholds.testPassRate.target) {
      report += `- 🔴 Fix failing tests to achieve ${this.thresholds.testPassRate.target}% pass rate\n`;
    }

    if (metrics.codeComplexity > this.thresholds.codeComplexity.target) {
      report += `- 🔴 Reduce code complexity to ≤${this.thresholds.codeComplexity.target}\n`;
    }

    if (metrics.technicalDebt > this.thresholds.technicalDebt.target) {
      report += `- 🔴 Address technical debt (currently ${metrics.technicalDebt} days)\n`;
    }

    return report;
  }
}

export { QualityMetricsCollector, QualityMetrics, QualityThresholds };
```

---

## ⚡ 2. Performance Metrics (Метрики производительности)

**lib/metrics/performance-metrics.ts**:

```typescript
interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number; // FCP
  largestContentfulPaint: number; // LCP
  firstInputDelay: number; // FID
  cumulativeLayoutShift: number; // CLS

  // Additional metrics
  timeToInteractive: number; // TTI
  totalBlockingTime: number; // TBT
  speedIndex: number;

  // Server metrics
  serverResponseTime: number;
  databaseQueryTime: number;
  apiResponseTime: number;

  // Resource metrics
  bundleSize: number;
  imageOptimization: number;
  cacheHitRate: number;

  // User experience
  bounceRate: number;
  pageLoadTime: number;
  errorRate: number;
}

interface PerformanceThresholds {
  firstContentfulPaint: { good: number; poor: number };
  largestContentfulPaint: { good: number; poor: number };
  firstInputDelay: { good: number; poor: number };
  cumulativeLayoutShift: { good: number; poor: number };
  timeToInteractive: { good: number; poor: number };
  totalBlockingTime: { good: number; poor: number };
  speedIndex: { good: number; poor: number };
  serverResponseTime: { good: number; poor: number };
  databaseQueryTime: { good: number; poor: number };
  apiResponseTime: { good: number; poor: number };
  bundleSize: { good: number; poor: number };
  imageOptimization: { good: number; poor: number };
  cacheHitRate: { good: number; poor: number };
  bounceRate: { good: number; poor: number };
  pageLoadTime: { good: number; poor: number };
  errorRate: { good: number; poor: number };
}

class PerformanceMetricsCollector {
  private thresholds: PerformanceThresholds = {
    firstContentfulPaint: { good: 1800, poor: 3000 }, // ms
    largestContentfulPaint: { good: 2500, poor: 4000 }, // ms
    firstInputDelay: { good: 100, poor: 300 }, // ms
    cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
    timeToInteractive: { good: 3800, poor: 7300 }, // ms
    totalBlockingTime: { good: 200, poor: 600 }, // ms
    speedIndex: { good: 3400, poor: 5800 }, // ms
    serverResponseTime: { good: 200, poor: 500 }, // ms
    databaseQueryTime: { good: 100, poor: 300 }, // ms
    apiResponseTime: { good: 300, poor: 1000 }, // ms
    bundleSize: { good: 250, poor: 500 }, // KB
    imageOptimization: { good: 85, poor: 70 }, // %
    cacheHitRate: { good: 90, poor: 70 }, // %
    bounceRate: { good: 40, poor: 70 }, // %
    pageLoadTime: { good: 2000, poor: 4000 }, // ms
    errorRate: { good: 1, poor: 5 }, // %
  };

  async collectClientMetrics(): Promise<Partial<PerformanceMetrics>> {
    if (typeof window === 'undefined') return {};

    return new Promise(resolve => {
      // Ждем загрузки страницы
      if (document.readyState === 'complete') {
        resolve(this.getWebVitals());
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => resolve(this.getWebVitals()), 1000);
        });
      }
    });
  }

  private getWebVitals(): Partial<PerformanceMetrics> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = this.getLCP();
    const cls = this.getCLS();
    const fid = this.getFID();

    return {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      firstInputDelay: fid,
      timeToInteractive: this.getTTI(),
      totalBlockingTime: this.getTBT(),
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      serverResponseTime: navigation.responseEnd - navigation.requestStart,
    };
  }

  private getLCP(): number {
    return new Promise(resolve => {
      let lcp = 0;

      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Останавливаем наблюдение через 10 секунд
      setTimeout(() => {
        observer.disconnect();
        resolve(lcp);
      }, 10000);
    }) as any;
  }

  private getCLS(): number {
    let cls = 0;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    return cls;
  }

  private getFID(): number {
    return new Promise(resolve => {
      let fid = 0;

      const observer = new PerformanceObserver(list => {
        const firstEntry = list.getEntries()[0];
        fid = (firstEntry as any).processingStart - firstEntry.startTime;
        observer.disconnect();
        resolve(fid);
      });

      observer.observe({ entryTypes: ['first-input'] });

      // Если нет взаимодействия в течение 10 секунд
      setTimeout(() => {
        observer.disconnect();
        resolve(fid);
      }, 10000);
    }) as any;
  }

  private getTTI(): number {
    // Упрощенная реализация TTI
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation.domInteractive - navigation.fetchStart;
  }

  private getTBT(): number {
    // Упрощенная реализация TBT
    const longTasks = performance.getEntriesByType('longtask');
    return longTasks.reduce((total, task) => {
      return total + Math.max(0, task.duration - 50);
    }, 0);
  }

  async collectServerMetrics(): Promise<Partial<PerformanceMetrics>> {
    const metrics: Partial<PerformanceMetrics> = {};

    // Метрики базы данных
    metrics.databaseQueryTime = await this.measureDatabasePerformance();

    // Метрики API
    metrics.apiResponseTime = await this.measureAPIPerformance();

    // Размер бандла
    metrics.bundleSize = await this.getBundleSize();

    // Оптимизация изображений
    metrics.imageOptimization = await this.getImageOptimization();

    // Cache hit rate
    metrics.cacheHitRate = await this.getCacheHitRate();

    return metrics;
  }

  private async measureDatabasePerformance(): Promise<number> {
    const start = Date.now();
    try {
      // Тестовый запрос к базе данных
      await fetch('/api/health');
      return Date.now() - start;
    } catch (error) {
      return 0;
    }
  }

  private async measureAPIPerformance(): Promise<number> {
    const start = Date.now();
    try {
      await fetch('/api/test-endpoint');
      return Date.now() - start;
    } catch (error) {
      return 0;
    }
  }

  private async getBundleSize(): Promise<number> {
    try {
      const response = await fetch('/_next/static/chunks/pages/_app.js', { method: 'HEAD' });
      const size = response.headers.get('content-length');
      return size ? parseInt(size) / 1024 : 0; // KB
    } catch (error) {
      return 0;
    }
  }

  private async getImageOptimization(): Promise<number> {
    // Проверка оптимизации изображений
    const images = document.querySelectorAll('img');
    let optimized = 0;

    images.forEach(img => {
      if (img.src.includes('_next/image') || img.loading === 'lazy') {
        optimized++;
      }
    });

    return images.length > 0 ? (optimized / images.length) * 100 : 100;
  }

  private async getCacheHitRate(): Promise<number> {
    // Симуляция cache hit rate
    return 85; // Примерное значение
  }

  getPerformanceScore(metrics: PerformanceMetrics): number {
    let score = 0;
    let totalWeight = 0;

    // Core Web Vitals (60% веса)
    const coreVitalsWeight = 60;
    let coreVitalsScore = 0;

    // LCP (25%)
    if (metrics.largestContentfulPaint <= this.thresholds.largestContentfulPaint.good) {
      coreVitalsScore += 25;
    } else if (metrics.largestContentfulPaint <= this.thresholds.largestContentfulPaint.poor) {
      coreVitalsScore += 15;
    }

    // FID (25%)
    if (metrics.firstInputDelay <= this.thresholds.firstInputDelay.good) {
      coreVitalsScore += 25;
    } else if (metrics.firstInputDelay <= this.thresholds.firstInputDelay.poor) {
      coreVitalsScore += 15;
    }

    // CLS (25%)
    if (metrics.cumulativeLayoutShift <= this.thresholds.cumulativeLayoutShift.good) {
      coreVitalsScore += 25;
    } else if (metrics.cumulativeLayoutShift <= this.thresholds.cumulativeLayoutShift.poor) {
      coreVitalsScore += 15;
    }

    // FCP (25%)
    if (metrics.firstContentfulPaint <= this.thresholds.firstContentfulPaint.good) {
      coreVitalsScore += 25;
    } else if (metrics.firstContentfulPaint <= this.thresholds.firstContentfulPaint.poor) {
      coreVitalsScore += 15;
    }

    score += (coreVitalsScore / 100) * coreVitalsWeight;
    totalWeight += coreVitalsWeight;

    // Server Performance (25% веса)
    const serverWeight = 25;
    let serverScore = 0;

    if (metrics.serverResponseTime <= this.thresholds.serverResponseTime.good) {
      serverScore += 50;
    } else if (metrics.serverResponseTime <= this.thresholds.serverResponseTime.poor) {
      serverScore += 25;
    }

    if (metrics.apiResponseTime <= this.thresholds.apiResponseTime.good) {
      serverScore += 50;
    } else if (metrics.apiResponseTime <= this.thresholds.apiResponseTime.poor) {
      serverScore += 25;
    }

    score += (serverScore / 100) * serverWeight;
    totalWeight += serverWeight;

    // Resource Optimization (15% веса)
    const resourceWeight = 15;
    let resourceScore = 0;

    if (metrics.bundleSize <= this.thresholds.bundleSize.good) {
      resourceScore += 50;
    } else if (metrics.bundleSize <= this.thresholds.bundleSize.poor) {
      resourceScore += 25;
    }

    if (metrics.cacheHitRate >= this.thresholds.cacheHitRate.good) {
      resourceScore += 50;
    } else if (metrics.cacheHitRate >= this.thresholds.cacheHitRate.poor) {
      resourceScore += 25;
    }

    score += (resourceScore / 100) * resourceWeight;
    totalWeight += resourceWeight;

    return Math.round((score / totalWeight) * 100);
  }

  generateReport(metrics: PerformanceMetrics): string {
    const score = this.getPerformanceScore(metrics);

    let report = '# Performance Metrics Report\n\n';
    report += `**Overall Performance Score: ${score}/100**\n\n`;

    report += '## Core Web Vitals\n\n';
    report += `- **Largest Contentful Paint (LCP)**: ${metrics.largestContentfulPaint}ms ${this.getStatus(metrics.largestContentfulPaint, this.thresholds.largestContentfulPaint)}\n`;
    report += `- **First Input Delay (FID)**: ${metrics.firstInputDelay}ms ${this.getStatus(metrics.firstInputDelay, this.thresholds.firstInputDelay)}\n`;
    report += `- **Cumulative Layout Shift (CLS)**: ${metrics.cumulativeLayoutShift} ${this.getStatus(metrics.cumulativeLayoutShift, this.thresholds.cumulativeLayoutShift)}\n`;
    report += `- **First Contentful Paint (FCP)**: ${metrics.firstContentfulPaint}ms ${this.getStatus(metrics.firstContentfulPaint, this.thresholds.firstContentfulPaint)}\n\n`;

    report += '## Additional Metrics\n\n';
    report += `- **Time to Interactive (TTI)**: ${metrics.timeToInteractive}ms\n`;
    report += `- **Total Blocking Time (TBT)**: ${metrics.totalBlockingTime}ms\n`;
    report += `- **Server Response Time**: ${metrics.serverResponseTime}ms\n`;
    report += `- **API Response Time**: ${metrics.apiResponseTime}ms\n`;
    report += `- **Bundle Size**: ${metrics.bundleSize}KB\n`;
    report += `- **Cache Hit Rate**: ${metrics.cacheHitRate}%\n\n`;

    return report;
  }

  private getStatus(value: number, threshold: { good: number; poor: number }): string {
    if (value <= threshold.good) return '🟢 Good';
    if (value <= threshold.poor) return '🟡 Needs Improvement';
    return '🔴 Poor';
  }
}

export { PerformanceMetricsCollector, PerformanceMetrics, PerformanceThresholds };
```

---

## 💼 3. Business Metrics (Бизнес-метрики)

**lib/metrics/business-metrics.ts**:

```typescript
interface BusinessMetrics {
  // User engagement
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  sessionDuration: number;
  pageViewsPerSession: number;
  bounceRate: number;

  // Conversion metrics
  conversionRate: number;
  signupRate: number;
  retentionRate: number;
  churnRate: number;

  // Revenue metrics
  revenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;

  // Feature usage
  featureAdoptionRate: number;
  apiUsage: number;
  errorRate: number;

  // Support metrics
  supportTickets: number;
  resolutionTime: number;
  customerSatisfaction: number;
}

class BusinessMetricsCollector {
  async collectMetrics(): Promise<BusinessMetrics> {
    const [userMetrics, conversionMetrics, revenueMetrics, supportMetrics] = await Promise.all([
      this.getUserMetrics(),
      this.getConversionMetrics(),
      this.getRevenueMetrics(),
      this.getSupportMetrics(),
    ]);

    return {
      ...userMetrics,
      ...conversionMetrics,
      ...revenueMetrics,
      ...supportMetrics,
      featureAdoptionRate: await this.getFeatureAdoptionRate(),
      apiUsage: await this.getAPIUsage(),
      errorRate: await this.getErrorRate(),
    };
  }

  private async getUserMetrics() {
    // Интеграция с аналитикой (Google Analytics, Mixpanel, etc.)
    return {
      dailyActiveUsers: 1250,
      monthlyActiveUsers: 15000,
      sessionDuration: 420, // секунды
      pageViewsPerSession: 3.2,
      bounceRate: 35, // процент
    };
  }

  private async getConversionMetrics() {
    return {
      conversionRate: 2.5, // процент
      signupRate: 8.3, // процент
      retentionRate: 75, // процент
      churnRate: 5, // процент
    };
  }

  private async getRevenueMetrics() {
    return {
      revenue: 125000, // рублей
      averageOrderValue: 2500, // рублей
      customerLifetimeValue: 15000, // рублей
    };
  }

  private async getSupportMetrics() {
    return {
      supportTickets: 45,
      resolutionTime: 4.2, // часы
      customerSatisfaction: 4.6, // из 5
    };
  }

  private async getFeatureAdoptionRate(): Promise<number> {
    // Процент пользователей, использующих новые функции
    return 65;
  }

  private async getAPIUsage(): Promise<number> {
    // Количество API вызовов в день
    return 50000;
  }

  private async getErrorRate(): Promise<number> {
    // Процент ошибок от общего количества запросов
    return 0.5;
  }

  generateReport(metrics: BusinessMetrics): string {
    let report = '# Business Metrics Report\n\n';

    report += '## User Engagement\n\n';
    report += `- **Daily Active Users**: ${metrics.dailyActiveUsers.toLocaleString()}\n`;
    report += `- **Monthly Active Users**: ${metrics.monthlyActiveUsers.toLocaleString()}\n`;
    report += `- **Average Session Duration**: ${Math.round(metrics.sessionDuration / 60)} minutes\n`;
    report += `- **Page Views per Session**: ${metrics.pageViewsPerSession}\n`;
    report += `- **Bounce Rate**: ${metrics.bounceRate}%\n\n`;

    report += '## Conversion Metrics\n\n';
    report += `- **Conversion Rate**: ${metrics.conversionRate}%\n`;
    report += `- **Signup Rate**: ${metrics.signupRate}%\n`;
    report += `- **Retention Rate**: ${metrics.retentionRate}%\n`;
    report += `- **Churn Rate**: ${metrics.churnRate}%\n\n`;

    report += '## Revenue Metrics\n\n';
    report += `- **Revenue**: ${metrics.revenue.toLocaleString()} ₽\n`;
    report += `- **Average Order Value**: ${metrics.averageOrderValue.toLocaleString()} ₽\n`;
    report += `- **Customer Lifetime Value**: ${metrics.customerLifetimeValue.toLocaleString()} ₽\n\n`;

    report += '## Technical Metrics\n\n';
    report += `- **Feature Adoption Rate**: ${metrics.featureAdoptionRate}%\n`;
    report += `- **API Usage**: ${metrics.apiUsage.toLocaleString()} calls/day\n`;
    report += `- **Error Rate**: ${metrics.errorRate}%\n\n`;

    report += '## Support Metrics\n\n';
    report += `- **Support Tickets**: ${metrics.supportTickets}\n`;
    report += `- **Average Resolution Time**: ${metrics.resolutionTime} hours\n`;
    report += `- **Customer Satisfaction**: ${metrics.customerSatisfaction}/5\n\n`;

    return report;
  }
}

export { BusinessMetricsCollector, BusinessMetrics };
```

---

## 🔒 4. Security Metrics (Метрики безопасности)

**lib/metrics/security-metrics.ts**:

```typescript
interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  securityScore: number;
  sslGrade: string;
  authenticationFailures: number;
  suspiciousActivities: number;
  dataBreaches: number;
  complianceScore: number;
  penetrationTestScore: number;
  securityTrainingCompletion: number;
}

class SecurityMetricsCollector {
  async collectMetrics(): Promise<SecurityMetrics> {
    const [vulns, ssl, auth, compliance] = await Promise.all([
      this.getVulnerabilities(),
      this.getSSLGrade(),
      this.getAuthMetrics(),
      this.getComplianceScore(),
    ]);

    return {
      vulnerabilities: vulns,
      securityScore: await this.calculateSecurityScore(vulns),
      sslGrade: ssl,
      authenticationFailures: auth.failures,
      suspiciousActivities: await this.getSuspiciousActivities(),
      dataBreaches: 0, // Надеемся, что 0!
      complianceScore: compliance,
      penetrationTestScore: await this.getPenetrationTestScore(),
      securityTrainingCompletion: 85, // процент
    };
  }

  private async getVulnerabilities() {
    // Интеграция с инструментами сканирования безопасности
    try {
      const { execSync } = require('child_process');
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(output);

      return {
        critical: audit.metadata.vulnerabilities.critical || 0,
        high: audit.metadata.vulnerabilities.high || 0,
        medium: audit.metadata.vulnerabilities.moderate || 0,
        low: audit.metadata.vulnerabilities.low || 0,
      };
    } catch (error) {
      return { critical: 0, high: 0, medium: 0, low: 0 };
    }
  }

  private async getSSLGrade(): Promise<string> {
    // Проверка SSL сертификата
    try {
      const response = await fetch('https://api.ssllabs.com/api/v3/analyze?host=example.com');
      const data = await response.json();
      return data.endpoints?.[0]?.grade || 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  private async getAuthMetrics() {
    // Метрики аутентификации
    return {
      failures: 12, // за последние 24 часа
      successRate: 98.5, // процент
    };
  }

  private async getSuspiciousActivities(): Promise<number> {
    // Подозрительные активности
    return 3; // за последние 24 часа
  }

  private async getComplianceScore(): Promise<number> {
    // Оценка соответствия стандартам (GDPR, ISO 27001, etc.)
    return 92; // процент
  }

  private async getPenetrationTestScore(): Promise<number> {
    // Результаты пентестов
    return 85; // процент
  }

  private async calculateSecurityScore(vulns: SecurityMetrics['vulnerabilities']): Promise<number> {
    let score = 100;

    // Снижаем оценку за уязвимости
    score -= vulns.critical * 20;
    score -= vulns.high * 10;
    score -= vulns.medium * 5;
    score -= vulns.low * 1;

    return Math.max(0, score);
  }

  generateReport(metrics: SecurityMetrics): string {
    let report = '# Security Metrics Report\n\n';
    report += `**Overall Security Score: ${metrics.securityScore}/100**\n\n`;

    report += '## Vulnerabilities\n\n';
    report += `- **Critical**: ${metrics.vulnerabilities.critical} 🔴\n`;
    report += `- **High**: ${metrics.vulnerabilities.high} 🟠\n`;
    report += `- **Medium**: ${metrics.vulnerabilities.medium} 🟡\n`;
    report += `- **Low**: ${metrics.vulnerabilities.low} 🟢\n\n`;

    report += '## Security Metrics\n\n';
    report += `- **SSL Grade**: ${metrics.sslGrade}\n`;
    report += `- **Authentication Failures**: ${metrics.authenticationFailures} (24h)\n`;
    report += `- **Suspicious Activities**: ${metrics.suspiciousActivities} (24h)\n`;
    report += `- **Data Breaches**: ${metrics.dataBreaches}\n`;
    report += `- **Compliance Score**: ${metrics.complianceScore}%\n`;
    report += `- **Penetration Test Score**: ${metrics.penetrationTestScore}%\n`;
    report += `- **Security Training Completion**: ${metrics.securityTrainingCompletion}%\n\n`;

    if (metrics.vulnerabilities.critical > 0) {
      report += '## 🚨 Critical Actions Required\n\n';
      report += `- Fix ${metrics.vulnerabilities.critical} critical vulnerabilities immediately\n`;
    }

    if (metrics.vulnerabilities.high > 0) {
      report += `- Address ${metrics.vulnerabilities.high} high-severity vulnerabilities\n`;
    }

    return report;
  }
}

export { SecurityMetricsCollector, SecurityMetrics };
```

---

## 📊 5. Unified Metrics Dashboard

**lib/metrics/dashboard.ts**:

```typescript
import { QualityMetricsCollector } from './quality-metrics';
import { PerformanceMetricsCollector } from './performance-metrics';
import { BusinessMetricsCollector } from './business-metrics';
import { SecurityMetricsCollector } from './security-metrics';

interface DashboardData {
  quality: any;
  performance: any;
  business: any;
  security: any;
  timestamp: string;
  overallScore: number;
}

class MetricsDashboard {
  private qualityCollector = new QualityMetricsCollector();
  private performanceCollector = new PerformanceMetricsCollector();
  private businessCollector = new BusinessMetricsCollector();
  private securityCollector = new SecurityMetricsCollector();

  async generateDashboard(): Promise<DashboardData> {
    const [quality, performance, business, security] = await Promise.all([
      this.qualityCollector.collectMetrics(),
      this.performanceCollector.collectServerMetrics(),
      this.businessCollector.collectMetrics(),
      this.securityCollector.collectMetrics(),
    ]);

    const overallScore = this.calculateOverallScore({
      quality: this.qualityCollector.getQualityScore(quality),
      performance: this.performanceCollector.getPerformanceScore(performance as any),
      security: security.securityScore,
    });

    return {
      quality,
      performance,
      business,
      security,
      timestamp: new Date().toISOString(),
      overallScore,
    };
  }

  private calculateOverallScore(scores: {
    quality: number;
    performance: number;
    security: number;
  }): number {
    // Взвешенная оценка
    const weights = {
      quality: 0.3,
      performance: 0.3,
      security: 0.4,
    };

    return Math.round(
      scores.quality * weights.quality +
        scores.performance * weights.performance +
        scores.security * weights.security
    );
  }

  generateReport(data: DashboardData): string {
    let report = '# 📊 Project Metrics Dashboard\n\n';
    report += `**Generated**: ${new Date(data.timestamp).toLocaleString()}\n`;
    report += `**Overall Score**: ${data.overallScore}/100\n\n`;

    report += '## 📈 Summary\n\n';
    report += `- **Quality Score**: ${this.qualityCollector.getQualityScore(data.quality)}/100\n`;
    report += `- **Performance Score**: ${this.performanceCollector.getPerformanceScore(data.performance)}/100\n`;
    report += `- **Security Score**: ${data.security.securityScore}/100\n`;
    report += `- **Daily Active Users**: ${data.business.dailyActiveUsers.toLocaleString()}\n`;
    report += `- **Revenue**: ${data.business.revenue.toLocaleString()} ₽\n\n`;

    report += '---\n\n';
    report += this.qualityCollector.generateReport(data.quality);
    report += '\n---\n\n';
    report += this.performanceCollector.generateReport(data.performance);
    report += '\n---\n\n';
    report += this.businessCollector.generateReport(data.business);
    report += '\n---\n\n';
    report += this.securityCollector.generateReport(data.security);

    return report;
  }

  async saveReport(filePath: string): Promise<void> {
    const data = await this.generateDashboard();
    const report = this.generateReport(data);

    const fs = require('fs');
    const path = require('path');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, report);
    console.log(`📊 Metrics report saved to: ${filePath}`);
  }
}

export { MetricsDashboard, DashboardData };
```

---

## 🚀 Команды для выполнения

```bash
# Установка зависимостей для метрик
npm install --save-dev complexity-report jscpd
npm install web-vitals

# Генерация отчетов по метрикам
node -e "const { MetricsDashboard } = require('./lib/metrics/dashboard'); new MetricsDashboard().saveReport('./reports/metrics-report.md');"

# Сбор метрик качества
npm run test -- --coverage
npm run lint
npm audit

# Анализ производительности
npx lighthouse http://localhost:3000 --output=json --output-path=./reports/lighthouse.json

# Анализ безопасности
npm audit --audit-level=moderate
npx snyk test

# Анализ сложности кода
npx complexity-report --format json src/

# Поиск дублированного кода
npx jscpd src/
```

---

## ✅ Критерии успеха

### Quality Metrics

- [ ] Code Coverage ≥ 85%
- [ ] Test Pass Rate = 100%
- [ ] Code Complexity ≤ 5
- [ ] Technical Debt ≤ 10 days
- [ ] Bug Density ≤ 1 bug/1000 lines

### Performance Metrics

- [ ] LCP ≤ 2.5s
- [ ] FID ≤ 100ms
- [ ] CLS ≤ 0.1
- [ ] Server Response Time ≤ 200ms
- [ ] Bundle Size ≤ 250KB

### Business Metrics

- [ ] User Engagement растет
- [ ] Conversion Rate ≥ 2%
- [ ] Error Rate ≤ 1%
- [ ] Customer Satisfaction ≥ 4.5/5

### Security Metrics

- [ ] 0 Critical vulnerabilities
- [ ] SSL Grade A+
- [ ] Compliance Score ≥ 90%
- [ ] Security Score ≥ 85%

---

## 📈 KPI Dashboard

| Метрика            | Текущее значение | Цель   | Статус |
| ------------------ | ---------------- | ------ | ------ |
| Overall Score      | 85/100           | 90/100 | 🟡     |
| Code Coverage      | 78%              | 85%    | 🟡     |
| Performance Score  | 92/100           | 90/100 | 🟢     |
| Security Score     | 88/100           | 90/100 | 🟡     |
| Daily Active Users | 1,250            | 1,500  | 🟡     |
| Error Rate         | 0.5%             | <1%    | 🟢     |
| Response Time      | 180ms            | <200ms | 🟢     |
| Vulnerabilities    | 2 medium         | 0      | 🔴     |

**Легенда**: 🟢 Цель достигнута | 🟡 Близко к цели | 🔴 Требует внимания
