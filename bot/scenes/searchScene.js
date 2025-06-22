const { Scenes, Markup } = require('telegraf');
const logger = require('../utils/logger');
const { ValidationService } = require('../utils/validation');
const projectSearchService = require('../services/projectSearch');
const analyticsService = require('../services/analytics');

const searchScene = new Scenes.WizardScene(
  'search-wizard',

  // Step 1: Platform selection
  async ctx => {
    try {
      logger.userAction(ctx.from.id, 'search_started');

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔵 Upwork', 'platform:upwork')],
        [Markup.button.callback('🟢 Freelancer', 'platform:freelancer')],
        [Markup.button.callback('🟣 Fiverr', 'platform:fiverr')],
        [Markup.button.callback('🔍 Всі платформи', 'platform:all')],
        [Markup.button.callback('❌ Скасувати', 'cancel')]
      ]);

      await ctx.reply('🔍 *Пошук проектів*\n\n' + 'Оберіть платформу для пошуку:', {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });

      return ctx.wizard.next();
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'platform_selection' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 2: Search query input
  async ctx => {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        if (data === 'cancel') {
          await ctx.editMessageText('❌ Пошук скасовано.');
          return ctx.scene.leave();
        }

        if (data.startsWith('platform:')) {
          const platform = data.split(':')[1];
          ctx.wizard.state.platform = platform;

          await ctx.editMessageText(
            `✅ Обрано платформу: *${platform === 'all' ? 'Всі платформи' : platform}*\n\n` +
              '📝 Тепер введіть ключові слова для пошуку:\n\n' +
              '_Приклад: "web development react nodejs"_',
            { parse_mode: 'Markdown' }
          );

          return ctx.wizard.next();
        }
      }

      await ctx.reply('❌ Будь ласка, оберіть платформу з меню.');
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'platform_processing' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 3: Budget range (optional)
  async ctx => {
    try {
      if (!ctx.message || !ctx.message.text) {
        await ctx.reply('❌ Будь ласка, введіть текст для пошуку.');
        return;
      }

      const query = ctx.message.text.trim();

      // Validate search query
      const validation = ValidationService.validate(query, 'searchQuery');
      if (!validation.isValid) {
        const errors = validation.errors.map(e => e.message).join('\n');
        await ctx.reply(`❌ Некоректний запит:\n${errors}`);
        return;
      }

      ctx.wizard.state.query = validation.value;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('💰 $5-25', 'budget:5-25')],
        [Markup.button.callback('💰 $25-100', 'budget:25-100')],
        [Markup.button.callback('💰 $100-500', 'budget:100-500')],
        [Markup.button.callback('💰 $500+', 'budget:500-10000')],
        [Markup.button.callback('⏭️ Пропустити', 'budget:skip')],
        [Markup.button.callback('❌ Скасувати', 'cancel')]
      ]);

      await ctx.reply('💰 *Бюджет проекту*\n\n' + "Оберіть діапазон бюджету (необов'язково):", {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });

      return ctx.wizard.next();
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'query_processing' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 4: Execute search
  async ctx => {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        if (data === 'cancel') {
          await ctx.editMessageText('❌ Пошук скасовано.');
          return ctx.scene.leave();
        }

        if (data.startsWith('budget:')) {
          const budgetData = data.split(':')[1];

          if (budgetData !== 'skip') {
            const [min, max] = budgetData.split('-').map(Number);
            ctx.wizard.state.budget = { min, max, currency: 'USD' };
          }

          await ctx.editMessageText('🔍 Виконую пошук... Це може зайняти кілька секунд.');

          // Execute search
          const searchParams = {
            query: ctx.wizard.state.query,
            platform: ctx.wizard.state.platform,
            budget: ctx.wizard.state.budget,
            limit: 20
          };

          const startTime = Date.now();

          try {
            const results = await projectSearchService.searchProjects(searchParams);
            const searchTime = Date.now() - startTime;

            // Record analytics
            const platforms =
              ctx.wizard.state.platform === 'all'
                ? ['upwork', 'freelancer', 'fiverr']
                : [ctx.wizard.state.platform];

            platforms.forEach(platform => {
              const platformResults = results.filter(r => r.platform === platform);
              analyticsService.recordSearch(
                platform,
                true,
                searchTime / platforms.length,
                platformResults.length
              );
            });

            if (results.length === 0) {
              await ctx.editMessageText(
                '😔 *Проекти не знайдено*\n\n' +
                  'Спробуйте:\n' +
                  '• Змінити ключові слова\n' +
                  '• Розширити діапазон бюджету\n' +
                  '• Обрати іншу платформу',
                { parse_mode: 'Markdown' }
              );

              return ctx.scene.leave();
            }

            // Display results
            await this.displaySearchResults(ctx, results, searchParams);

            logger.searchEvent(
              ctx.wizard.state.platform,
              ctx.wizard.state.query,
              results.length,
              searchTime
            );
          } catch (searchError) {
            logger.errorWithContext(searchError, {
              userId: ctx.from.id,
              searchParams,
              step: 'search_execution'
            });

            // Record failed search
            const platforms =
              ctx.wizard.state.platform === 'all'
                ? ['upwork', 'freelancer', 'fiverr']
                : [ctx.wizard.state.platform];

            platforms.forEach(platform => {
              analyticsService.recordSearch(platform, false, Date.now() - startTime, 0);
            });

            await ctx.editMessageText(
              '❌ *Помилка пошуку*\n\n' +
                'Не вдалося виконати пошук. Можливі причини:\n' +
                '• Тимчасові проблеми з API\n' +
                '• Перевищено ліміт запитів\n' +
                '• Проблеми з мережею\n\n' +
                'Спробуйте ще раз через кілька хвилин.',
              { parse_mode: 'Markdown' }
            );
          }

          return ctx.scene.leave();
        }
      }

      await ctx.reply('❌ Будь ласка, оберіть опцію з меню.');
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'search_execution' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  }
);

// Helper method to display search results
searchScene.displaySearchResults = async function (ctx, results, searchParams) {
  try {
    const totalResults = results.length;
    const topResults = results.slice(0, 10); // Show top 10 results

    let message = `🎯 *Знайдено ${totalResults} проектів*\n\n`;

    if (searchParams.platform !== 'all') {
      message += `📍 Платформа: ${searchParams.platform}\n`;
    }

    if (searchParams.budget) {
      message += `💰 Бюджет: $${searchParams.budget.min}-${searchParams.budget.max}\n`;
    }

    message += `🔍 Запит: "${searchParams.query}"\n\n`;

    // Add top results
    topResults.forEach((project, index) => {
      const budget = project.budget
        ? `💰 $${project.budget.min || 0}-${project.budget.max || 'N/A'}`
        : '💰 Не вказано';

      const platform = project.platform.charAt(0).toUpperCase() + project.platform.slice(1);
      const title =
        project.title.length > 60 ? project.title.substring(0, 60) + '...' : project.title;

      message += `*${index + 1}. ${title}*\n`;
      message += `📍 ${platform} | ${budget}\n`;

      if (project.skills && project.skills.length > 0) {
        const skills = project.skills.slice(0, 3).join(', ');
        message += `🔧 ${skills}${project.skills.length > 3 ? '...' : ''}\n`;
      }

      message += `⭐ Рейтинг: ${project.qualityScore || 'N/A'}/100\n\n`;
    });

    if (totalResults > 10) {
      message += `_... та ще ${totalResults - 10} проектів_\n\n`;
    }

    // Action buttons
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Детальний список', `detailed:${ctx.from.id}`)],
      [Markup.button.callback('🤖 Генерувати пропозиції', `generate:${ctx.from.id}`)],
      [Markup.button.callback('💾 Зберегти результати', `save:${ctx.from.id}`)],
      [Markup.button.callback('🔍 Новий пошук', 'new_search')]
    ]);

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });

    // Store results in session for later use
    ctx.session.lastSearchResults = results;
    ctx.session.lastSearchParams = searchParams;
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, resultsCount: results.length });
    await ctx.reply('❌ Помилка відображення результатів.');
  }
};

// Handle callback queries for search results
searchScene.action('detailed', async ctx => {
  try {
    const results = ctx.session.lastSearchResults || [];

    if (results.length === 0) {
      await ctx.answerCbQuery('❌ Результати пошуку не знайдено');
      return;
    }

    // Send detailed results in chunks
    const chunkSize = 5;
    for (let i = 0; i < results.length; i += chunkSize) {
      const chunk = results.slice(i, i + chunkSize);
      let message = `📋 *Детальні результати (${i + 1}-${Math.min(i + chunkSize, results.length)} з ${results.length})*\n\n`;

      chunk.forEach((project, index) => {
        const globalIndex = i + index + 1;
        message += `*${globalIndex}. ${project.title}*\n`;
        message += `📍 Платформа: ${project.platform}\n`;

        if (project.budget) {
          message += `💰 Бюджет: $${project.budget.min || 0}-${project.budget.max || 'N/A'} ${project.budget.currency || 'USD'}\n`;
        }

        if (project.description) {
          const desc =
            project.description.length > 200
              ? project.description.substring(0, 200) + '...'
              : project.description;
          message += `📝 ${desc}\n`;
        }

        if (project.skills && project.skills.length > 0) {
          message += `🔧 Навички: ${project.skills.join(', ')}\n`;
        }

        if (project.clientInfo) {
          message += `👤 Клієнт: ${project.clientInfo.name || 'N/A'}`;
          if (project.clientInfo.rating) {
            message += ` (⭐ ${project.clientInfo.rating}/5)`;
          }
          message += '\n';
        }

        if (project.url) {
          message += `🔗 [Переглянути проект](${project.url})\n`;
        }

        message += `⭐ Рейтинг якості: ${project.qualityScore || 'N/A'}/100\n\n`;
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      // Small delay between chunks
      if (i + chunkSize < results.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await ctx.answerCbQuery('✅ Детальні результати надіслано');
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'detailed_results' });
    await ctx.answerCbQuery('❌ Помилка отримання детальних результатів');
  }
});

searchScene.action('generate', async ctx => {
  try {
    await ctx.answerCbQuery('🤖 Переходжу до генерації пропозицій...');
    await ctx.scene.enter('proposal-wizard');
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'generate_proposals' });
    await ctx.answerCbQuery('❌ Помилка переходу до генерації пропозицій');
  }
});

searchScene.action('save', async ctx => {
  try {
    const results = ctx.session.lastSearchResults || [];
    const params = ctx.session.lastSearchParams || {};

    if (results.length === 0) {
      await ctx.answerCbQuery('❌ Немає результатів для збереження');
      return;
    }

    // Save to user's search history
    await projectSearchService.saveSearchHistory(ctx.from.id, {
      query: params.query,
      platform: params.platform,
      budget: params.budget,
      results: results.length,
      timestamp: new Date(),
      projects: results.map(p => ({
        id: p.id,
        title: p.title,
        platform: p.platform,
        url: p.url,
        qualityScore: p.qualityScore
      }))
    });

    await ctx.answerCbQuery('✅ Результати збережено в історію');

    logger.userAction(ctx.from.id, 'search_results_saved', {
      resultsCount: results.length,
      query: params.query
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'save_results' });
    await ctx.answerCbQuery('❌ Помилка збереження результатів');
  }
});

searchScene.action('new_search', async ctx => {
  try {
    await ctx.answerCbQuery('🔍 Починаю новий пошук...');
    await ctx.scene.reenter();
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'new_search' });
    await ctx.answerCbQuery('❌ Помилка запуску нового пошуку');
  }
});

// Handle scene leave
searchScene.leave(async ctx => {
  try {
    logger.userAction(ctx.from.id, 'search_scene_left');

    // Clean up session data if needed
    if (ctx.session.searchInProgress) {
      delete ctx.session.searchInProgress;
    }
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'scene_leave' });
  }
});

module.exports = searchScene;
