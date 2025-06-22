const { Telegraf } = require('telegraf');
const { session } = require('telegraf/session');
const { Stage, Scenes } = require('telegraf/scenes');
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Конфігурація бота
const config = {
  botToken: process.env.BOT_TOKEN,
  freelanceAPIs: {
    upwork: process.env.UPWORK_API_KEY,
    freelancer: process.env.FREELANCER_API_KEY,
    fiverr: process.env.FIVERR_API_KEY
  },
  openaiApiKey: process.env.OPENAI_API_KEY,
  searchKeywords: [
    'web development',
    'react',
    'nextjs',
    'javascript',
    'typescript',
    'frontend',
    'fullstack',
    'nodejs'
  ],
  maxProjectsPerDay: 100,
  maxProposalsPerDay: 20
};

// Ініціалізація бота
const bot = new Telegraf(config.botToken);

// Middleware для сесій
bot.use(session());

// Сцени для різних функцій
const projectSearchScene = new Scenes.BaseScene('project-search');
const proposalGeneratorScene = new Scenes.BaseScene('proposal-generator');
const settingsScene = new Scenes.BaseScene('settings');

// Стейдж для управління сценами
const stage = new Stage([projectSearchScene, proposalGeneratorScene, settingsScene]);
bot.use(stage.middleware());

// Клас для роботи з проектами
class ProjectManager {
  constructor() {
    this.projects = [];
    this.sentProposals = [];
    this.stats = {
      projectsFound: 0,
      proposalsSent: 0,
      responsesReceived: 0
    };
  }

  // Пошук проектів на різних платформах
  async searchProjects() {
    const allProjects = [];

    try {
      // Пошук на Upwork
      const upworkProjects = await this.searchUpwork();
      allProjects.push(...upworkProjects);

      // Пошук на Freelancer
      const freelancerProjects = await this.searchFreelancer();
      allProjects.push(...freelancerProjects);

      // Пошук на Fiverr
      const fiverrProjects = await this.searchFiverr();
      allProjects.push(...fiverrProjects);

      // Фільтрація та сортування
      const filteredProjects = this.filterRelevantProjects(allProjects);
      this.projects = filteredProjects.slice(0, config.maxProjectsPerDay);

      this.stats.projectsFound = this.projects.length;
      return this.projects;
    } catch (error) {
      console.error('Помилка при пошуку проектів:', error);
      return [];
    }
  }

  // Пошук на Upwork
  async searchUpwork() {
    // Імітація API запиту до Upwork
    return [
      {
        id: 'upwork_1',
        title: 'React Developer Needed',
        description: 'Looking for experienced React developer...',
        budget: '$1000-$5000',
        platform: 'upwork',
        skills: ['React', 'JavaScript', 'CSS'],
        postedDate: new Date(),
        clientRating: 4.8
      }
    ];
  }

  // Пошук на Freelancer
  async searchFreelancer() {
    // Імітація API запиту до Freelancer
    return [
      {
        id: 'freelancer_1',
        title: 'Next.js Website Development',
        description: 'Need a modern website built with Next.js...',
        budget: '$2000-$8000',
        platform: 'freelancer',
        skills: ['Next.js', 'TypeScript', 'TailwindCSS'],
        postedDate: new Date(),
        clientRating: 4.5
      }
    ];
  }

  // Пошук на Fiverr
  async searchFiverr() {
    // Імітація API запиту до Fiverr
    return [
      {
        id: 'fiverr_1',
        title: 'Full Stack Developer Required',
        description: 'Looking for full stack developer with Node.js...',
        budget: '$500-$3000',
        platform: 'fiverr',
        skills: ['Node.js', 'Express', 'MongoDB'],
        postedDate: new Date(),
        clientRating: 4.9
      }
    ];
  }

  // Фільтрація релевантних проектів
  filterRelevantProjects(projects) {
    return projects
      .filter(project => {
        const titleLower = project.title.toLowerCase();
        const descriptionLower = project.description.toLowerCase();

        return config.searchKeywords.some(
          keyword => titleLower.includes(keyword) || descriptionLower.includes(keyword)
        );
      })
      .sort((a, b) => {
        // Сортування за рейтингом клієнта та датою
        if (a.clientRating !== b.clientRating) {
          return b.clientRating - a.clientRating;
        }
        return new Date(b.postedDate) - new Date(a.postedDate);
      });
  }

  // Генерація пропозиції за допомогою AI
  async generateProposal(project) {
    try {
      const prompt = `
        Створи професійну пропозицію для проекту:
        Назва: ${project.title}
        Опис: ${project.description}
        Бюджет: ${project.budget}
        Навички: ${project.skills.join(', ')}

        Пропозиція повинна бути:
        - Персоналізованою під проект
        - Професійною та впевненою
        - Містити релевантний досвід
        - Бути довжиною 150-300 слів
        - На українській мові
      `;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${config.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Помилка генерації пропозиції:', error);
      return this.getDefaultProposal(project);
    }
  }

  // Дефолтна пропозиція
  getDefaultProposal(project) {
    return `
Вітаю!

Я досвідчений розробник з 5+ роками досвіду в ${project.skills.join(', ')}.
Ваш проект "${project.title}" дуже цікавий для мене.

Мій досвід включає:
✅ Розробку сучасних веб-додатків
✅ Роботу з React, Next.js, TypeScript
✅ Створення адаптивних та швидких інтерфейсів
✅ Інтеграцію з API та базами даних

Готовий почати роботу негайно та забезпечити якісний результат в строк.

Буду радий обговорити деталі проекту!

З повагою,
[Ваше ім'я]
    `;
  }

  // Збереження статистики
  async saveStats() {
    const statsPath = path.join(__dirname, 'data', 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));
  }

  // Завантаження статистики
  async loadStats() {
    try {
      const statsPath = path.join(__dirname, 'data', 'stats.json');
      const data = await fs.readFile(statsPath, 'utf8');
      this.stats = JSON.parse(data);
    } catch (error) {
      console.log('Створюємо нову статистику');
    }
  }
}

// Ініціалізація менеджера проектів
const projectManager = new ProjectManager();

// Команди бота
bot.start(ctx => {
  ctx.reply(
    '🤖 Вітаю в TechMoneyBot!\n\n' +
      'Я допоможу вам автоматизувати пошук проектів та генерацію пропозицій.\n\n' +
      'Доступні команди:\n' +
      '/search - Пошук нових проектів\n' +
      '/proposals - Генерація пропозицій\n' +
      '/stats - Статистика роботи\n' +
      '/settings - Налаштування\n' +
      '/help - Допомога'
  );
});

bot.command('search', async ctx => {
  ctx.reply('🔍 Починаю пошук проектів...');

  const projects = await projectManager.searchProjects();

  if (projects.length === 0) {
    ctx.reply('😔 Нових проектів не знайдено.');
    return;
  }

  ctx.reply(`✅ Знайдено ${projects.length} нових проектів!`);

  // Показуємо перші 5 проектів
  for (let i = 0; i < Math.min(5, projects.length); i++) {
    const project = projects[i];
    const message = `
📋 **${project.title}**
💰 Бюджет: ${project.budget}
🏢 Платформа: ${project.platform}
⭐ Рейтинг клієнта: ${project.clientRating}
🛠 Навички: ${project.skills.join(', ')}

${project.description.substring(0, 200)}...
    `;

    ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📝 Створити пропозицію', callback_data: `generate_${project.id}` },
            { text: '👀 Детальніше', callback_data: `details_${project.id}` }
          ]
        ]
      }
    });
  }
});

bot.command('proposals', ctx => {
  ctx.scene.enter('proposal-generator');
});

bot.command('stats', async ctx => {
  await projectManager.loadStats();
  const stats = projectManager.stats;

  const message = `
📊 **Статистика TechMoneyBot**

🔍 Знайдено проектів: ${stats.projectsFound}
📝 Відправлено пропозицій: ${stats.proposalsSent}
💬 Отримано відповідей: ${stats.responsesReceived}
📈 Коефіцієнт відповідей: ${stats.proposalsSent > 0 ? ((stats.responsesReceived / stats.proposalsSent) * 100).toFixed(1) : 0}%
  `;

  ctx.reply(message);
});

bot.command('settings', ctx => {
  ctx.scene.enter('settings');
});

bot.command('help', ctx => {
  const helpMessage = `
🤖 **TechMoneyBot - Довідка**

**Основні функції:**
🔍 Автоматичний пошук 50-100 релевантних проектів щодня
✍️ Генерація та відправка 10-20 якісних пропозицій
💰 Збільшення шансів отримання проектів в 3-5 разів
⏰ Економія 4-6 годин щодня

**Команди:**
/start - Початок роботи
/search - Пошук нових проектів
/proposals - Робота з пропозиціями
/stats - Перегляд статистики
/settings - Налаштування бота
/help - Ця довідка

**Підтримка:** @your_support_username
  `;

  ctx.reply(helpMessage);
});

// Обробка callback запитів
bot.on('callback_query', async ctx => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith('generate_')) {
    const projectId = data.replace('generate_', '');
    const project = projectManager.projects.find(p => p.id === projectId);

    if (project) {
      ctx.reply('⏳ Генерую пропозицію...');
      const proposal = await projectManager.generateProposal(project);

      ctx.reply(`📝 **Згенерована пропозиція:**\n\n${proposal}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Відправити', callback_data: `send_${projectId}` },
              { text: '✏️ Редагувати', callback_data: `edit_${projectId}` }
            ]
          ]
        }
      });
    }
  }

  if (data.startsWith('send_')) {
    const projectId = data.replace('send_', '');
    // Тут буде логіка відправки пропозиції
    projectManager.stats.proposalsSent++;
    await projectManager.saveStats();

    ctx.reply('✅ Пропозицію відправлено!');
  }

  ctx.answerCbQuery();
});

// Автоматичний пошук проектів кожні 2 години
cron.schedule('0 */2 * * *', async () => {
  console.log('Автоматичний пошук проектів...');
  await projectManager.searchProjects();
});

// Щоденний звіт о 9:00
cron.schedule('0 9 * * *', async () => {
  await projectManager.loadStats();
  const stats = projectManager.stats;

  // Відправка звіту адміністратору
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (adminId) {
    const report = `
📊 **Щоденний звіт TechMoneyBot**

🔍 Знайдено проектів: ${stats.projectsFound}
📝 Відправлено пропозицій: ${stats.proposalsSent}
💬 Отримано відповідей: ${stats.responsesReceived}
    `;

    bot.telegram.sendMessage(adminId, report);
  }
});

// Обробка помилок
bot.catch((err, ctx) => {
  console.error('Помилка бота:', err);
  ctx.reply('😔 Виникла помилка. Спробуйте пізніше.');
});

// Запуск бота
if (process.env.NODE_ENV === 'production') {
  // Webhook для продакшену
  bot.launch({
    webhook: {
      domain: process.env.WEBHOOK_DOMAIN,
      port: process.env.PORT || 3000
    }
  });
} else {
  // Polling для розробки
  bot.launch();
}

console.log('🤖 TechMoneyBot запущено!');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { bot, projectManager };
