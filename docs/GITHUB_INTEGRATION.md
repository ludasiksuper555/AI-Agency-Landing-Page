# Інтеграція з GitHub

## Огляд

Цей документ описує процес інтеграції між Trae та GitHub репозиторієм [AI-Agency-Landing-Page](https://github.com/ludasiksuper555/AI-Agency-Landing-Page). Інтеграція забезпечує автоматичне розгортання, тестування та управління кодом проекту.

## Налаштування репозиторію

### Структура репозиторію

Репозиторій розміщено за адресою: https://github.com/ludasiksuper555/AI-Agency-Landing-Page

Основні гілки:
- `main` - основна гілка для продакшн-версії
- `develop` - гілка для розробки
- `gh-pages` - гілка для розгорнутої статичної версії сайту

### GitHub Actions

У проекті налаштовано два основних робочих процеси GitHub Actions:

1. **CI (Continuous Integration)** - `.github/workflows/ci.yml`
   - Запускається при кожному пуші або пул-реквесті в гілки main, master, develop
   - Виконує перевірку коду, типів та збірку проекту
   - Запускає тести для перевірки функціональності

2. **Deploy (Continuous Deployment)** - `.github/workflows/deploy.yml`
   - Запускається при кожному пуші в гілки main або master
   - Будує проект та експортує статичні файли
   - Розгортає сайт на GitHub Pages (гілка gh-pages)
   - Надсилає сповіщення про статус розгортання

## Інтеграція з Trae

### Налаштування Trae для роботи з GitHub

1. **Клонування репозиторію**

   ```bash
   git clone https://github.com/ludasiksuper555/AI-Agency-Landing-Page.git
   cd AI-Agency-Landing-Page
   ```

2. **Налаштування Trae**

   Переконайтеся, що Trae має доступ до локальної копії репозиторію. Для цього вкажіть шлях до проекту в налаштуваннях Trae.

3. **Робота з кодом**

   - Використовуйте Trae для аналізу та модифікації коду
   - Trae може допомогти з рефакторингом, оптимізацією та виправленням помилок
   - Використовуйте Trae для генерації нових компонентів та функціональності

### Робочий процес розробки

1. **Створення нової функціональності**

   ```bash
   git checkout -b feature/нова-функція
   # Використовуйте Trae для розробки
   git add .
   git commit -m "Додано нову функцію"
   git push origin feature/нова-функція
   ```

2. **Створення пул-реквесту**

   - Створіть пул-реквест з вашої гілки в `develop`
   - GitHub Actions автоматично запустить CI процес
   - Після перевірки та схвалення, злийте зміни в `develop`

3. **Розгортання на продакшн**

   ```bash
   git checkout develop
   git pull
   git checkout main
   git merge develop
   git push origin main
   ```

   GitHub Actions автоматично розгорне оновлену версію на GitHub Pages.

## Моніторинг та сповіщення

### Перевірка статусу розгортання

1. Відвідайте вкладку "Actions" в репозиторії GitHub для перегляду статусу виконання робочих процесів
2. Перевірте канал Slack `#deployments` для отримання сповіщень про розгортання

### Вирішення проблем

Якщо виникли проблеми з інтеграцією або розгортанням:

1. Перевірте логи GitHub Actions для виявлення помилок
2. Переконайтеся, що всі залежності правильно встановлені
3. Перевірте наявність конфліктів між гілками
4. Зверніться до документації Next.js щодо розгортання на GitHub Pages

## Корисні посилання

- [Репозиторій проекту](https://github.com/ludasiksuper555/AI-Agency-Landing-Page)
- [Живе демо](https://ludasiksuper555.github.io/AI-Agency-Landing-Page)
- [Документація GitHub Actions](https://docs.github.com/en/actions)
- [Документація Next.js](https://nextjs.org/docs)
- [Розгортання Next.js на GitHub Pages](https://nextjs.org/docs/deployment#github-pages)