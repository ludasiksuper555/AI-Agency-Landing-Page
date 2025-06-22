const databaseManager = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class AnalyticsService {
  constructor() {
    this.metrics = {
      searches: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        successful: 0,
        failed: 0
      },
      proposals: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        sent: 0,
        pending: 0,
        responses: 0
      },
      projects: {
        found: 0,
        applied: 0,
        won: 0,
        lost: 0,
        pending: 0
      },
      platforms: {
        upwork: { searches: 0, projects: 0, proposals: 0 },
        freelancer: { searches: 0, projects: 0, proposals: 0 },
        fiverr: { searches: 0, projects: 0, proposals: 0 }
      },
      performance: {
        responseRate: 0,
        winRate: 0,
        averageProposalLength: 0,
        averageSearchTime: 0,
        averageGenerationTime: 0
      },
      lastUpdated: new Date()
    };

    this.dailyStats = new Map();
    this.weeklyStats = new Map();
    this.monthlyStats = new Map();

    this.loadStoredMetrics();
  }

  async loadStoredMetrics() {
    try {
      const statsFile = path.join(__dirname, '..', 'data', 'stats.json');

      try {
        const data = await fs.readFile(statsFile, 'utf8');
        const storedMetrics = JSON.parse(data);
        this.metrics = { ...this.metrics, ...storedMetrics };
        logger.info('Analytics metrics loaded from storage');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          logger.error('Failed to load stored metrics:', error);
        }
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(statsFile);
        await fs.mkdir(dataDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to initialize analytics storage:', error);
    }
  }

  async saveMetrics() {
    try {
      const statsFile = path.join(__dirname, '..', 'data', 'stats.json');
      await fs.writeFile(statsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      logger.error('Failed to save metrics:', error);
    }
  }

  // Search Analytics
  recordSearch(platform, success, searchTime, projectsFound = 0) {
    const today = this.getDateKey();
    const week = this.getWeekKey();
    const month = this.getMonthKey();

    // Update main metrics
    this.metrics.searches.total++;
    this.metrics.searches.today = this.getDailyCount('searches', today);
    this.metrics.searches.thisWeek = this.getWeeklyCount('searches', week);
    this.metrics.searches.thisMonth = this.getMonthlyCount('searches', month);

    if (success) {
      this.metrics.searches.successful++;
      this.metrics.projects.found += projectsFound;
    } else {
      this.metrics.searches.failed++;
    }

    // Update platform metrics
    if (this.metrics.platforms[platform]) {
      this.metrics.platforms[platform].searches++;
      this.metrics.platforms[platform].projects += projectsFound;
    }

    // Update performance metrics
    this.updateAverageSearchTime(searchTime);

    // Record daily stats
    this.recordDailyEvent('searches', today, {
      platform,
      success,
      searchTime,
      projectsFound
    });

    this.metrics.lastUpdated = new Date();
    this.saveMetrics();

    logger.debug('Search recorded', {
      platform,
      success,
      searchTime,
      projectsFound
    });
  }

  // Proposal Analytics
  recordProposal(platform, projectId, generationTime, wordCount, sent = false) {
    const today = this.getDateKey();
    const week = this.getWeekKey();
    const month = this.getMonthKey();

    // Update main metrics
    this.metrics.proposals.total++;
    this.metrics.proposals.today = this.getDailyCount('proposals', today);
    this.metrics.proposals.thisWeek = this.getWeeklyCount('proposals', week);
    this.metrics.proposals.thisMonth = this.getMonthlyCount('proposals', month);

    if (sent) {
      this.metrics.proposals.sent++;
      this.metrics.projects.applied++;
    } else {
      this.metrics.proposals.pending++;
    }

    // Update platform metrics
    if (this.metrics.platforms[platform]) {
      this.metrics.platforms[platform].proposals++;
    }

    // Update performance metrics
    this.updateAverageProposalLength(wordCount);
    this.updateAverageGenerationTime(generationTime);

    // Record daily stats
    this.recordDailyEvent('proposals', today, {
      platform,
      projectId,
      generationTime,
      wordCount,
      sent
    });

    this.metrics.lastUpdated = new Date();
    this.saveMetrics();

    logger.debug('Proposal recorded', {
      platform,
      projectId,
      generationTime,
      wordCount,
      sent
    });
  }

  // Project Status Updates
  recordProjectResponse(projectId, platform, responded = true) {
    if (responded) {
      this.metrics.proposals.responses++;
    }

    this.updateResponseRate();

    // Record event
    const today = this.getDateKey();
    this.recordDailyEvent('responses', today, {
      projectId,
      platform,
      responded
    });

    this.metrics.lastUpdated = new Date();
    this.saveMetrics();

    logger.debug('Project response recorded', {
      projectId,
      platform,
      responded
    });
  }

  recordProjectWin(projectId, platform, budget = 0) {
    this.metrics.projects.won++;
    this.metrics.projects.pending--;

    this.updateWinRate();

    // Record event
    const today = this.getDateKey();
    this.recordDailyEvent('wins', today, {
      projectId,
      platform,
      budget
    });

    this.metrics.lastUpdated = new Date();
    this.saveMetrics();

    logger.info('Project win recorded', {
      projectId,
      platform,
      budget
    });
  }

  recordProjectLoss(projectId, platform, reason = '') {
    this.metrics.projects.lost++;
    this.metrics.projects.pending--;

    this.updateWinRate();

    // Record event
    const today = this.getDateKey();
    this.recordDailyEvent('losses', today, {
      projectId,
      platform,
      reason
    });

    this.metrics.lastUpdated = new Date();
    this.saveMetrics();

    logger.debug('Project loss recorded', {
      projectId,
      platform,
      reason
    });
  }

  // Performance Calculations
  updateResponseRate() {
    const totalSent = this.metrics.proposals.sent;
    const totalResponses = this.metrics.proposals.responses;
    this.metrics.performance.responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0;
  }

  updateWinRate() {
    const totalApplied = this.metrics.projects.applied;
    const totalWon = this.metrics.projects.won;
    this.metrics.performance.winRate = totalApplied > 0 ? (totalWon / totalApplied) * 100 : 0;
  }

  updateAverageSearchTime(searchTime) {
    const total = this.metrics.searches.total;
    const currentAvg = this.metrics.performance.averageSearchTime;
    this.metrics.performance.averageSearchTime = (currentAvg * (total - 1) + searchTime) / total;
  }

  updateAverageProposalLength(wordCount) {
    const total = this.metrics.proposals.total;
    const currentAvg = this.metrics.performance.averageProposalLength;
    this.metrics.performance.averageProposalLength = (currentAvg * (total - 1) + wordCount) / total;
  }

  updateAverageGenerationTime(generationTime) {
    const total = this.metrics.proposals.total;
    const currentAvg = this.metrics.performance.averageGenerationTime;
    this.metrics.performance.averageGenerationTime =
      (currentAvg * (total - 1) + generationTime) / total;
  }

  // Daily/Weekly/Monthly Stats
  recordDailyEvent(eventType, dateKey, eventData) {
    if (!this.dailyStats.has(dateKey)) {
      this.dailyStats.set(dateKey, {});
    }

    const dayStats = this.dailyStats.get(dateKey);
    if (!dayStats[eventType]) {
      dayStats[eventType] = [];
    }

    dayStats[eventType].push({
      timestamp: new Date().toISOString(),
      ...eventData
    });

    // Keep only last 30 days
    if (this.dailyStats.size > 30) {
      const oldestKey = Math.min(...Array.from(this.dailyStats.keys()));
      this.dailyStats.delete(oldestKey);
    }
  }

  getDailyCount(eventType, dateKey) {
    const dayStats = this.dailyStats.get(dateKey);
    return dayStats && dayStats[eventType] ? dayStats[eventType].length : 0;
  }

  getWeeklyCount(eventType, weekKey) {
    let count = 0;
    const weekStart = new Date(weekKey);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const [dateKey, dayStats] of this.dailyStats.entries()) {
      const date = new Date(dateKey);
      if (date >= weekStart && date < weekEnd && dayStats[eventType]) {
        count += dayStats[eventType].length;
      }
    }

    return count;
  }

  getMonthlyCount(eventType, monthKey) {
    let count = 0;
    const [year, month] = monthKey.split('-');

    for (const [dateKey, dayStats] of this.dailyStats.entries()) {
      const date = new Date(dateKey);
      if (date.getFullYear() == year && date.getMonth() == month - 1 && dayStats[eventType]) {
        count += dayStats[eventType].length;
      }
    }

    return count;
  }

  // Report Generation
  generateDailyReport(date = new Date()) {
    const dateKey = this.getDateKey(date);
    const dayStats = this.dailyStats.get(dateKey) || {};

    return {
      date: dateKey,
      searches: {
        total: dayStats.searches?.length || 0,
        successful: dayStats.searches?.filter(s => s.success).length || 0,
        projectsFound: dayStats.searches?.reduce((sum, s) => sum + (s.projectsFound || 0), 0) || 0
      },
      proposals: {
        total: dayStats.proposals?.length || 0,
        sent: dayStats.proposals?.filter(p => p.sent).length || 0,
        averageLength: this.calculateAverage(dayStats.proposals, 'wordCount')
      },
      responses: dayStats.responses?.length || 0,
      wins: dayStats.wins?.length || 0,
      losses: dayStats.losses?.length || 0,
      platforms: this.calculatePlatformStats(dayStats)
    };
  }

  generateWeeklyReport(weekStart = new Date()) {
    const weekKey = this.getWeekKey(weekStart);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekData = {
      searches: [],
      proposals: [],
      responses: [],
      wins: [],
      losses: []
    };

    // Collect all events for the week
    for (const [dateKey, dayStats] of this.dailyStats.entries()) {
      const date = new Date(dateKey);
      if (date >= weekStart && date < weekEnd) {
        Object.keys(weekData).forEach(eventType => {
          if (dayStats[eventType]) {
            weekData[eventType].push(...dayStats[eventType]);
          }
        });
      }
    }

    return {
      weekStart: weekKey,
      weekEnd: weekEnd.toISOString().split('T')[0],
      searches: {
        total: weekData.searches.length,
        successful: weekData.searches.filter(s => s.success).length,
        projectsFound: weekData.searches.reduce((sum, s) => sum + (s.projectsFound || 0), 0)
      },
      proposals: {
        total: weekData.proposals.length,
        sent: weekData.proposals.filter(p => p.sent).length,
        averageLength: this.calculateAverage(weekData.proposals, 'wordCount')
      },
      responses: weekData.responses.length,
      wins: weekData.wins.length,
      losses: weekData.losses.length,
      performance: {
        responseRate:
          weekData.proposals.filter(p => p.sent).length > 0
            ? (weekData.responses.length / weekData.proposals.filter(p => p.sent).length) * 100
            : 0,
        winRate:
          weekData.responses.length > 0
            ? (weekData.wins.length / weekData.responses.length) * 100
            : 0
      }
    };
  }

  generateMonthlyReport(month = new Date()) {
    const monthKey = this.getMonthKey(month);
    const [year, monthNum] = monthKey.split('-');

    const monthData = {
      searches: [],
      proposals: [],
      responses: [],
      wins: [],
      losses: []
    };

    // Collect all events for the month
    for (const [dateKey, dayStats] of this.dailyStats.entries()) {
      const date = new Date(dateKey);
      if (date.getFullYear() == year && date.getMonth() == monthNum - 1) {
        Object.keys(monthData).forEach(eventType => {
          if (dayStats[eventType]) {
            monthData[eventType].push(...dayStats[eventType]);
          }
        });
      }
    }

    return {
      month: monthKey,
      searches: {
        total: monthData.searches.length,
        successful: monthData.searches.filter(s => s.success).length,
        projectsFound: monthData.searches.reduce((sum, s) => sum + (s.projectsFound || 0), 0),
        averagePerDay: monthData.searches.length / new Date(year, monthNum, 0).getDate()
      },
      proposals: {
        total: monthData.proposals.length,
        sent: monthData.proposals.filter(p => p.sent).length,
        averageLength: this.calculateAverage(monthData.proposals, 'wordCount'),
        averagePerDay: monthData.proposals.length / new Date(year, monthNum, 0).getDate()
      },
      responses: monthData.responses.length,
      wins: monthData.wins.length,
      losses: monthData.losses.length,
      revenue: monthData.wins.reduce((sum, w) => sum + (w.budget || 0), 0),
      performance: {
        responseRate:
          monthData.proposals.filter(p => p.sent).length > 0
            ? (monthData.responses.length / monthData.proposals.filter(p => p.sent).length) * 100
            : 0,
        winRate:
          monthData.responses.length > 0
            ? (monthData.wins.length / monthData.responses.length) * 100
            : 0
      }
    };
  }

  // Utility Methods
  calculateAverage(array, property) {
    if (!array || array.length === 0) return 0;
    const sum = array.reduce((total, item) => total + (item[property] || 0), 0);
    return sum / array.length;
  }

  calculatePlatformStats(dayStats) {
    const platforms = { upwork: 0, freelancer: 0, fiverr: 0 };

    Object.values(dayStats).forEach(events => {
      if (Array.isArray(events)) {
        events.forEach(event => {
          if (event.platform && platforms.hasOwnProperty(event.platform)) {
            platforms[event.platform]++;
          }
        });
      }
    });

    return platforms;
  }

  getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  getWeekKey(date = new Date()) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  }

  getMonthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Public API
  getMetrics() {
    return { ...this.metrics };
  }

  getPlatformStats() {
    return { ...this.metrics.platforms };
  }

  getPerformanceMetrics() {
    return { ...this.metrics.performance };
  }

  async exportData(format = 'json') {
    try {
      const data = {
        metrics: this.metrics,
        dailyStats: Object.fromEntries(this.dailyStats),
        exportDate: new Date().toISOString()
      };

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(data);
      }

      throw new Error(`Unsupported export format: ${format}`);
    } catch (error) {
      logger.error('Failed to export analytics data:', error);
      throw error;
    }
  }

  convertToCSV(data) {
    // Simple CSV conversion for daily stats
    const headers = ['Date', 'Searches', 'Proposals', 'Responses', 'Wins', 'Losses'];
    const rows = [headers.join(',')];

    for (const [date, stats] of Object.entries(data.dailyStats)) {
      const row = [
        date,
        stats.searches?.length || 0,
        stats.proposals?.length || 0,
        stats.responses?.length || 0,
        stats.wins?.length || 0,
        stats.losses?.length || 0
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  resetMetrics() {
    this.metrics = {
      searches: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, successful: 0, failed: 0 },
      proposals: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        sent: 0,
        pending: 0,
        responses: 0
      },
      projects: { found: 0, applied: 0, won: 0, lost: 0, pending: 0 },
      platforms: {
        upwork: { searches: 0, projects: 0, proposals: 0 },
        freelancer: { searches: 0, projects: 0, proposals: 0 },
        fiverr: { searches: 0, projects: 0, proposals: 0 }
      },
      performance: {
        responseRate: 0,
        winRate: 0,
        averageProposalLength: 0,
        averageSearchTime: 0,
        averageGenerationTime: 0
      },
      lastUpdated: new Date()
    };

    this.dailyStats.clear();
    this.saveMetrics();

    logger.info('Analytics metrics reset');
  }
}

module.exports = new AnalyticsService();
