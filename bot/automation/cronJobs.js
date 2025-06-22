const cron = require('node-cron');
const logger = require('../utils/logger');
const projectSearchService = require('../services/projectSearch');
const proposalGeneratorService = require('../services/proposalGenerator');
const analyticsService = require('../services/analytics');
const { ValidationService } = require('../utils/validation');

class CronJobManager {
  constructor(bot) {
    this.bot = bot;
    this.jobs = new Map();
    this.isInitialized = false;
    this.userSettings = new Map(); // Cache for user settings
  }

  // Initialize all cron jobs
  async initialize() {
    try {
      logger.cronJob('Initializing cron job manager');

      // Auto search for projects every 2 hours
      this.scheduleJob('auto-search', '0 */2 * * *', this.autoSearchProjects.bind(this));

      // Daily analytics report at 9 AM
      this.scheduleJob('daily-report', '0 9 * * *', this.sendDailyReports.bind(this));

      // Weekly summary every Monday at 10 AM
      this.scheduleJob('weekly-summary', '0 10 * * 1', this.sendWeeklySummary.bind(this));

      // Clean up old data every day at 2 AM
      this.scheduleJob('cleanup', '0 2 * * *', this.cleanupOldData.bind(this));

      // Health check every 30 minutes
      this.scheduleJob('health-check', '*/30 * * * *', this.performHealthCheck.bind(this));

      // Update user statistics every hour
      this.scheduleJob('update-stats', '0 * * * *', this.updateUserStatistics.bind(this));

      // Check for high-value projects every hour
      this.scheduleJob('high-value-check', '15 * * * *', this.checkHighValueProjects.bind(this));

      // Backup important data every 6 hours
      this.scheduleJob('backup', '0 */6 * * *', this.backupData.bind(this));

      this.isInitialized = true;
      logger.cronJob('Cron job manager initialized successfully');
    } catch (error) {
      logger.errorWithContext(error, { action: 'cron_initialization' });
      throw error;
    }
  }

  // Schedule a new cron job
  scheduleJob(name, schedule, task) {
    try {
      if (this.jobs.has(name)) {
        logger.cronJob(`Stopping existing job: ${name}`);
        this.jobs.get(name).stop();
      }

      const job = cron.schedule(
        schedule,
        async () => {
          const startTime = Date.now();
          try {
            logger.cronJob(`Starting job: ${name}`);
            await task();
            const duration = Date.now() - startTime;
            logger.cronJob(`Completed job: ${name} in ${duration}ms`);
          } catch (error) {
            logger.errorWithContext(error, {
              cronJob: name,
              schedule,
              duration: Date.now() - startTime
            });
          }
        },
        {
          scheduled: false,
          timezone: process.env.TIMEZONE || 'UTC'
        }
      );

      this.jobs.set(name, job);
      job.start();

      logger.cronJob(`Scheduled job: ${name} with schedule: ${schedule}`);
    } catch (error) {
      logger.errorWithContext(error, { jobName: name, schedule });
      throw error;
    }
  }

  // Auto search for projects
  async autoSearchProjects() {
    try {
      logger.cronJob('Starting auto search for projects');

      const activeUsers = await this.getActiveUsers();
      let totalProjectsFound = 0;
      let totalUsersProcessed = 0;

      for (const user of activeUsers) {
        try {
          const userSettings = await this.getUserSettings(user.id);

          if (!userSettings.search?.autoSearch) {
            continue;
          }

          const searchParams = {
            keywords: userSettings.search.keywords || [],
            platforms: userSettings.search.platforms || ['upwork', 'freelancer', 'fiverr'],
            minBudget: userSettings.search.minBudget,
            maxBudget: userSettings.search.maxBudget,
            sortBy: 'newest',
            limit: 50
          };

          const results = await projectSearchService.searchProjects(searchParams);

          if (results && results.length > 0) {
            // Filter new projects (not seen before)
            const newProjects = await this.filterNewProjects(user.id, results);

            if (newProjects.length > 0) {
              totalProjectsFound += newProjects.length;

              // Send notification about new projects
              if (userSettings.notifications?.newProjects) {
                await this.sendNewProjectsNotification(user.id, newProjects);
              }

              // Store projects for later use
              await this.storeUserProjects(user.id, newProjects);

              // Auto-generate proposals if enabled
              if (userSettings.ai?.autoGenerate && newProjects.length <= 5) {
                await this.autoGenerateProposals(user.id, newProjects, userSettings);
              }
            }
          }

          totalUsersProcessed++;

          // Small delay between users to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          logger.errorWithContext(error, {
            userId: user.id,
            action: 'auto_search_user'
          });
        }
      }

      logger.cronJob(
        `Auto search completed: ${totalProjectsFound} projects found for ${totalUsersProcessed} users`
      );

      // Record analytics
      analyticsService.recordCronJob('auto_search', {
        usersProcessed: totalUsersProcessed,
        projectsFound: totalProjectsFound,
        duration: Date.now()
      });
    } catch (error) {
      logger.errorWithContext(error, { action: 'auto_search_projects' });
    }
  }

  // Send daily reports to users
  async sendDailyReports() {
    try {
      logger.cronJob('Starting daily reports');

      const activeUsers = await this.getActiveUsers();
      let reportsGenerated = 0;

      for (const user of activeUsers) {
        try {
          const userSettings = await this.getUserSettings(user.id);

          if (!userSettings.notifications?.dailyReports) {
            continue;
          }

          const stats = await analyticsService.getDailyStats(user.id);
          const report = await this.generateDailyReport(user.id, stats);

          await this.bot.telegram.sendMessage(user.id, report, {
            parse_mode: 'Markdown'
          });

          reportsGenerated++;

          // Small delay between reports
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.errorWithContext(error, {
            userId: user.id,
            action: 'daily_report_user'
          });
        }
      }

      logger.cronJob(`Daily reports sent to ${reportsGenerated} users`);
    } catch (error) {
      logger.errorWithContext(error, { action: 'send_daily_reports' });
    }
  }

  // Send weekly summary
  async sendWeeklySummary() {
    try {
      logger.cronJob('Starting weekly summary');

      const activeUsers = await this.getActiveUsers();
      let summariesSent = 0;

      for (const user of activeUsers) {
        try {
          const userSettings = await this.getUserSettings(user.id);

          if (!userSettings.notifications?.weeklyReports) {
            continue;
          }

          const stats = await analyticsService.getWeeklyStats(user.id);
          const summary = await this.generateWeeklySummary(user.id, stats);

          await this.bot.telegram.sendMessage(user.id, summary, {
            parse_mode: 'Markdown'
          });

          summariesSent++;

          // Small delay between summaries
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.errorWithContext(error, {
            userId: user.id,
            action: 'weekly_summary_user'
          });
        }
      }

      logger.cronJob(`Weekly summaries sent to ${summariesSent} users`);
    } catch (error) {
      logger.errorWithContext(error, { action: 'send_weekly_summary' });
    }
  }

  // Clean up old data
  async cleanupOldData() {
    try {
      logger.cronJob('Starting data cleanup');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

      const cleanupStats = {
        searchHistory: 0,
        proposalHistory: 0,
        analytics: 0,
        logs: 0
      };

      // Clean up old search history
      cleanupStats.searchHistory = await this.cleanupSearchHistory(cutoffDate);

      // Clean up old proposal history (keep for 60 days)
      const proposalCutoff = new Date();
      proposalCutoff.setDate(proposalCutoff.getDate() - 60);
      cleanupStats.proposalHistory = await this.cleanupProposalHistory(proposalCutoff);

      // Clean up old analytics data (keep aggregated data)
      cleanupStats.analytics = await this.cleanupAnalyticsData(cutoffDate);

      // Clean up old log files
      cleanupStats.logs = await this.cleanupLogFiles(cutoffDate);

      logger.cronJob(`Data cleanup completed:`, cleanupStats);
    } catch (error) {
      logger.errorWithContext(error, { action: 'cleanup_old_data' });
    }
  }

  // Perform health check
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date(),
        database: false,
        apis: {},
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        activeJobs: this.jobs.size
      };

      // Check database connectivity
      try {
        // This would check your database connection
        healthStatus.database = true;
      } catch (error) {
        logger.errorWithContext(error, { check: 'database' });
      }

      // Check API endpoints
      const apis = ['upwork', 'freelancer', 'fiverr', 'openai'];
      for (const api of apis) {
        try {
          healthStatus.apis[api] = await this.checkApiHealth(api);
        } catch (error) {
          healthStatus.apis[api] = false;
          logger.errorWithContext(error, { check: `api_${api}` });
        }
      }

      // Log health status
      logger.cronJob('Health check completed', healthStatus);

      // Alert if critical issues found
      const criticalIssues = [];
      if (!healthStatus.database) criticalIssues.push('Database');
      if (!healthStatus.apis.openai) criticalIssues.push('OpenAI API');

      if (criticalIssues.length > 0) {
        await this.sendHealthAlert(criticalIssues, healthStatus);
      }
    } catch (error) {
      logger.errorWithContext(error, { action: 'health_check' });
    }
  }

  // Update user statistics
  async updateUserStatistics() {
    try {
      logger.cronJob('Updating user statistics');

      const activeUsers = await this.getActiveUsers();
      let usersUpdated = 0;

      for (const user of activeUsers) {
        try {
          await analyticsService.updateUserStats(user.id);
          usersUpdated++;
        } catch (error) {
          logger.errorWithContext(error, {
            userId: user.id,
            action: 'update_user_stats'
          });
        }
      }

      logger.cronJob(`Updated statistics for ${usersUpdated} users`);
    } catch (error) {
      logger.errorWithContext(error, { action: 'update_user_statistics' });
    }
  }

  // Check for high-value projects
  async checkHighValueProjects() {
    try {
      logger.cronJob('Checking for high-value projects');

      const highValueThreshold = 5000; // $5000+
      const searchParams = {
        minBudget: highValueThreshold,
        platforms: ['upwork', 'freelancer'],
        sortBy: 'budget',
        limit: 20
      };

      const projects = await projectSearchService.searchProjects(searchParams);

      if (projects && projects.length > 0) {
        const interestedUsers = await this.getUsersInterestedInHighValue();

        for (const user of interestedUsers) {
          try {
            await this.sendHighValueProjectAlert(user.id, projects);
          } catch (error) {
            logger.errorWithContext(error, {
              userId: user.id,
              action: 'high_value_alert'
            });
          }
        }

        logger.cronJob(
          `Found ${projects.length} high-value projects, alerted ${interestedUsers.length} users`
        );
      }
    } catch (error) {
      logger.errorWithContext(error, { action: 'check_high_value_projects' });
    }
  }

  // Backup important data
  async backupData() {
    try {
      logger.cronJob('Starting data backup');

      const backupData = {
        timestamp: new Date(),
        userSettings: await this.exportUserSettings(),
        analytics: await analyticsService.exportData(),
        systemStats: {
          totalUsers: await this.getTotalUsers(),
          totalSearches: await analyticsService.getTotalSearches(),
          totalProposals: await analyticsService.getTotalProposals()
        }
      };

      // Save backup to file or cloud storage
      const backupPath = await this.saveBackup(backupData);

      logger.cronJob(`Data backup completed: ${backupPath}`);
    } catch (error) {
      logger.errorWithContext(error, { action: 'backup_data' });
    }
  }

  // Helper methods
  async getActiveUsers() {
    // This would query your database for active users
    // For now, return empty array
    return [];
  }

  async getUserSettings(userId) {
    // Check cache first
    if (this.userSettings.has(userId)) {
      return this.userSettings.get(userId);
    }

    // Load from database
    const settings = {
      search: { autoSearch: false },
      notifications: { newProjects: true, dailyReports: true },
      ai: { autoGenerate: false }
    };

    // Cache for 1 hour
    this.userSettings.set(userId, settings);
    setTimeout(() => {
      this.userSettings.delete(userId);
    }, 3600000);

    return settings;
  }

  async filterNewProjects(userId, projects) {
    // This would check against stored projects for the user
    // For now, return all projects
    return projects;
  }

  async sendNewProjectsNotification(userId, projects) {
    try {
      const count = projects.length;
      const topProjects = projects.slice(0, 3);

      let message = `🔔 *Знайдено ${count} нових проектів!*\n\n`;

      topProjects.forEach((project, index) => {
        const budget = project.budget
          ? `$${project.budget.min || 0}-${project.budget.max || 'N/A'}`
          : 'N/A';

        message += `*${index + 1}. ${project.title.substring(0, 50)}...*\n`;
        message += `💰 ${budget} | 📍 ${project.platform}\n\n`;
      });

      if (count > 3) {
        message += `... та ще ${count - 3} проектів\n\n`;
      }

      message += 'Використайте /search для перегляду всіх проектів.';

      await this.bot.telegram.sendMessage(userId, message, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      logger.errorWithContext(error, { userId, action: 'send_new_projects_notification' });
    }
  }

  async storeUserProjects(userId, projects) {
    // Store projects in database for the user
    logger.cronJob(`Stored ${projects.length} projects for user ${userId}`);
  }

  async autoGenerateProposals(userId, projects, userSettings) {
    try {
      logger.cronJob(`Auto-generating proposals for user ${userId}`);

      for (const project of projects) {
        try {
          const proposalData = {
            project,
            method: 'ai',
            parameters: userSettings.ai || {},
            userId
          };

          const proposal = await proposalGeneratorService.generateProposal(proposalData);

          if (proposal) {
            // Store proposal for later review
            await proposalGeneratorService.saveProposalHistory(userId, {
              projectId: project.id,
              platform: project.platform,
              projectTitle: project.title,
              proposal,
              generatedAt: new Date(),
              method: 'auto_ai',
              autoGenerated: true
            });
          }
        } catch (error) {
          logger.errorWithContext(error, {
            userId,
            projectId: project.id,
            action: 'auto_generate_proposal'
          });
        }
      }
    } catch (error) {
      logger.errorWithContext(error, { userId, action: 'auto_generate_proposals' });
    }
  }

  async generateDailyReport(userId, stats) {
    const report =
      `📊 *Щоденний звіт TechMoneyBot*\n\n` +
      `📅 **Дата:** ${new Date().toLocaleDateString('uk-UA')}\n\n` +
      `🔍 **Пошуки:** ${stats.searches || 0}\n` +
      `📋 **Знайдено проектів:** ${stats.projectsFound || 0}\n` +
      `🤖 **Згенеровано пропозицій:** ${stats.proposalsGenerated || 0}\n` +
      `📤 **Відправлено пропозицій:** ${stats.proposalsSent || 0}\n` +
      `💰 **Середній бюджет проектів:** $${stats.averageBudget || 0}\n\n` +
      `🎯 **Найкращі платформи:**\n` +
      `• Upwork: ${stats.platforms?.upwork || 0} проектів\n` +
      `• Freelancer: ${stats.platforms?.freelancer || 0} проектів\n` +
      `• Fiverr: ${stats.platforms?.fiverr || 0} проектів\n\n` +
      `Продовжуйте в тому ж дусі! 🚀`;

    return report;
  }

  async generateWeeklySummary(userId, stats) {
    const summary =
      `📈 *Тижневий підсумок TechMoneyBot*\n\n` +
      `📅 **Тиждень:** ${new Date().toLocaleDateString('uk-UA')}\n\n` +
      `🔍 **Всього пошуків:** ${stats.totalSearches || 0}\n` +
      `📋 **Знайдено проектів:** ${stats.totalProjects || 0}\n` +
      `🤖 **Згенеровано пропозицій:** ${stats.totalProposals || 0}\n` +
      `📤 **Відправлено пропозицій:** ${stats.sentProposals || 0}\n` +
      `💰 **Загальна вартість проектів:** $${stats.totalValue || 0}\n\n` +
      `📊 **Статистика успіху:**\n` +
      `• Коефіцієнт відгуку: ${stats.responseRate || 0}%\n` +
      `• Середній час генерації: ${stats.avgGenerationTime || 0}с\n` +
      `• Найпопулярніші ключові слова: ${stats.topKeywords?.join(', ') || 'N/A'}\n\n` +
      `🎯 **Рекомендації на наступний тиждень:**\n` +
      `• Спробуйте нові ключові слова\n` +
      `• Оптимізуйте час відправки пропозицій\n` +
      `• Перевірте налаштування автопошуку\n\n` +
      `Успіхів у новому тижні! 💪`;

    return summary;
  }

  // Stop all cron jobs
  stopAll() {
    try {
      logger.cronJob('Stopping all cron jobs');

      for (const [name, job] of this.jobs) {
        job.stop();
        logger.cronJob(`Stopped job: ${name}`);
      }

      this.jobs.clear();
      this.isInitialized = false;
    } catch (error) {
      logger.errorWithContext(error, { action: 'stop_all_jobs' });
    }
  }

  // Get job status
  getJobStatus() {
    const status = {
      initialized: this.isInitialized,
      totalJobs: this.jobs.size,
      jobs: []
    };

    for (const [name, job] of this.jobs) {
      status.jobs.push({
        name,
        running: job.running || false
      });
    }

    return status;
  }

  // Additional helper methods (stubs for now)
  async cleanupSearchHistory(cutoffDate) {
    return 0;
  }
  async cleanupProposalHistory(cutoffDate) {
    return 0;
  }
  async cleanupAnalyticsData(cutoffDate) {
    return 0;
  }
  async cleanupLogFiles(cutoffDate) {
    return 0;
  }
  async checkApiHealth(api) {
    return true;
  }
  async sendHealthAlert(issues, status) {}
  async getUsersInterestedInHighValue() {
    return [];
  }
  async sendHighValueProjectAlert(userId, projects) {}
  async exportUserSettings() {
    return {};
  }
  async getTotalUsers() {
    return 0;
  }
  async saveBackup(data) {
    return '/tmp/backup.json';
  }
}

module.exports = CronJobManager;
