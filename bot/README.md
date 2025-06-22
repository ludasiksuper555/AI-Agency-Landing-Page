# TechMoneyBot 🤖💰

**Автоматизований Telegram бот для пошуку та подачі заявок на IT проекти**

TechMoneyBot - це потужний інструмент для фрілансерів та IT-спеціалістів, який автоматизує процес пошуку проектів на платформах Upwork та Freelancer, генерує якісні пропозиції та допомагає збільшити шанси отримання проектів.

## 📋 Опис

TechMoneyBot - це потужний інструмент автоматизації для фрілансерів та агентств, який допомагає:

- 📊 **Знаходити 50-100 релевантних проектів щодня**
- ✍️ **Генерувати та відправляти 10-20 якісних пропозицій**
- 💰 **Збільшити шанси отримання проектів в 3-5 разів**
- ⏰ **Економити 4-6 годин щодня на рутинних задачах**

## ✨ Основні функції

### 🔍 Автоматичний пошук проектів

- Інтеграція з Upwork, Freelancer, Fiverr
- Розумна фільтрація за ключовими словами
- Сортування за рейтингом клієнта та актуальністю
- Автоматичний пошук кожні 2 години

### 🤖 AI-генерація пропозицій

- Персоналізовані пропозиції для кожного проекту
- Використання OpenAI GPT для якісного контенту
- Адаптація під специфіку проекту та клієнта
- Підтримка української та англійської мов

### 📊 Аналітика та звітність

- Детальна статистика роботи
- Щоденні та тижневі звіти
- Відстеження коефіцієнта відповідей
- Моніторинг ефективності

### ⚙️ Гнучкі налаштування

- Кастомізація ключових слів пошуку
- Налаштування лімітів та інтервалів
- Персоналізація шаблонів пропозицій
- Управління уведомленнями

## 🚀 Швидкий старт

### Передумови

- Node.js 18+
- npm або yarn
- MongoDB (опціонально)
- Redis (опціонально)

### Встановлення

1. **Клонування репозиторію**

```bash
git clone https://github.com/your-username/techmoneybot.git
cd techmoneybot
```

2. **Встановлення залежностей**

```bash
npm install
```

3. **Налаштування середовища**

```bash
cp .env.example .env
```

4. **Редагування .env файлу**

```env
BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
UPWORK_API_KEY=your_upwork_api_key
# ... інші налаштування
```

5. **Запуск бота**

```bash
# Розробка
npm run dev

# Продакшн
npm start
```

## 🔧 Конфігурація

### Telegram Bot

1. Створіть бота через [@BotFather](https://t.me/BotFather)
2. Отримайте токен бота
3. Додайте токен в `.env` файл

### API ключі платформ

#### Upwork

1. Зареєструйтеся на [Upwork Developers](https://developers.upwork.com/)
2. Створіть додаток та отримайте API ключі
3. Додайте ключі в `.env`

#### Freelancer

1. Перейдіть на [Freelancer Developer](https://developers.freelancer.com/)
2. Створіть додаток
3. Отримайте API ключі

#### OpenAI

1. Зареєструйтеся на [OpenAI](https://platform.openai.com/)
2. Створіть API ключ
3. Додайте в `.env`

## 📱 Використання

### Основні команди

- `/start` - Початок роботи з ботом
- `/search` - Пошук нових проектів
- `/proposals` - Робота з пропозиціями
- `/stats` - Перегляд статистики
- `/settings` - Налаштування бота
- `/help` - Довідка

### Робочий процес

1. **Запустіть бота** командою `/start`
2. **Налаштуйте параметри** через `/settings`
3. **Запустіть пошук** командою `/search`
4. **Переглядайте знайдені проекти** та генеруйте пропозиції
5. **Відстежуйте статистику** через `/stats`

## 🏗️ Архітектура

```
bot/
├── index.js              # Головний файл бота
├── package.json          # Залежності
├── .env.example          # Приклад конфігурації
├── README.md             # Документація
├── config/
│   ├── database.js       # Налаштування БД
│   └── apis.js           # Конфігурація API
├── services/
│   ├── projectSearch.js  # Сервіс пошуку проектів
│   ├── proposalGenerator.js # Генерація пропозицій
│   ├── analytics.js      # Аналітика
│   └── notifications.js  # Уведомлення
├── models/
│   ├── Project.js        # Модель проекту
│   ├── Proposal.js       # Модель пропозиції
│   └── User.js           # Модель користувача
├── scenes/
│   ├── search.js         # Сцена пошуку
│   ├── proposals.js      # Сцена пропозицій
│   └── settings.js       # Сцена налаштувань
├── utils/
│   ├── logger.js         # Логування
│   ├── helpers.js        # Допоміжні функції
│   └── validators.js     # Валідація
├── data/
│   ├── stats.json        # Статистика
│   └── templates/        # Шаблони пропозицій
└── logs/
    └── bot.log           # Логи
```

## 🔒 Безпека

- Всі API ключі зберігаються в змінних середовища
- Використання rate limiting для запобігання спаму
- Валідація всіх вхідних даних
- Логування всіх дій для аудиту
- Шифрування чутливих даних

## 📊 Моніторинг

### Метрики

- Кількість знайдених проектів
- Кількість відправлених пропозицій
- Коефіцієнт відповідей
- Час відгуку API
- Помилки та винятки

### Логування

- Структуровані логи в JSON форматі
- Різні рівні логування (error, warn, info, debug)
- Ротація логів
- Інтеграція з зовнішніми системами моніторингу

## 🚀 Розгортання

### Docker

```bash
# Збірка образу
docker build -t techmoneybot .

# Запуск контейнера
docker run -d --name techmoneybot \
  --env-file .env \
  -p 3000:3000 \
  techmoneybot
```

### Docker Compose

```bash
docker-compose up -d
```

### Heroku

```bash
# Встановлення Heroku CLI
npm install -g heroku

# Логін
heroku login

# Створення додатку
heroku create your-bot-name

# Налаштування змінних
heroku config:set BOT_TOKEN=your_token
heroku config:set OPENAI_API_KEY=your_key

# Деплой
git push heroku main
```

## 🧪 Тестування

```bash
# Запуск всіх тестів
npm test

# Тести з покриттям
npm run test:coverage

# Лінтинг
npm run lint

# Виправлення лінтингу
npm run lint:fix
```

## 🤝 Внесок у розробку

1. Форкніть репозиторій
2. Створіть гілку для нової функції (`git checkout -b feature/amazing-feature`)
3. Зробіть коміт змін (`git commit -m 'Add amazing feature'`)
4. Запушіть в гілку (`git push origin feature/amazing-feature`)
5. Створіть Pull Request

## 📄 Ліцензія

Цей проект ліцензовано під MIT License - дивіться файл [LICENSE](LICENSE) для деталей.

## 🆘 Підтримка

- 📧 Email: support@techmoney.bot
- 💬 Telegram: [@techmoneybot_support](https://t.me/techmoneybot_support)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/techmoneybot/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/your-username/techmoneybot/wiki)

## 🗺️ Roadmap

### v1.1

- [ ] Інтеграція з додатковими платформами (99designs, Toptal)
- [ ] Покращена AI-генерація з контекстом
- [ ] Мобільний додаток

### v1.2

- [ ] Машинне навчання для оптимізації пропозицій
- [ ] Інтеграція з CRM системами
- [ ] Автоматичне відстеження проектів

### v2.0

- [ ] Веб-інтерфейс
- [ ] Командна робота
- [ ] Розширена аналітика
- [ ] API для інтеграцій

## 📈 Статистика

- ⭐ GitHub Stars: ![GitHub stars](https://img.shields.io/github/stars/your-username/techmoneybot)
- 🍴 Forks: ![GitHub forks](https://img.shields.io/github/forks/your-username/techmoneybot)
- 🐛 Issues: ![GitHub issues](https://img.shields.io/github/issues/your-username/techmoneybot)
- 📦 Downloads: ![npm downloads](https://img.shields.io/npm/dm/techmoneybot)

---

**Зроблено з ❤️ командою TechMoney**
