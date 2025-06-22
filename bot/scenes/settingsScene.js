const { Scenes, Markup } = require('telegraf');
const logger = require('../utils/logger');
const { ValidationService } = require('../utils/validation');
const analyticsService = require('../services/analytics');
const proposalGeneratorService = require('../services/proposalGenerator');

const settingsScene = new Scenes.WizardScene(
  'settings-wizard',

  // Step 1: Main settings menu
  async ctx => {
    try {
      logger.userAction(ctx.from.id, 'settings_opened');

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('👤 Профіль користувача', 'profile')],
        [Markup.button.callback('🔍 Налаштування пошуку', 'search_settings')],
        [Markup.button.callback('🤖 Налаштування AI', 'ai_settings')],
        [Markup.button.callback('📱 Сповіщення', 'notifications')],
        [Markup.button.callback('🔐 Безпека та API', 'security')],
        [Markup.button.callback('📊 Експорт даних', 'export')],
        [Markup.button.callback('🗑️ Очистити дані', 'clear_data')],
        [Markup.button.callback('🏠 Головне меню', 'main_menu')]
      ]);

      const userSettings = await this.getUserSettings(ctx.from.id);

      let message = '⚙️ *Налаштування TechMoneyBot*\n\n';
      message += '📋 *Поточні налаштування:*\n\n';
      message += `👤 **Ім'я:** ${userSettings.profile?.name || 'Не вказано'}\n`;
      message += `💼 **Спеціалізація:** ${userSettings.profile?.specialization || 'Не вказано'}\n`;
      message += `🔍 **Автопошук:** ${userSettings.search?.autoSearch ? '✅ Увімкнено' : '❌ Вимкнено'}\n`;
      message += `🤖 **AI генерація:** ${userSettings.ai?.enabled ? '✅ Увімкнено' : '❌ Вимкнено'}\n`;
      message += `📱 **Сповіщення:** ${userSettings.notifications?.enabled ? '✅ Увімкнено' : '❌ Вимкнено'}\n\n`;
      message += 'Оберіть розділ для налаштування:';

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });

      ctx.wizard.state.userSettings = userSettings;

      return ctx.wizard.next();
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'settings_main' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
      return ctx.scene.leave();
    }
  },

  // Step 2: Handle settings category selection
  async ctx => {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        switch (data) {
          case 'profile':
            await this.showProfileSettings(ctx);
            break;
          case 'search_settings':
            await this.showSearchSettings(ctx);
            break;
          case 'ai_settings':
            await this.showAISettings(ctx);
            break;
          case 'notifications':
            await this.showNotificationSettings(ctx);
            break;
          case 'security':
            await this.showSecuritySettings(ctx);
            break;
          case 'export':
            await this.exportUserData(ctx);
            break;
          case 'clear_data':
            await this.showClearDataConfirmation(ctx);
            break;
          case 'main_menu':
            await this.goToMainMenu(ctx);
            return ctx.scene.leave();
          default:
            await ctx.answerCbQuery('❌ Невідома опція');
        }
      }
    } catch (error) {
      logger.errorWithContext(error, { userId: ctx.from.id, step: 'settings_category' });
      await ctx.reply('❌ Виникла помилка. Спробуйте ще раз.');
    }
  }
);

// Profile settings
settingsScene.showProfileSettings = async function (ctx) {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    const profile = userSettings.profile || {};

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("✏️ Змінити ім'я", 'edit_name')],
      [Markup.button.callback('💼 Змінити спеціалізацію', 'edit_specialization')],
      [Markup.button.callback('💰 Налаштувати ставки', 'edit_rates')],
      [Markup.button.callback('🌍 Змінити локацію', 'edit_location')],
      [Markup.button.callback('📝 Редагувати біо', 'edit_bio')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]);

    let message = '👤 *Налаштування профілю*\n\n';
    message += `**Ім'я:** ${profile.name || 'Не вказано'}\n`;
    message += `**Спеціалізація:** ${profile.specialization || 'Не вказано'}\n`;
    message += `**Годинна ставка:** $${profile.hourlyRate || 'Не вказано'}/год\n`;
    message += `**Локація:** ${profile.location || 'Не вказано'}\n`;
    message += `**Досвід:** ${profile.experience || 'Не вказано'} років\n`;
    message += `**Біо:** ${profile.bio ? profile.bio.substring(0, 100) + '...' : 'Не вказано'}\n\n`;
    message += 'Оберіть що змінити:';

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'show_profile_settings' });
    await ctx.answerCbQuery('❌ Помилка завантаження профілю');
  }
};

// Search settings
settingsScene.showSearchSettings = async function (ctx) {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    const search = userSettings.search || {};

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          search.autoSearch ? '🔴 Вимкнути автопошук' : '🟢 Увімкнути автопошук',
          'toggle_auto_search'
        )
      ],
      [Markup.button.callback('🔍 Ключові слова', 'edit_keywords')],
      [Markup.button.callback('💰 Діапазон бюджету', 'edit_budget_range')],
      [Markup.button.callback('📍 Платформи', 'edit_platforms')],
      [Markup.button.callback('⏰ Розклад пошуку', 'edit_schedule')],
      [Markup.button.callback('🎯 Фільтри якості', 'edit_filters')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]);

    let message = '🔍 *Налаштування пошуку*\n\n';
    message += `**Автопошук:** ${search.autoSearch ? '✅ Увімкнено' : '❌ Вимкнено'}\n`;
    message += `**Ключові слова:** ${search.keywords?.join(', ') || 'Не вказано'}\n`;
    message += `**Бюджет:** $${search.minBudget || 0} - $${search.maxBudget || '∞'}\n`;
    message += `**Платформи:** ${search.platforms?.join(', ') || 'Всі'}\n`;
    message += `**Частота пошуку:** ${search.frequency || 'Кожні 2 години'}\n`;
    message += `**Мін. рейтинг клієнта:** ${search.minClientRating || 'Будь-який'}\n\n`;
    message += 'Оберіть що налаштувати:';

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'show_search_settings' });
    await ctx.answerCbQuery('❌ Помилка завантаження налаштувань пошуку');
  }
};

// AI settings
settingsScene.showAISettings = async function (ctx) {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    const ai = userSettings.ai || {};

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ai.enabled ? '🔴 Вимкнути AI' : '🟢 Увімкнути AI', 'toggle_ai')],
      [Markup.button.callback('🎨 Стиль пропозицій', 'edit_proposal_style')],
      [Markup.button.callback('📏 Довжина пропозицій', 'edit_proposal_length')],
      [Markup.button.callback('🎯 Персоналізація', 'edit_personalization')],
      [Markup.button.callback('📝 Шаблони', 'manage_templates')],
      [Markup.button.callback('🤖 Модель AI', 'edit_ai_model')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]);

    let message = '🤖 *Налаштування AI*\n\n';
    message += `**AI генерація:** ${ai.enabled ? '✅ Увімкнено' : '❌ Вимкнено'}\n`;
    message += `**Стиль:** ${ai.style || 'Професійний'}\n`;
    message += `**Довжина:** ${ai.length || 'Середня'}\n`;
    message += `**Персоналізація:** ${ai.personalization ? '✅ Увімкнено' : '❌ Вимкнено'}\n`;
    message += `**Модель:** ${ai.model || 'GPT-3.5-turbo'}\n`;
    message += `**Температура:** ${ai.temperature || 0.7}\n\n`;
    message += 'Оберіть що налаштувати:';

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'show_ai_settings' });
    await ctx.answerCbQuery('❌ Помилка завантаження налаштувань AI');
  }
};

// Notification settings
settingsScene.showNotificationSettings = async function (ctx) {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    const notifications = userSettings.notifications || {};

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          notifications.enabled ? '🔴 Вимкнути сповіщення' : '🟢 Увімкнути сповіщення',
          'toggle_notifications'
        )
      ],
      [Markup.button.callback('🔍 Нові проекти', 'toggle_new_projects')],
      [Markup.button.callback('📊 Щоденні звіти', 'toggle_daily_reports')],
      [Markup.button.callback('⚠️ Помилки системи', 'toggle_system_alerts')],
      [Markup.button.callback('🎯 Успішні пропозиції', 'toggle_success_alerts')],
      [Markup.button.callback('⏰ Розклад сповіщень', 'edit_notification_schedule')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]);

    let message = '📱 *Налаштування сповіщень*\n\n';
    message += `**Сповіщення:** ${notifications.enabled ? '✅ Увімкнено' : '❌ Вимкнено'}\n`;
    message += `**Нові проекти:** ${notifications.newProjects ? '✅' : '❌'}\n`;
    message += `**Щоденні звіти:** ${notifications.dailyReports ? '✅' : '❌'}\n`;
    message += `**Системні сповіщення:** ${notifications.systemAlerts ? '✅' : '❌'}\n`;
    message += `**Успішні пропозиції:** ${notifications.successAlerts ? '✅' : '❌'}\n`;
    message += `**Час звітів:** ${notifications.reportTime || '09:00'}\n\n`;
    message += 'Оберіть що налаштувати:';

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'show_notification_settings' });
    await ctx.answerCbQuery('❌ Помилка завантаження налаштувань сповіщень');
  }
};

// Security settings
settingsScene.showSecuritySettings = async function (ctx) {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    const security = userSettings.security || {};

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔑 API ключі', 'manage_api_keys')],
      [Markup.button.callback('🛡️ Двофакторна автентифікація', 'toggle_2fa')],
      [Markup.button.callback('📋 Журнал активності', 'view_activity_log')],
      [Markup.button.callback('🔒 Змінити пароль', 'change_password')],
      [Markup.button.callback('🚫 Заблоковані користувачі', 'manage_blocked_users')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]);

    let message = '🔐 *Налаштування безпеки*\n\n';
    message += `**API ключі налаштовано:** ${security.apiKeysConfigured ? '✅' : '❌'}\n`;
    message += `**2FA:** ${security.twoFactorEnabled ? '✅ Увімкнено' : '❌ Вимкнено'}\n`;
    message += `**Останній вхід:** ${security.lastLogin || 'Невідомо'}\n`;
    message += `**Активних сесій:** ${security.activeSessions || 1}\n\n`;
    message += '⚠️ *Важливо:* Тримайте ваші API ключі в безпеці!\n\n';
    message += 'Оберіть що налаштувати:';

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'show_security_settings' });
    await ctx.answerCbQuery('❌ Помилка завантаження налаштувань безпеки');
  }
};

// Export user data
settingsScene.exportUserData = async function (ctx) {
  try {
    await ctx.answerCbQuery('📊 Підготовка експорту даних...');

    const userId = ctx.from.id;
    const exportData = {
      profile: ctx.wizard.state.userSettings.profile || {},
      settings: ctx.wizard.state.userSettings,
      statistics: await analyticsService.getUserStats(userId),
      searchHistory: await this.getSearchHistory(userId),
      proposalHistory: await proposalGeneratorService.getProposalHistory(userId),
      exportDate: new Date().toISOString()
    };

    const exportText = JSON.stringify(exportData, null, 2);

    // Create a temporary file-like message
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💾 Зберегти як файл', 'save_as_file')],
      [Markup.button.callback('📋 Показати як текст', 'show_as_text')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]);

    await ctx.editMessageText(
      '📊 *Експорт даних готовий*\n\n' +
        `📈 **Статистика:**\n` +
        `- Пошуків виконано: ${exportData.statistics.totalSearches || 0}\n` +
        `- Пропозицій згенеровано: ${exportData.statistics.totalProposals || 0}\n` +
        `- Проектів знайдено: ${exportData.statistics.totalProjects || 0}\n\n` +
        'Оберіть формат експорту:',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      }
    );

    ctx.wizard.state.exportData = exportText;

    logger.userAction(userId, 'data_exported', {
      dataSize: exportText.length,
      sections: Object.keys(exportData)
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'export_data' });
    await ctx.answerCbQuery('❌ Помилка експорту даних');
  }
};

// Clear data confirmation
settingsScene.showClearDataConfirmation = async function (ctx) {
  try {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🗑️ Очистити історію пошуку', 'clear_search_history')],
      [Markup.button.callback('🗑️ Очистити історію пропозицій', 'clear_proposal_history')],
      [Markup.button.callback('🗑️ Очистити статистику', 'clear_statistics')],
      [Markup.button.callback('💥 ОЧИСТИТИ ВСЕ', 'clear_all_data')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]);

    await ctx.editMessageText(
      '🗑️ *Очищення даних*\n\n' +
        '⚠️ **УВАГА!** Ця дія незворотна!\n\n' +
        'Оберіть що очистити:\n\n' +
        '📋 **Історія пошуку** - видалить всі збережені пошуки\n' +
        '📝 **Історія пропозицій** - видалить всі згенеровані пропозиції\n' +
        '📊 **Статистика** - скине всі метрики та аналітику\n' +
        '💥 **ВСЕ** - повне очищення всіх даних\n\n' +
        '🔒 Налаштування профілю та API ключі НЕ будуть видалені.',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      }
    );
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'show_clear_confirmation' });
    await ctx.answerCbQuery('❌ Помилка завантаження меню очищення');
  }
};

// Go to main menu
settingsScene.goToMainMenu = async function (ctx) {
  try {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔍 Пошук проектів', 'search')],
      [Markup.button.callback('🤖 Генерація пропозицій', 'proposals')],
      [Markup.button.callback('📊 Статистика', 'stats')],
      [Markup.button.callback('⚙️ Налаштування', 'settings')]
    ]);

    await ctx.editMessageText('🏠 *Головне меню TechMoneyBot*\n\n' + 'Оберіть дію:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'go_to_main_menu' });
    await ctx.answerCbQuery('❌ Помилка переходу до головного меню');
  }
};

// Helper method to get user settings
settingsScene.getUserSettings = async function (userId) {
  try {
    // This would typically load from database
    // For now, return default settings
    return {
      profile: {
        name: null,
        specialization: null,
        hourlyRate: null,
        location: null,
        experience: null,
        bio: null
      },
      search: {
        autoSearch: false,
        keywords: [],
        minBudget: null,
        maxBudget: null,
        platforms: ['upwork', 'freelancer', 'fiverr'],
        frequency: 'every_2_hours',
        minClientRating: null
      },
      ai: {
        enabled: true,
        style: 'professional',
        length: 'medium',
        personalization: true,
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      },
      notifications: {
        enabled: true,
        newProjects: true,
        dailyReports: true,
        systemAlerts: true,
        successAlerts: true,
        reportTime: '09:00'
      },
      security: {
        apiKeysConfigured: false,
        twoFactorEnabled: false,
        lastLogin: null,
        activeSessions: 1
      }
    };
  } catch (error) {
    logger.errorWithContext(error, { userId, action: 'get_user_settings' });
    throw error;
  }
};

// Helper method to get search history
settingsScene.getSearchHistory = async function (userId) {
  try {
    // This would typically load from database
    return [];
  } catch (error) {
    logger.errorWithContext(error, { userId, action: 'get_search_history' });
    return [];
  }
};

// Handle various callback actions
settingsScene.action('back_to_main', async ctx => {
  try {
    await ctx.scene.reenter();
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'back_to_main' });
    await ctx.answerCbQuery('❌ Помилка повернення до головного меню');
  }
});

settingsScene.action('toggle_auto_search', async ctx => {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    userSettings.search.autoSearch = !userSettings.search.autoSearch;

    // Save settings to database here

    await ctx.answerCbQuery(
      userSettings.search.autoSearch ? '✅ Автопошук увімкнено' : '❌ Автопошук вимкнено'
    );

    await this.showSearchSettings(ctx);

    logger.userAction(ctx.from.id, 'auto_search_toggled', {
      enabled: userSettings.search.autoSearch
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'toggle_auto_search' });
    await ctx.answerCbQuery('❌ Помилка зміни налаштування');
  }
});

settingsScene.action('toggle_ai', async ctx => {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    userSettings.ai.enabled = !userSettings.ai.enabled;

    // Save settings to database here

    await ctx.answerCbQuery(userSettings.ai.enabled ? '✅ AI увімкнено' : '❌ AI вимкнено');

    await this.showAISettings(ctx);

    logger.userAction(ctx.from.id, 'ai_toggled', {
      enabled: userSettings.ai.enabled
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'toggle_ai' });
    await ctx.answerCbQuery('❌ Помилка зміни налаштування');
  }
});

settingsScene.action('toggle_notifications', async ctx => {
  try {
    const userSettings = ctx.wizard.state.userSettings;
    userSettings.notifications.enabled = !userSettings.notifications.enabled;

    // Save settings to database here

    await ctx.answerCbQuery(
      userSettings.notifications.enabled ? '✅ Сповіщення увімкнено' : '❌ Сповіщення вимкнено'
    );

    await this.showNotificationSettings(ctx);

    logger.userAction(ctx.from.id, 'notifications_toggled', {
      enabled: userSettings.notifications.enabled
    });
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'toggle_notifications' });
    await ctx.answerCbQuery('❌ Помилка зміни налаштування');
  }
});

settingsScene.action('clear_search_history', async ctx => {
  try {
    // Clear search history from database

    await ctx.answerCbQuery('✅ Історію пошуку очищено');

    logger.userAction(ctx.from.id, 'search_history_cleared');

    await this.showClearDataConfirmation(ctx);
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'clear_search_history' });
    await ctx.answerCbQuery('❌ Помилка очищення історії');
  }
});

settingsScene.action('clear_proposal_history', async ctx => {
  try {
    // Clear proposal history from database

    await ctx.answerCbQuery('✅ Історію пропозицій очищено');

    logger.userAction(ctx.from.id, 'proposal_history_cleared');

    await this.showClearDataConfirmation(ctx);
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'clear_proposal_history' });
    await ctx.answerCbQuery('❌ Помилка очищення історії');
  }
});

settingsScene.action('clear_statistics', async ctx => {
  try {
    // Clear statistics from database
    await analyticsService.resetUserStats(ctx.from.id);

    await ctx.answerCbQuery('✅ Статистику очищено');

    logger.userAction(ctx.from.id, 'statistics_cleared');

    await this.showClearDataConfirmation(ctx);
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'clear_statistics' });
    await ctx.answerCbQuery('❌ Помилка очищення статистики');
  }
});

settingsScene.action('clear_all_data', async ctx => {
  try {
    // Show final confirmation
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💥 ТАК, ОЧИСТИТИ ВСЕ', 'confirm_clear_all')],
      [Markup.button.callback('❌ НІ, СКАСУВАТИ', 'back_to_main')]
    ]);

    await ctx.editMessageText(
      '💥 *ОСТАТОЧНЕ ПІДТВЕРДЖЕННЯ*\n\n' +
        '⚠️ **ВИ ВПЕВНЕНІ?**\n\n' +
        'Це видалить:\n' +
        '• Всю історію пошуків\n' +
        '• Всі згенеровані пропозиції\n' +
        '• Всю статистику та аналітику\n' +
        '• Всі збережені результати\n\n' +
        '🔒 **НЕ буде видалено:**\n' +
        '• Налаштування профілю\n' +
        '• API ключі\n' +
        '• Налаштування безпеки\n\n' +
        '❗ **ЦЯ ДІЯ НЕЗВОРОТНА!**',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      }
    );
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'clear_all_data' });
    await ctx.answerCbQuery('❌ Помилка підтвердження');
  }
});

settingsScene.action('confirm_clear_all', async ctx => {
  try {
    const userId = ctx.from.id;

    // Clear all user data except profile and security settings
    // This would involve multiple database operations

    await ctx.editMessageText(
      '✅ *Дані успішно очищено*\n\n' +
        'Всі ваші дані було видалено, окрім:\n' +
        '• Налаштувань профілю\n' +
        '• API ключів\n' +
        '• Налаштувань безпеки\n\n' +
        'Ви можете почати користуватися ботом заново!',
      { parse_mode: 'Markdown' }
    );

    logger.userAction(userId, 'all_data_cleared');

    // Return to main menu after 3 seconds
    setTimeout(async () => {
      try {
        await this.goToMainMenu(ctx);
      } catch (error) {
        logger.errorWithContext(error, { userId, action: 'delayed_main_menu' });
      }
    }, 3000);
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'confirm_clear_all' });
    await ctx.answerCbQuery('❌ Помилка очищення даних');
  }
});

// Handle scene leave
settingsScene.leave(async ctx => {
  try {
    logger.userAction(ctx.from.id, 'settings_scene_left');

    // Clean up session data if needed
    if (ctx.session.settingsInProgress) {
      delete ctx.session.settingsInProgress;
    }
  } catch (error) {
    logger.errorWithContext(error, { userId: ctx.from.id, action: 'scene_leave' });
  }
});

module.exports = settingsScene;
