const { Scenes, Markup } = require('telegraf');
const logger = require('../utils/logger');
const { ValidationService } = require('../utils/validation');
const proposalGeneratorService = require('../services/proposalGenerator');
const analyticsService = require('../services/analytics');

const proposalScene = new Scenes.WizardScene(
  'proposal-wizard',

  // Step 1: Project selection
  async ctx => {
    try {
      logger.userAction(ctx.from.id, 'proposal_generation_started');

      const searchResults = ctx.session.lastSearchResults || [];

      if (searchResults.length === 0) {
        await ctx.reply(
          '❌ *Немає проектів для генерації пропозицій*\n\n' +
            'Спочатку виконайте пошук проектів за допомогою команди /search',
          { parse_mode: 'Markdown' }
        );
        return ctx.scene.leave();
      }

      // Show top 10 projects for selection
      const topProjects = searchResults.slice(0, 10);

      let message = '🤖 *Генерація пропозицій*\n\n';
      message += 'Оберіть проекти для генерації пропозицій:\n\n';

      const keyboard = [];

      topProjects.forEach((project, index) => {
        const title =
          project.title.length > 40 ? project.title.substring(0, 40) + '...' : project.title;

        const budget = project.budget
          ? `$${project.budget.min || 0}-${project.budget.max || 'N/A'}`
          : 'N/A';

        message += `*${index + 1}.* ${title}\n`;
        message += `   💰 ${budget} | 📍 ${project.platform}\n\n`;

        keyboard.push([
          Markup.button.callback(
            `${index + 1}. ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}`,
            `select:${index}`
          )
        ]);
      });

      keyboard.push(
        [Markup.button.callback('✅ Генерувати для всіх', 'select:all')],
        [Markup.button.callback('❌ Скасувати', 'cancel')]
      );

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup
      });

      ctx.wizard.state.projects = topProjects;
      ctx.wizard.state.selectedProjects = [];

      return ctx.wizard.next();
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'project_selection' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 2: Generation method selection
  async ctx => {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        if (data === 'cancel') {
          await ctx.editMessageText('❌ Генерація пропозицій скасована.');
          return ctx.scene.leave();
        }

        if (data.startsWith('select:')) {
          const selection = data.split(':')[1];

          if (selection === 'all') {
            ctx.wizard.state.selectedProjects = [...ctx.wizard.state.projects];
          } else {
            const index = parseInt(selection);
            if (index >= 0 && index < ctx.wizard.state.projects.length) {
              ctx.wizard.state.selectedProjects = [ctx.wizard.state.projects[index]];
            }
          }

          const selectedCount = ctx.wizard.state.selectedProjects.length;

          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🤖 AI генерація (рекомендовано)', 'method:ai')],
            [Markup.button.callback('📝 Шаблони', 'method:template')],
            [Markup.button.callback('🔄 Змішаний підхід', 'method:mixed')],
            [Markup.button.callback('❌ Скасувати', 'cancel')]
          ]);

          await ctx.editMessageText(
            `✅ *Обрано проектів: ${selectedCount}*\n\n` +
              '🎯 Оберіть метод генерації пропозицій:\n\n' +
              '🤖 *AI генерація* - Унікальні пропозиції на основі штучного інтелекту\n' +
              '📝 *Шаблони* - Швидка генерація на основі готових шаблонів\n' +
              '🔄 *Змішаний підхід* - Комбінація AI та шаблонів для кращого результату',
            {
              parse_mode: 'Markdown',
              reply_markup: keyboard.reply_markup
            }
          );

          return ctx.wizard.next();
        }
      }

      await ctx.reply('❌ Будь ласка, оберіть проект з меню.');
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'project_processing' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 3: Additional parameters
  async ctx => {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        if (data === 'cancel') {
          await ctx.editMessageText('❌ Генерація пропозицій скасована.');
          return ctx.scene.leave();
        }

        if (data.startsWith('method:')) {
          const method = data.split(':')[1];
          ctx.wizard.state.method = method;

          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('⚡ Швидко (базові параметри)', 'params:quick')],
            [Markup.button.callback('🎯 Детально (додаткові налаштування)', 'params:detailed')],
            [Markup.button.callback('❌ Скасувати', 'cancel')]
          ]);

          await ctx.editMessageText(
            `✅ *Метод: ${this.getMethodName(method)}*\n\n` +
              '⚙️ Оберіть рівень налаштувань:\n\n' +
              '⚡ *Швидко* - Генерація з базовими параметрами\n' +
              '🎯 *Детально* - Можливість налаштувати тон, довжину та стиль',
            {
              parse_mode: 'Markdown',
              reply_markup: keyboard.reply_markup
            }
          );

          return ctx.wizard.next();
        }
      }

      await ctx.reply('❌ Будь ласка, оберіть метод з меню.');
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'method_processing' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 4: Detailed parameters (if selected) or generation
  async ctx => {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        if (data === 'cancel') {
          await ctx.editMessageText('❌ Генерація пропозицій скасована.');
          return ctx.scene.leave();
        }

        if (data.startsWith('params:')) {
          const paramsType = data.split(':')[1];

          if (paramsType === 'quick') {
            // Use default parameters and start generation
            ctx.wizard.state.parameters = {
              tone: 'professional',
              length: 'medium',
              includeQuestions: true,
              includeBudget: true,
              includeTimeline: true
            };

            await ctx.editMessageText('🤖 Генерую пропозиції... Це може зайняти кілька хвилин.');
            await this.generateProposals(ctx);
            return ctx.scene.leave();
          } else if (paramsType === 'detailed') {
            // Show detailed parameters menu
            const keyboard = Markup.inlineKeyboard([
              [
                Markup.button.callback('👔 Професійний', 'tone:professional'),
                Markup.button.callback('😊 Дружній', 'tone:friendly')
              ],
              [
                Markup.button.callback('🎯 Переконливий', 'tone:persuasive'),
                Markup.button.callback('💼 Формальний', 'tone:formal')
              ],
              [
                Markup.button.callback('✅ Продовжити з поточними', 'continue'),
                Markup.button.callback('❌ Скасувати', 'cancel')
              ]
            ]);

            ctx.wizard.state.parameters = {
              tone: 'professional',
              length: 'medium',
              includeQuestions: true,
              includeBudget: true,
              includeTimeline: true
            };

            await ctx.editMessageText(
              '🎨 *Налаштування пропозицій*\n\n' +
                'Оберіть тон пропозицій:\n\n' +
                '👔 *Професійний* - Стандартний діловий стиль\n' +
                '😊 *Дружній* - Більш особистий підхід\n' +
                '🎯 *Переконливий* - Акцент на переваги\n' +
                '💼 *Формальний* - Строго діловий стиль',
              {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
              }
            );

            return ctx.wizard.next();
          }
        }
      }

      await ctx.reply('❌ Будь ласка, оберіть опцію з меню.');
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'parameters_processing' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 5: Final parameters and generation
  async ctx => {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        if (data === 'cancel') {
          await ctx.editMessageText('❌ Генерація пропозицій скасована.');
          return ctx.scene.leave();
        }

        if (data === 'continue') {
          await ctx.editMessageText('🤖 Генерую пропозиції... Це може зайняти кілька хвилин.');
          await this.generateProposals(ctx);
          return ctx.scene.leave();
        }

        if (data.startsWith('tone:')) {
          const tone = data.split(':')[1];
          ctx.wizard.state.parameters.tone = tone;

          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📝 Коротко (150-250 слів)', 'length:short')],
            [Markup.button.callback('📄 Середньо (250-400 слів)', 'length:medium')],
            [Markup.button.callback('📋 Детально (400-600 слів)', 'length:long')],
            [
              Markup.button.callback('✅ Продовжити', 'continue'),
              Markup.button.callback('❌ Скасувати', 'cancel')
            ]
          ]);

          await ctx.editMessageText(
            `✅ *Тон: ${this.getToneName(tone)}*\n\n` + '📏 Оберіть довжину пропозицій:',
            {
              parse_mode: 'Markdown',
              reply_markup: keyboard.reply_markup
            }
          );
        }

        if (data.startsWith('length:')) {
          const length = data.split(':')[1];
          ctx.wizard.state.parameters.length = length;

          await ctx.editMessageText(
            `✅ *Налаштування завершено*\n\n` +
              `🎨 Тон: ${this.getToneName(ctx.wizard.state.parameters.tone)}\n` +
              `📏 Довжина: ${this.getLengthName(length)}\n\n` +
              '🤖 Генерую пропозиції... Це може зайняти кілька хвилин.'
          );

          await this.generateProposals(ctx);
          return ctx.scene.leave();
        }
      }

      await ctx.reply('❌ Будь ласка, оберіть опцію з меню.');
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'final_parameters' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  }
);

// Helper method to generate proposals
proposalScene.generateProposals = async function (ctx) {
  try {
    const selectedProjects = ctx.wizard.state.selectedProjects || [];
    const method = ctx.wizard.state.method || 'ai';
    const parameters = ctx.wizard.state.parameters || {};

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < selectedProjects.length; i++) {
      const project = selectedProjects[i];

      try {
        // Update progress
        if (selectedProjects.length > 1) {
          await ctx.editMessageText(
            `🤖 Генерую пропозиції...\n\n` +
              `📊 Прогрес: ${i + 1}/${selectedProjects.length}\n` +
              `✅ Успішно: ${successCount}\n` +
              `❌ Помилки: ${failureCount}`
          );
        }

        const startTime = Date.now();

        // Generate proposal
        const proposalData = {
          project,
          method,
          parameters,
          userId: ctx.from.id
        };

        const proposal = await proposalGeneratorService.generateProposal(proposalData);
        const generationTime = Date.now() - startTime;

        if (proposal && proposal.content) {
          results.push({
            project,
            proposal,
            success: true,
            generationTime
          });

          successCount++;

          // Record analytics
          analyticsService.recordProposal(
            project.platform,
            project.id,
            generationTime,
            proposal.content.split(' ').length,
            false // Not sent yet
          );

          logger.proposalEvent(project.platform, project.id, 'generated', {
            method,
            generationTime,
            wordCount: proposal.content.split(' ').length
          });
        } else {
          throw new Error('Empty proposal generated');
        }
      } catch (error) {
        logger.errorWithContext(error, {
          userId: ctx.from.id,
          projectId: project.id,
          platform: project.platform,
          method
        });

        results.push({
          project,
          proposal: null,
          success: false,
          error: error.message
        });

        failureCount++;
      }

      // Small delay between generations
      if (i < selectedProjects.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Display results
    await this.displayGenerationResults(ctx, results);
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'generate_proposals' });
    await ctx.editMessageText(
      '❌ *Помилка генерації пропозицій*\n\n' +
        'Не вдалося згенерувати пропозиції. Спробуйте ще раз пізніше.',
      { parse_mode: 'Markdown' }
    );
  }
};

// Helper method to display generation results
proposalScene.displayGenerationResults = async function (ctx, results) {
  try {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    let message = `🎉 *Генерація завершена*\n\n`;
    message += `✅ Успішно: ${successfulResults.length}\n`;
    message += `❌ Помилки: ${failedResults.length}\n\n`;

    if (successfulResults.length > 0) {
      message += '📋 *Згенеровані пропозиції:*\n\n';

      successfulResults.forEach((result, index) => {
        const project = result.project;
        const title =
          project.title.length > 50 ? project.title.substring(0, 50) + '...' : project.title;

        message += `*${index + 1}. ${title}*\n`;
        message += `📍 ${project.platform} | 🕒 ${Math.round(result.generationTime / 1000)}с\n\n`;
      });
    }

    if (failedResults.length > 0) {
      message += '❌ *Помилки генерації:*\n\n';

      failedResults.forEach((result, index) => {
        const project = result.project;
        const title =
          project.title.length > 50 ? project.title.substring(0, 50) + '...' : project.title;

        message += `${index + 1}. ${title} - ${result.error}\n`;
      });

      message += '\n';
    }

    const keyboard = [];

    if (successfulResults.length > 0) {
      keyboard.push(
        [Markup.button.callback('📋 Переглянути пропозиції', 'view_proposals')],
        [Markup.button.callback('📤 Відправити пропозиції', 'send_proposals')],
        [Markup.button.callback('💾 Зберегти пропозиції', 'save_proposals')]
      );
    }

    keyboard.push(
      [Markup.button.callback('🔄 Генерувати ще', 'generate_more')],
      [Markup.button.callback('🏠 Головне меню', 'main_menu')]
    );

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(keyboard).reply_markup
    });

    // Store results in session
    ctx.session.lastProposalResults = results;
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, resultsCount: results.length });
    await ctx.reply('❌ Помилка відображення результатів.');
  }
};

// Helper methods for display names
proposalScene.getMethodName = function (method) {
  const names = {
    ai: 'AI генерація',
    template: 'Шаблони',
    mixed: 'Змішаний підхід'
  };
  return names[method] || method;
};

proposalScene.getToneName = function (tone) {
  const names = {
    professional: 'Професійний',
    friendly: 'Дружній',
    persuasive: 'Переконливий',
    formal: 'Формальний'
  };
  return names[tone] || tone;
};

proposalScene.getLengthName = function (length) {
  const names = {
    short: 'Коротко',
    medium: 'Середньо',
    long: 'Детально'
  };
  return names[length] || length;
};

// Handle callback queries for proposal results
proposalScene.action('view_proposals', async ctx => {
  try {
    const results = ctx.session.lastProposalResults || [];
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      await ctx.answerCbQuery('❌ Немає пропозицій для перегляду');
      return;
    }

    // Send proposals one by one
    for (let i = 0; i < successfulResults.length; i++) {
      const result = successfulResults[i];
      const project = result.project;
      const proposal = result.proposal;

      let message = `📋 *Пропозиція ${i + 1}/${successfulResults.length}*\n\n`;
      message += `🎯 **Проект:** ${project.title}\n`;
      message += `📍 **Платформа:** ${project.platform}\n\n`;
      message += `📝 **Пропозиція:**\n${proposal.content}\n\n`;

      if (proposal.budget) {
        message += `💰 **Бюджет:** $${proposal.budget}\n`;
      }

      if (proposal.timeline) {
        message += `⏰ **Терміни:** ${proposal.timeline}\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Редагувати', `edit:${i}`)],
        [Markup.button.callback('📤 Відправити', `send_single:${i}`)],
        [Markup.button.callback('🗑️ Видалити', `delete:${i}`)]
      ]);

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });

      // Small delay between messages
      if (i < successfulResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await ctx.answerCbQuery('✅ Пропозиції надіслано');
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'view_proposals' });
    await ctx.answerCbQuery('❌ Помилка перегляду пропозицій');
  }
});

proposalScene.action('send_proposals', async ctx => {
  try {
    await ctx.answerCbQuery('📤 Функція відправки пропозицій буде доступна незабаром');

    // TODO: Implement proposal sending functionality
    // This would integrate with freelance platform APIs to actually send proposals
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'send_proposals' });
    await ctx.answerCbQuery('❌ Помилка відправки пропозицій');
  }
});

proposalScene.action('save_proposals', async ctx => {
  try {
    const results = ctx.session.lastProposalResults || [];
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      await ctx.answerCbQuery('❌ Немає пропозицій для збереження');
      return;
    }

    // Save proposals to history
    for (const result of successfulResults) {
      await proposalGeneratorService.saveProposalHistory(ctx.from.id, {
        projectId: result.project.id,
        platform: result.project.platform,
        projectTitle: result.project.title,
        proposal: result.proposal,
        generatedAt: new Date(),
        method: ctx.wizard.state.method,
        parameters: ctx.wizard.state.parameters
      });
    }

    await ctx.answerCbQuery('✅ Пропозиції збережено в історію');

    logger.userAction(ctx.from.id, 'proposals_saved', {
      count: successfulResults.length
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'save_proposals' });
    await ctx.answerCbQuery('❌ Помилка збереження пропозицій');
  }
});

proposalScene.action('generate_more', async ctx => {
  try {
    await ctx.answerCbQuery('🔄 Починаю нову генерацію...');
    await ctx.scene.reenter();
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'generate_more' });
    await ctx.answerCbQuery('❌ Помилка запуску нової генерації');
  }
});

proposalScene.action('main_menu', async ctx => {
  try {
    await ctx.answerCbQuery('🏠 Повертаюся до головного меню...');
    await ctx.scene.leave();

    // Send main menu
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔍 Пошук проектів', 'search')],
      [Markup.button.callback('🤖 Генерація пропозицій', 'proposals')],
      [Markup.button.callback('📊 Статистика', 'stats')],
      [Markup.button.callback('⚙️ Налаштування', 'settings')]
    ]);

    await ctx.reply('🏠 *Головне меню TechMoneyBot*\n\n' + 'Оберіть дію:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'main_menu' });
    await ctx.answerCbQuery('❌ Помилка переходу до головного меню');
  }
});

// Handle scene leave
proposalScene.leave(async ctx => {
  try {
    logger.userAction(ctx.from.id, 'proposal_scene_left');

    // Clean up session data if needed
    if (ctx.session.proposalInProgress) {
      delete ctx.session.proposalInProgress;
    }
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'scene_leave' });
  }
});

module.exports = proposalScene;
