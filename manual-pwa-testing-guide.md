# 🧪 Manual PWA Testing Guide - Етап 6

## 🎯 Інструкція для Ручного Тестування PWA

### 📋 Передумови

- ✅ Chrome/Edge браузер (версія 90+)
- ✅ Сервер розробки запущено (`npm run dev`)
- ✅ DevTools відкрито (F12)
- ✅ HTTPS або localhost

---

## 🔒 БЛОК 1: SECURITY MANUAL TESTS

### 🛡️ Test 1: CSP Headers Verification

**Мета:** Перевірити Content Security Policy заголовки

**Кроки:**

1. Відкрити http://localhost:3000
2. DevTools → Network tab
3. Перезавантажити сторінку (Ctrl+F5)
4. Клікнути на головний документ (localhost)
5. Перевірити Response Headers:

```
✅ Очікувані заголовки:
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

### 🚦 Test 2: Rate Limiting Manual Test

**Мета:** Перевірити обмеження запитів

**Кроки:**

1. Відкрити DevTools → Console
2. Виконати швидкі запити:

```javascript
// Тест API rate limiting
for (let i = 0; i < 10; i++) {
  fetch('/api/test')
    .then(r => console.log(`Request ${i}: ${r.status}`))
    .catch(e => console.log(`Request ${i}: Error`));
}
```

3. Перевірити заголовки rate limiting:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`

**Очікуваний результат:** Після ліміту - HTTP 429
**Результат:** ✅/❌
**Примітки:** **********\_**********

---

## 📱 БЛОК 2: PWA MANUAL TESTS

### 🔧 Test 3: Service Worker Registration

**Мета:** Перевірити реєстрацію та роботу Service Worker

**Кроки:**

1. DevTools → Application → Service Workers
2. Перевірити статус: "Activated and is running"
3. Перевірити Source: `/sw.js` або `/service-worker.js`
4. Клікнути "Update" для оновлення
5. Перевірити Events в консолі

**Чек-лист:**

- [ ] Service Worker зареєстровано
- [ ] Статус: Activated
- [ ] Немає помилок в консолі
- [ ] Update працює

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

### 📦 Test 4: Cache Storage

**Мета:** Перевірити кешування ресурсів

**Кроки:**

1. DevTools → Application → Storage → Cache Storage
2. Перевірити наявність кешів:
   - `static-cache-v1`
   - `dynamic-cache-v1`
   - `pages-cache-v1`
3. Розгорнути кеші та перевірити вміст
4. Перевірити кешування нових ресурсів:
   - Перейти на нову сторінку
   - Перевірити додавання в кеш

**Чек-лист:**

- [ ] Кеші створені
- [ ] Статичні ресурси кешуються
- [ ] Сторінки кешуються
- [ ] Динамічне кешування працює

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

### 📄 Test 5: Web App Manifest

**Мета:** Перевірити валідність та повноту manifest

**Кроки:**

1. DevTools → Application → Manifest
2. Перевірити поля:

```json
{
  "name": "Meat Industry Analytics",
  "short_name": "MeatAnalytics",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [...]
}
```

3. Перевірити іконки:
   - Всі розміри доступні (72, 96, 128, 144, 152, 192, 384, 512)
   - Іконки завантажуються без помилок
4. Перевірити shortcuts (якщо є)

**Чек-лист:**

- [ ] Manifest валідний
- [ ] Всі обов'язкові поля присутні
- [ ] Іконки доступні
- [ ] Немає помилок завантаження

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

### 🌐 Test 6: Offline Functionality

**Мета:** Перевірити роботу в офлайн режимі

**Кроки:**

1. Завантажити головну сторінку
2. Перейти на кілька сторінок для кешування
3. DevTools → Network → Throttling → Offline
4. Тестувати навігацію:
   - Головна сторінка
   - Кешовані сторінки
   - Некешовані сторінки
5. Перевірити офлайн індикатор
6. Тестувати форми офлайн:
   - Заповнити форму
   - Відправити (має зберегтися локально)

**Чек-лист:**

- [ ] Кешовані сторінки відкриваються офлайн
- [ ] Показується офлайн індикатор
- [ ] Офлайн сторінка відображається для некешованих ресурсів
- [ ] Форми зберігаються локально

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

### 📲 Test 7: PWA Installation

**Мета:** Перевірити можливість встановлення як додаток

**Кроки:**

1. Перевірити появу install prompt в адресному рядку
2. Клікнути на іконку встановлення
3. Підтвердити встановлення
4. Перевірити:
   - Іконка на робочому столі/меню
   - Запуск як окремий додаток
   - Відсутність адресного рядка
   - Власне вікно додатку

**Альтернативний спосіб:**

1. Chrome Menu → Install [App Name]
2. Або DevTools → Application → Manifest → "Add to homescreen"

**Чек-лист:**

- [ ] Install prompt з'являється
- [ ] Встановлення проходить успішно
- [ ] Додаток запускається окремо
- [ ] UI виглядає як нативний додаток

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

### 🔔 Test 8: Push Notifications

**Мета:** Перевірити push-повідомлення

**Передумови:** VAPID ключі налаштовані в .env

**Кроки:**

1. Дозволити повідомлення в браузері
2. Перевірити підписку:
   - DevTools → Application → Storage → IndexedDB
   - Знайти push subscription
3. Тестувати через API:

```javascript
// В DevTools Console
fetch('/api/pwa/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Notification',
    body: 'This is a test notification',
    icon: '/icons/icon-192x192.png',
  }),
})
  .then(r => r.json())
  .then(data => console.log('Notification sent:', data));
```

4. Перевірити отримання повідомлення
5. Тестувати дії в повідомленні (якщо є)

**Чек-лист:**

- [ ] Дозвіл на повідомлення працює
- [ ] Підписка зберігається
- [ ] Повідомлення доставляються
- [ ] Іконки відображаються
- [ ] Дії працюють (якщо є)

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

### 🔄 Test 9: Background Sync

**Мета:** Перевірити фонову синхронізацію

**Кроки:**

1. Перейти в офлайн режим
2. Заповнити та відправити форму
3. Перевірити збереження в IndexedDB:
   - DevTools → Application → Storage → IndexedDB
   - Знайти pending requests
4. Увімкнути мережу
5. Перевірити автоматичну синхронізацію
6. Перевірити очищення pending requests

**Чек-лист:**

- [ ] Форми зберігаються офлайн
- [ ] Background sync реєструється
- [ ] Синхронізація відбувається при відновленні мережі
- [ ] Pending requests очищаються

**Результат:** ✅/❌
**Примітки:** **********\_**********

---

## 🔍 БЛОК 3: LIGHTHOUSE PWA AUDIT

### 📊 Test 10: Lighthouse PWA Score

**Мета:** Отримати офіційну оцінку PWA

**Кроки:**

1. DevTools → Lighthouse
2. Вибрати категорії:
   - ✅ Progressive Web App
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
3. Клікнути "Generate report"
4. Дочекатися завершення аудиту
5. Проаналізувати результати:

**Цільові показники:**

- 🎯 PWA Score: ≥90
- 🎯 Performance: ≥80
- 🎯 Accessibility: ≥90
- 🎯 Best Practices: ≥90
- 🎯 SEO: ≥90

**Результати:**

- PWA: \_\_\_/100
- Performance: \_\_\_/100
- Accessibility: \_\_\_/100
- Best Practices: \_\_\_/100
- SEO: \_\_\_/100

**Статус:** ✅/❌
**Примітки:** **********\_**********

---

## 🛠️ БЛОК 4: SECURITY TOOLS TESTING

### 🔍 Test 11: Mozilla Observatory

**Мета:** Перевірити безпеку через зовнішній сервіс

**Кроки:**

1. Відкрити https://observatory.mozilla.org/
2. Ввести URL сайту (якщо доступний онлайн)
3. Запустити сканування
4. Проаналізувати результати

**Цільовий результат:** A+ або A
**Результат:** **\_
**Примітки:** ********\_\_\_**********

---

### 🛡️ Test 12: Security Headers Check

**Мета:** Перевірити security headers

**Кроки:**

1. Відкрити https://securityheaders.com/
2. Ввести URL сайту
3. Запустити аналіз
4. Перевірити наявність заголовків:
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy
   - Permissions-Policy

**Цільовий результат:** A+ або A
**Результат:** **\_
**Примітки:** ********\_\_\_**********

---

## 📋 FINAL CHECKLIST

### ✅ Security Tests

- [ ] TC-SEC-001: CSP Headers ✅/❌
- [ ] TC-SEC-002: Rate Limiting ✅/❌
- [ ] TC-SEC-003: Security Headers ✅/❌
- [ ] TC-SEC-004: Mozilla Observatory ✅/❌

### ✅ PWA Tests

- [ ] TC-PWA-001: Service Worker ✅/❌
- [ ] TC-PWA-002: Cache Storage ✅/❌
- [ ] TC-PWA-003: Web App Manifest ✅/❌
- [ ] TC-PWA-004: Offline Functionality ✅/❌
- [ ] TC-PWA-005: PWA Installation ✅/❌
- [ ] TC-PWA-006: Push Notifications ✅/❌
- [ ] TC-PWA-007: Background Sync ✅/❌
- [ ] TC-PWA-008: Lighthouse Score ✅/❌

### 📊 Summary

- **Всього тестів:** 12
- **Пройдено:** \_\_\_
- **Провалено:** \_\_\_
- **Відсоток успіху:** \_\_\_%

### 🎯 Критерії Успіху

- ✅ Всі security тести пройдені
- ✅ PWA встановлюється та працює офлайн
- ✅ Lighthouse PWA score ≥90
- ✅ Відсоток успіху ≥85%

---

## 🚀 Наступні Кроки

### Якщо всі тести пройдені:

1. ✅ Створити production build
2. ✅ Протестувати на production
3. ✅ Налаштувати моніторинг
4. ✅ Документувати результати

### Якщо є провалені тести:

1. ❌ Проаналізувати причини
2. ❌ Виправити проблеми
3. ❌ Повторити тестування
4. ❌ Оновити документацію

---

**Тестувальник:** ******\_\_\_******
**Дата:** ******\_\_\_******
**Версія:** 1.0
**Статус:** 🔄 В процесі / ✅ Завершено / ❌ Потребує доопрацювання
