require('dotenv').config();

const { Telegraf, session, Scenes } = require('telegraf');
const mongoose = require('mongoose');
const redis = require('redis');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import utilities
const logger = require('./utils/logger');
const { ValidationService } = require('./utils/validation');
const database = require('./config/database');

// Import models
const User = require('./models/User');
const { Project, Proposal } = require('./models/Project');

// Import services
const projectSearchService = require('./services/projectSearch');
const proposalGeneratorService = require('./services/proposalGenerator');
const analyticsService = require('./services/analytics');

// Import scenes
const searchScene = require('./scenes/searchScene');
const proposalScene = require('./scenes/proposalScene');
const settingsScene = require('./scenes/settingsScene');

// Import automation
const CronJobManager = require('./automation/cronJobs');

// Validate environment variables
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'MONGODB_URI', 'REDIS_URL', 'OPENAI_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Create stage for scenes
const stage = new Scenes.Stage([searchScene, proposalScene, settingsScene]);

// Middleware
bot.use(session());
bot.use(stage.middleware());

// Rate limiting middleware
const userRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const now = Date.now();
  const userRequests = userRateLimit.get(userId) || [];

  // Remove old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for user ${userId}`);
    return ctx.reply('⚠️ Забагато запитів. Спробуйте через хвилину.');
  }

  recentRequests.push(now);
  userRateLimit.set(userId, recentRequests);

  return next();
});

// User middleware - ensure user exists in database
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();

  try {
    let user = await User.findByTelegramId(ctx.from.id);

    if (!user) {
      user = new User({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        languageCode: ctx.from.language_code
      });

      await user.save();
      logger.info(`New user registered: ${ctx.from.id}`);
    } else {
      // Update user info if changed
      let updated = false;

      if (user.username !== ctx.from.username) {
        user.username = ctx.from.username;
        updated = true;
      }

      if (user.firstName !== ctx.from.first_name) {
        user.firstName = ctx.from.first_name;
        updated = true;
      }

      if (user.lastName !== ctx.from.last_name) {
        user.lastName = ctx.from.last_name;
        updated = true;
      }

      if (updated) {
        await user.save();
      }
    }

    ctx.user = user;
    return next();
  } catch (error) {
    logger.error('Error in user middleware:', error);
    return ctx.reply('❌ Виникла помилка. Спробуйте пізніше.');
  }
});

// Logging middleware
bot.use(async (ctx, next) => {
  const start = Date.now();

  logger.logUserAction(ctx.from?.id, {
    action: ctx.updateType,
    message: ctx.message?.text || ctx.callbackQuery?.data,
    timestamp: new Date()
  });

  await next();

  const duration = Date.now() - start;
  logger.logPerformance('bot_request', duration, {
    userId: ctx.from?.id,
    updateType: ctx.updateType
  });
});

// Error handling middleware
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);

  if (ctx) {
    ctx.reply('❌ Виникла помилка. Спробуйте пізніше.').catch(() => {});
  }
});

// Commands
bot.start(async ctx => {
  const welcomeMessage = `
🤖 *Вітаю в TechMoneyBot!*

Я допоможу вам:
📊 Знаходити релевантні проекти на фріланс-платформах
✍️ Генерувати якісні пропозиції
📈 Аналізувати вашу активність
⚙️ Налаштовувати автоматизацію

*Доступні команди:*
/search - Пошук проектів
/proposals - Генерація пропозицій
/analytics - Аналітика
/settings - Налаштування
/help - Допомога

*Швидкий старт:*
1. Налаштуйте профіль: /settings
2. Почніть пошук: /search
3. Згенеруйте пропозицію: /proposals

Почнемо! 🚀
  `;

  await ctx.replyWithMarkdown(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Пошук проектів', callback_data: 'start_search' }],
        [{ text: '⚙️ Налаштування', callback_data: 'start_settings' }],
        [{ text: '📊 Аналітика', callback_data: 'show_analytics' }]
      ]
    }
  });

  // Track user activation
  await analyticsService.trackUserEvent(ctx.user._id.toString(), 'bot_start');
});

bot.help(async ctx => {
  const helpMessage = `
📖 *Довідка TechMoneyBot*

*Основні команди:*
/start - Початок роботи
/search - Пошук проектів
/proposals - Робота з пропозиціями
/analytics - Статистика та звіти
/settings - Налаштування бота
/status - Статус системи

*Пошук проектів:*
• Підтримуються платформи: Upwork, Freelancer, Fiverr
• Фільтрація за бюджетом, навичками, датою
• Збереження результатів пошуку

*Генерація пропозицій:*
• AI-генерація на основі OpenAI
• Шаблони для різних типів проектів
• Персоналізація під ваш профіль

*Автоматизація:*
• Автоматичний пошук проектів
• Щоденні звіти
• Сповіщення про нові проекти

*Підтримка:*
• Telegram: @techmoneybot_support
• Email: support@techmoneybot.com
• Документація: /docs
  `;

  await ctx.replyWithMarkdown(helpMessage);
});

bot.command('search', async ctx => {
  await ctx.scene.enter('search');
});

bot.command('proposals', async ctx => {
  await ctx.scene.enter('proposal');
});

bot.command('settings', async ctx => {
  await ctx.scene.enter('settings');
});

bot.command('analytics', async ctx => {
  try {
    const userId = ctx.user._id.toString();
    const stats = await analyticsService.getUserStats(userId);

    const message = `
📊 *Ваша статистика*

🔍 *Пошуки:*
• Всього: ${stats.searches.total}
• Цього тижня: ${stats.searches.thisWeek}
• Середньо на день: ${stats.searches.averagePerDay}

✍️ *Пропозиції:*
• Всього: ${stats.proposals.total}
• Відправлено: ${stats.proposals.sent}
• Середня якість: ${stats.proposals.averageQuality}%

💰 *Проекти:*
• Переглянуто: ${stats.projects.viewed}
• Збережено: ${stats.projects.saved}
• Відгуків: ${stats.projects.responses}

📈 *Платформи:*
${Object.entries(stats.platforms)
  .map(([platform, count]) => `• ${platform}: ${count}`)
  .join('\n')}
    `;

    await ctx.replyWithMarkdown(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Детальний звіт', callback_data: 'detailed_analytics' }],
          [{ text: '📤 Експорт даних', callback_data: 'export_data' }]
        ]
      }
    });
  } catch (error) {
    logger.error('Error showing analytics:', error);
    await ctx.reply('❌ Помилка при завантаженні статистики.');
  }
});

bot.command('status', async ctx => {
  try {
    const status = {
      bot: 'online',
      database: (await database.isConnected()) ? 'connected' : 'disconnected',
      redis: (await database.isRedisConnected()) ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: require('./package.json').version
    };

    const message = `
🔧 *Статус системи*

🤖 Бот: ${status.bot}
🗄️ База даних: ${status.database}
⚡ Redis: ${status.redis}
⏱️ Час роботи: ${Math.floor(status.uptime / 3600)}г ${Math.floor((status.uptime % 3600) / 60)}хв
💾 Пам'ять: ${Math.round(status.memory.used / 1024 / 1024)}MB
📦 Версія: ${status.version}
    `;

    await ctx.replyWithMarkdown(message);
  } catch (error) {
    logger.error('Error showing status:', error);
    await ctx.reply('❌ Помилка при отриманні статусу.');
  }
});

// Callback query handlers
bot.action('start_search', async ctx => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('search');
});

bot.action('start_settings', async ctx => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('settings');
});

bot.action('show_analytics', async ctx => {
  await ctx.answerCbQuery();
  await ctx.telegram.sendMessage(ctx.chat.id, '/analytics');
});

bot.action('detailed_analytics', async ctx => {
  await ctx.answerCbQuery();

  try {
    const userId = ctx.user._id.toString();
    const report = await analyticsService.generateDetailedReport(userId);

    await ctx.replyWithMarkdown(report);
  } catch (error) {
    logger.error('Error generating detailed analytics:', error);
    await ctx.reply('❌ Помилка при генерації звіту.');
  }
});

bot.action('export_data', async ctx => {
  await ctx.answerCbQuery();

  try {
    const userId = ctx.user._id.toString();
    const exportData = await analyticsService.exportUserData(userId);

    // Send as document
    await ctx.replyWithDocument(
      {
        source: Buffer.from(JSON.stringify(exportData, null, 2)),
        filename: `techmoneybot_data_${Date.now()}.json`
      },
      {
        caption: '📤 Ваші дані експортовано'
      }
    );
  } catch (error) {
    logger.error('Error exporting data:', error);
    await ctx.reply('❌ Помилка при експорті даних.');
  }
});

// Express server for health checks and webhooks
const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await database.isConnected(),
      redis: await database.isRedisConnected(),
      memory: process.memoryUsage()
    };

    res.json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await analyticsService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for Telegram
if (process.env.WEBHOOK_URL) {
  app.use(bot.webhookCallback('/webhook'));
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
}

// Initialize application
async function initialize() {
  try {
    logger.info('Starting TechMoneyBot...');

    // Connect to databases
    await database.connect();
    logger.info('Database connected');

    // Initialize services
    await projectSearchService.initialize();
    await proposalGeneratorService.initialize();
    await analyticsService.initialize();

    logger.info('Services initialized');

    // Initialize cron jobs
    const cronManager = new CronJobManager(bot);
    await cronManager.initialize();

    logger.info('Cron jobs initialized');

    // Start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Start bot
    if (process.env.WEBHOOK_URL) {
      logger.info('Bot started with webhook');
    } else {
      await bot.launch();
      logger.info('Bot started with polling');
    }

    logger.info('TechMoneyBot successfully started!');
  } catch (error) {
    logger.error('Failed to initialize bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');

  try {
    bot.stop('SIGINT');
    await database.disconnect();
    logger.info('Bot stopped gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.once('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');

  try {
    bot.stop('SIGTERM');
    await database.disconnect();
    logger.info('Bot stopped gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  initialize();
}

module.exports = { bot, app };
